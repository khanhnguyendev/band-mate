import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { TranscriptionService } from '../transcription/transcription.service'
import { WalletService } from '../wallet/wallet.service'
import { TRANSCRIBE_AUDIO_QUEUE } from '../submissions/submissions.service'

export const SCORE_SPEAKING_QUEUE = 'score-speaking'

interface TranscribeJobData {
  submissionId: string
}

@Processor(TRANSCRIBE_AUDIO_QUEUE, { concurrency: 2 })
export class TranscribeAudioWorker extends WorkerHost {
  private readonly logger = new Logger(TranscribeAudioWorker.name)

  constructor(
    private prisma: PrismaService,
    private transcription: TranscriptionService,
    private wallet: WalletService,
    @InjectQueue(SCORE_SPEAKING_QUEUE) private scoreSpeakingQueue: Queue,
  ) {
    super()
  }

  async process(job: Job<TranscribeJobData>): Promise<void> {
    const { submissionId } = job.data

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
    })

    // Idempotency: skip if already transcribed
    if (submission.transcript) {
      await this.scoreSpeakingQueue.add(
        'score',
        { submissionId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      )
      return
    }

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'transcribing' },
    })

    const transcript = await this.transcription.transcribeAudio(submission.audioKey!)

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { transcript, status: 'queued' },
    })

    await this.scoreSpeakingQueue.add(
      'score',
      { submissionId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    )

    this.logger.log(`Transcribed submission ${submissionId}`)
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TranscribeJobData>, error: Error): Promise<void> {
    const { submissionId } = job.data
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1)

    this.logger.error(`Transcription failed for ${submissionId}: ${error.message}`)

    if (isLastAttempt) {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'failed' },
      })

      const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } })
      if (submission?.reservationId) {
        await this.wallet.refund(submission.reservationId, `refund:${submissionId}`).catch((e) =>
          this.logger.error(`Refund failed for ${submissionId}: ${e.message}`),
        )
      }
    }
  }
}
