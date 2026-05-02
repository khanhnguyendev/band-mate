import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { WalletService } from '../wallet/wallet.service'
import { QuestionsService } from '../questions/questions.service'

export const SCORE_WRITING_QUEUE = 'score-writing'
export const TRANSCRIBE_AUDIO_QUEUE = 'transcribe-audio'

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private wallet: WalletService,
    private questions: QuestionsService,
    @InjectQueue(SCORE_WRITING_QUEUE) private scoreWritingQueue: Queue,
    @InjectQueue(TRANSCRIBE_AUDIO_QUEUE) private transcribeAudioQueue: Queue,
  ) {}

  async submitWriting(userId: string, questionId: string, text: string) {
    const question = await this.questions.findQuestionById(questionId)
    if (!question) throw new NotFoundException('Question not found')

    const creditCost = 2

    const reservation = await this.wallet.reserve(
      userId,
      creditCost,
      `Writing submission – question ${questionId}`,
      `reserve:writing:${userId}:${questionId}:${Date.now()}`,
    )

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        questionId,
        skill: 'writing',
        status: 'queued',
        inputText: text,
        creditCost,
        reservationId: reservation.id,
      },
    })

    await this.scoreWritingQueue.add(
      'score',
      { submissionId: submission.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    )

    return {
      submissionId: submission.id,
      status: submission.status,
      creditCost,
      reservationId: reservation.id,
    }
  }

  async getStatus(submissionId: string, userId: string) {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, userId },
      include: { report: { select: { id: true } } },
    })
    if (!submission) throw new NotFoundException('Submission not found')

    return {
      submissionId: submission.id,
      status: submission.status,
      reportId: submission.report?.id ?? null,
    }
  }

  async getSpeakingUploadUrl(userId: string, questionId: string) {
    const question = await this.questions.findQuestionById(questionId)
    if (!question) throw new NotFoundException('Question not found')

    const audioKey = `speaking/${userId}/${Date.now()}.webm`
    const { data, error } = await this.supabase.client.storage
      .from('audio-submissions')
      .createSignedUploadUrl(audioKey)

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`)
    }

    return { uploadUrl: data.signedUrl, audioKey }
  }

  async submitSpeaking(userId: string, questionId: string, audioKey: string) {
    const question = await this.questions.findQuestionById(questionId)
    if (!question) throw new NotFoundException('Question not found')

    const creditCost = 2

    const reservation = await this.wallet.reserve(
      userId,
      creditCost,
      `Speaking submission – question ${questionId}`,
      `reserve:speaking:${userId}:${questionId}:${Date.now()}`,
    )

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        questionId,
        skill: 'speaking',
        status: 'queued',
        audioKey,
        creditCost,
        reservationId: reservation.id,
      },
    })

    await this.transcribeAudioQueue.add(
      'transcribe',
      { submissionId: submission.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    )

    return {
      submissionId: submission.id,
      status: submission.status,
      creditCost,
      reservationId: reservation.id,
    }
  }

  async listByUser(userId: string, skill?: string) {
    return this.prisma.submission.findMany({
      where: { userId, ...(skill ? { skill: skill as any } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, skill: true, status: true, creditCost: true, createdAt: true },
    })
  }
}
