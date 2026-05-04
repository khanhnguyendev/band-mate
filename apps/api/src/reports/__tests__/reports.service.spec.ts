import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ReportsService } from '../reports.service'

const NOW = new Date('2026-01-10T12:00:00Z')
const EARLIER = new Date('2026-01-05T12:00:00Z')

const mockCriteria = [{ criterionName: 'Coherence', band: 6.5, explanation: 'ok', strengths: [], weaknesses: [] }]

const mockReport = {
  id: 'report-1',
  submissionId: 'sub-1',
  userId: 'user-1',
  skill: 'writing',
  overallBand: 6.5,
  createdAt: NOW,
  criterionRows: mockCriteria,
  improvementTasks: [{ id: 'task-1', description: 'Improve coherence', skill: 'writing', criterion: 'Coherence', userId: 'user-1', status: 'pending' }],
}

const mockPrisma = {
  scoreReport: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  improvementTask: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
}

describe('ReportsService', () => {
  let service: ReportsService

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.scoreReport.findFirst.mockResolvedValue(mockReport)
    mockPrisma.scoreReport.findMany.mockResolvedValue([{ id: 'report-1', skill: 'writing', overallBand: 6.5, createdAt: NOW }])
    mockPrisma.improvementTask.findFirst.mockResolvedValue({ id: 'task-1', reportId: 'report-1', userId: 'user-1', status: 'pending' })
    mockPrisma.improvementTask.update.mockResolvedValue({ id: 'task-1', status: 'active' })
    service = new ReportsService(mockPrisma as any)
  })

  describe('findById', () => {
    it('returns shaped report with criteria and tasks', async () => {
      const result = await service.findById('report-1', 'user-1')
      expect(result.reportId).toBe('report-1')
      expect(result.overallBand).toBe(6.5)
      expect(result.criteria).toHaveLength(1)
      expect(result.improvementTasks).toHaveLength(1)
      expect(result.disclaimer).toContain('AI-estimated')
    })

    it('throws NotFoundException when report not found', async () => {
      mockPrisma.scoreReport.findFirst.mockResolvedValue(null)
      await expect(service.findById('bad-id', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('listByUser', () => {
    it('returns list of reports', async () => {
      const result = await service.listByUser('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].skill).toBe('writing')
    })

    it('passes skill filter', async () => {
      await service.listByUser('user-1', 'speaking')
      expect(mockPrisma.scoreReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ skill: 'speaking' }) }),
      )
    })
  })

  describe('compare', () => {
    it('returns current + previous when prior report exists', async () => {
      const priorReport = { ...mockReport, id: 'report-0', overallBand: 6.0, createdAt: EARLIER, criterionRows: [] }
      mockPrisma.scoreReport.findFirst
        .mockResolvedValueOnce(mockReport)
        .mockResolvedValueOnce(priorReport)

      const result = await service.compare('report-1', 'user-1')
      expect(result.current.band).toBe(6.5)
      expect(result.previous?.band).toBe(6)
      expect(result.skill).toBe('writing')
    })

    it('returns previous: null when no prior report exists', async () => {
      mockPrisma.scoreReport.findFirst
        .mockResolvedValueOnce(mockReport)
        .mockResolvedValueOnce(null)

      const result = await service.compare('report-1', 'user-1')
      expect(result.previous).toBeNull()
    })

    it('throws NotFoundException when report not found', async () => {
      mockPrisma.scoreReport.findFirst.mockResolvedValue(null)
      await expect(service.compare('bad-id', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('acceptTask', () => {
    it('sets task status to active and returns confirmation', async () => {
      const result = await service.acceptTask('report-1', 'task-1', 'user-1')
      expect(result).toEqual({ taskId: 'task-1', status: 'active' })
      expect(mockPrisma.improvementTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'active' },
      })
    })

    it('throws NotFoundException for unknown task', async () => {
      mockPrisma.improvementTask.findFirst.mockResolvedValue(null)
      await expect(service.acceptTask('report-1', 'bad-task', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when task belongs to different user', async () => {
      mockPrisma.improvementTask.findFirst.mockResolvedValue({ id: 'task-1', reportId: 'report-1', userId: 'other-user' })
      await expect(service.acceptTask('report-1', 'task-1', 'user-1')).rejects.toThrow(ForbiddenException)
    })
  })
})
