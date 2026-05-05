import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { AnthropicService } from '../anthropic/anthropic.service'
import { WalletService } from '../wallet/wallet.service'
import { NotificationService } from '../notification/notification.service'
import { SCORE_WRITING_QUEUE } from '../submissions/submissions.service'

interface ScoringJobData {
  submissionId: string
}

interface CriterionResult {
  name: string
  band: number
  explanation: string
  strengths: string[]
  weaknesses: string[]
}

interface ScoringResult {
  criteria: CriterionResult[]
  improvementTasks: { description: string; criterion?: string }[]
}

function clampBand(value: number): number {
  const clamped = Math.min(9, Math.max(0, value))
  return Math.round(clamped * 2) / 2
}

@Processor(SCORE_WRITING_QUEUE, { concurrency: 2 })
export class ScoreWritingWorker extends WorkerHost {
  private readonly logger = new Logger(ScoreWritingWorker.name)

  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicService,
    private wallet: WalletService,
    private notification: NotificationService,
  ) {
    super()
  }

  async process(job: Job<ScoringJobData>): Promise<void> {
    const { submissionId } = job.data

    // Idempotency: skip if already completed
    const existing = await this.prisma.scoreReport.findUnique({ where: { submissionId } })
    if (existing) return

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'scoring' },
    })

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { question: { include: { set: true } } },
    })

    const promptPack = await this.prisma.promptPack.findFirstOrThrow({
      where: { skill: 'writing', isActive: true },
    })

    const userPrompt = (promptPack.userPromptTemplate as string)
      .replace('{{task_type}}', submission.question.set.taskType)
      .replace('{{prompt}}', submission.question.prompt)
      .replace('{{response}}', submission.inputText ?? '')

    const message = await this.anthropic.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: promptPack.systemPrompt as string,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const scoring = JSON.parse(rawText) as ScoringResult

    const criteria = scoring.criteria.map((c) => ({ ...c, band: clampBand(c.band) }))
    const overallBand = clampBand(criteria.reduce((sum, c) => sum + c.band, 0) / criteria.length)

    await this.prisma.$transaction(async (tx) => {
      const report = await tx.scoreReport.create({
        data: {
          submissionId,
          userId: submission.userId,
          skill: 'writing',
          overallBand,
          rawAiResponse: scoring as unknown as Parameters<typeof tx.scoreReport.create>[0]['data']['rawAiResponse'],
          isEstimate: true,
        },
      })

      for (const c of criteria) {
        await tx.criterionRow.create({
          data: {
            reportId: report.id,
            criterionName: c.name,
            band: c.band,
            explanation: c.explanation,
            strengths: c.strengths ?? [],
            weaknesses: c.weaknesses ?? [],
          },
        })
      }

      for (const task of scoring.improvementTasks ?? []) {
        await tx.improvementTask.create({
          data: {
            reportId: report.id,
            userId: submission.userId,
            description: task.description,
            skill: 'writing',
            criterion: task.criterion ?? null,
          },
        })
      }

      await tx.submission.update({
        where: { id: submissionId },
        data: { status: 'completed' },
      })
    })

    if (submission.reservationId) {
      await this.wallet.consume(submission.reservationId, `consume:${submissionId}`)
    }

    this.logger.log(`Scored submission ${submissionId} — band ${overallBand}`)

    const report = await this.prisma.scoreReport.findUnique({ where: { submissionId } })
    if (report) {
      this.notification.sendReportReady(submission.userId, report.id, 'writing', overallBand).catch(() => {})
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ScoringJobData>, error: Error): Promise<void> {
    const { submissionId } = job.data
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1)

    this.logger.error(`Job failed for submission ${submissionId}: ${error.message}`)

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
