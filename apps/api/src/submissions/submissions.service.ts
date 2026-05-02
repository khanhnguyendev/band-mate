import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { WalletService } from '../wallet/wallet.service'
import { QuestionsService } from '../questions/questions.service'

export const SCORE_WRITING_QUEUE = 'score-writing'

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private questions: QuestionsService,
    @InjectQueue(SCORE_WRITING_QUEUE) private scoreWritingQueue: Queue,
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

  async listByUser(userId: string, skill?: string) {
    return this.prisma.submission.findMany({
      where: { userId, ...(skill ? { skill: skill as any } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, skill: true, status: true, creditCost: true, createdAt: true },
    })
  }
}
