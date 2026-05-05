import { BadRequestException, NotFoundException } from '@nestjs/common'
import { AdminService } from '../admin.service'

const makeQueue = (overrides: Record<string, jest.Mock> = {}) => ({
  getWaitingCount: jest.fn().mockResolvedValue(0),
  getActiveCount: jest.fn().mockResolvedValue(0),
  getFailedCount: jest.fn().mockResolvedValue(0),
  getCompletedCount: jest.fn().mockResolvedValue(0),
  getFailed: jest.fn().mockResolvedValue([]),
  getJob: jest.fn().mockResolvedValue(null),
  ...overrides,
})

const mockPrisma = {
  questDefinition: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  promptPack: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('AdminService', () => {
  let service: AdminService
  let scoreWritingQueue: ReturnType<typeof makeQueue>
  let transcribeAudioQueue: ReturnType<typeof makeQueue>
  let scoreSpeakingQueue: ReturnType<typeof makeQueue>

  beforeEach(() => {
    jest.clearAllMocks()
    scoreWritingQueue = makeQueue()
    transcribeAudioQueue = makeQueue()
    scoreSpeakingQueue = makeQueue()
    service = new AdminService(
      mockPrisma as any,
      scoreWritingQueue as any,
      transcribeAudioQueue as any,
      scoreSpeakingQueue as any,
    )
  })

  describe('getJobs()', () => {
    it('returns counts for all queues when no queue specified', async () => {
      scoreWritingQueue.getWaitingCount.mockResolvedValue(2)
      scoreWritingQueue.getFailedCount.mockResolvedValue(1)
      const result = await service.getJobs()
      expect(result).toHaveLength(3)
      const writing = result.find((r) => r.queue === 'score-writing')
      expect(writing?.counts.waiting).toBe(2)
      expect(writing?.counts.failed).toBe(1)
    })

    it('returns only the specified queue', async () => {
      const result = await service.getJobs('score-writing')
      expect(result).toHaveLength(1)
      expect(result[0].queue).toBe('score-writing')
    })

    it('includes failed job details', async () => {
      const failedJob = {
        id: 'job-1',
        name: 'score',
        data: { submissionId: 'sub-1' },
        failedReason: 'AI error',
        attemptsMade: 3,
        timestamp: Date.now(),
      }
      scoreWritingQueue.getFailed.mockResolvedValue([failedJob])
      scoreWritingQueue.getFailedCount.mockResolvedValue(1)
      const result = await service.getJobs('score-writing')
      expect(result[0].failedJobs[0].id).toBe('job-1')
      expect(result[0].failedJobs[0].failedReason).toBe('AI error')
    })

    it('throws NotFoundException for unknown queue', async () => {
      await expect(service.getJobs('unknown-queue')).rejects.toThrow(NotFoundException)
    })
  })

  describe('retryJob()', () => {
    it('retries a failed job', async () => {
      const mockJob = { getState: jest.fn().mockResolvedValue('failed'), retry: jest.fn().mockResolvedValue(undefined) }
      scoreWritingQueue.getJob.mockResolvedValue(mockJob)
      const result = await service.retryJob('score-writing', 'job-1')
      expect(mockJob.retry).toHaveBeenCalled()
      expect(result.retried).toBe(true)
    })

    it('throws NotFoundException when job does not exist', async () => {
      scoreWritingQueue.getJob.mockResolvedValue(null)
      await expect(service.retryJob('score-writing', 'missing')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when job is not failed', async () => {
      const mockJob = { getState: jest.fn().mockResolvedValue('active'), retry: jest.fn() }
      scoreWritingQueue.getJob.mockResolvedValue(mockJob)
      await expect(service.retryJob('score-writing', 'job-1')).rejects.toThrow(BadRequestException)
      expect(mockJob.retry).not.toHaveBeenCalled()
    })
  })

  describe('listQuests()', () => {
    it('returns all quest definitions', async () => {
      const quests = [{ id: 'q1', title: 'Write 3 essays' }]
      mockPrisma.questDefinition.findMany.mockResolvedValue(quests)
      const result = await service.listQuests()
      expect(result).toEqual(quests)
    })
  })

  describe('updateQuest()', () => {
    it('updates quest fields', async () => {
      mockPrisma.questDefinition.findUnique.mockResolvedValue({ id: 'q1' })
      mockPrisma.questDefinition.update.mockResolvedValue({ id: 'q1', rewardCredits: 5 })
      const result = await service.updateQuest('q1', { rewardCredits: 5 })
      expect(mockPrisma.questDefinition.update).toHaveBeenCalledWith({
        where: { id: 'q1' },
        data: { rewardCredits: 5 },
      })
      expect(result.rewardCredits).toBe(5)
    })

    it('throws NotFoundException when quest does not exist', async () => {
      mockPrisma.questDefinition.findUnique.mockResolvedValue(null)
      await expect(service.updateQuest('missing', { rewardCredits: 5 })).rejects.toThrow(NotFoundException)
    })
  })

  describe('createPromptPack()', () => {
    it('creates a new prompt pack', async () => {
      const dto = {
        skill: 'writing',
        version: 'v2',
        systemPrompt: 'You are...',
        userPromptTemplate: 'Score this: {{text}}',
        rubricSchema: { criteria: [] },
      }
      mockPrisma.promptPack.create.mockResolvedValue({ id: 'pack-1', ...dto })
      const result = await service.createPromptPack(dto)
      expect(result.id).toBe('pack-1')
      expect(mockPrisma.promptPack.create).toHaveBeenCalledWith({ data: expect.objectContaining({ version: 'v2' }) })
    })
  })

  describe('activatePromptPack()', () => {
    it('deactivates siblings and activates target', async () => {
      mockPrisma.promptPack.findUnique.mockResolvedValue({ id: 'pack-1', skill: 'writing' })
      mockPrisma.promptPack.updateMany.mockResolvedValue({ count: 1 })
      mockPrisma.promptPack.update.mockResolvedValue({ id: 'pack-1', isActive: true })
      mockPrisma.$transaction.mockResolvedValue([])
      const result = await service.activatePromptPack('pack-1')
      expect(result.activated).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        expect.anything(), // updateMany deactivate siblings
        expect.anything(), // update activate target
      ])
    })

    it('throws NotFoundException when pack does not exist', async () => {
      mockPrisma.promptPack.findUnique.mockResolvedValue(null)
      await expect(service.activatePromptPack('missing')).rejects.toThrow(NotFoundException)
    })
  })
})
