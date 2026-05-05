import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE } from '../submissions/submissions.service'
import { SCORE_SPEAKING_QUEUE } from '../workers/transcribe-audio.worker'

export const ADMIN_QUEUES = [SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE, SCORE_SPEAKING_QUEUE] as const
export type AdminQueue = (typeof ADMIN_QUEUES)[number]

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(SCORE_WRITING_QUEUE) private scoreWritingQueue: Queue,
    @InjectQueue(TRANSCRIBE_AUDIO_QUEUE) private transcribeAudioQueue: Queue,
    @InjectQueue(SCORE_SPEAKING_QUEUE) private scoreSpeakingQueue: Queue,
  ) {}

  private getQueue(name: string): Queue {
    if (name === SCORE_WRITING_QUEUE) return this.scoreWritingQueue
    if (name === TRANSCRIBE_AUDIO_QUEUE) return this.transcribeAudioQueue
    if (name === SCORE_SPEAKING_QUEUE) return this.scoreSpeakingQueue
    throw new NotFoundException(`Queue not found: ${name}`)
  }

  async getJobs(queueName?: string) {
    const queueNames = queueName ? [queueName] : [...ADMIN_QUEUES]
    const results = await Promise.all(
      queueNames.map(async (name) => {
        const queue = this.getQueue(name)
        const [waiting, active, failed, completed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getFailedCount(),
          queue.getCompletedCount(),
        ])
        const failedJobs = await queue.getFailed(0, 20)
        return {
          queue: name,
          counts: { waiting, active, failed, completed },
          failedJobs: failedJobs.map((j) => ({
            id: j.id,
            name: j.name,
            data: j.data,
            failedReason: j.failedReason,
            attemptsMade: j.attemptsMade,
            timestamp: j.timestamp,
          })),
        }
      }),
    )
    return results
  }

  async retryJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    if (!job) throw new NotFoundException(`Job ${jobId} not found in queue ${queueName}`)
    const state = await job.getState()
    if (state !== 'failed') throw new BadRequestException(`Job ${jobId} is not in failed state (current: ${state})`)
    await job.retry()
    return { retried: true, jobId, queue: queueName }
  }

  async listQuests() {
    return this.prisma.questDefinition.findMany({ orderBy: { createdAt: 'asc' } })
  }

  async updateQuest(id: string, dto: { rewardCredits?: number; requiredCount?: number; isActive?: boolean }) {
    const quest = await this.prisma.questDefinition.findUnique({ where: { id } })
    if (!quest) throw new NotFoundException('Quest not found')
    return this.prisma.questDefinition.update({ where: { id }, data: dto })
  }

  async listPromptPacks() {
    return this.prisma.promptPack.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async createPromptPack(dto: {
    skill: string
    version: string
    systemPrompt: string
    userPromptTemplate: string
    rubricSchema: object
  }) {
    return this.prisma.promptPack.create({ data: { ...dto, skill: dto.skill as any } })
  }

  async activatePromptPack(id: string) {
    const pack = await this.prisma.promptPack.findUnique({ where: { id } })
    if (!pack) throw new NotFoundException('PromptPack not found')
    await this.prisma.$transaction([
      this.prisma.promptPack.updateMany({ where: { skill: pack.skill, isActive: true }, data: { isActive: false } }),
      this.prisma.promptPack.update({ where: { id }, data: { isActive: true } }),
    ])
    return { activated: true, id }
  }
}
