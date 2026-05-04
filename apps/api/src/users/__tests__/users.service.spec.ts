import { UsersService } from '../users.service'

const mockUser = {
  id: 'app-uuid',
  supabaseUserId: 'supa-uuid',
  email: 'test@example.com',
  name: 'Test User',
  role: 'learner',
  wallet: { balance: 0, bonusBalance: 0, bonusExpiresAt: null },
}

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  wallet: { create: jest.fn(), findUnique: jest.fn() },
  submission: { findMany: jest.fn() },
  scoreReport: { findMany: jest.fn() },
  $transaction: jest.fn(),
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new UsersService(mockPrisma as any)
  })

  it('returns existing user without creating (idempotent)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    const result = await service.findOrCreate({ id: 'supa-uuid', email: 'test@example.com' } as any)
    expect(result).toEqual(mockUser)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  describe('getStats', () => {
    const day = (offset: number) => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - offset)
      return d
    }

    beforeEach(() => {
      mockPrisma.wallet.findUnique.mockResolvedValue({ balance: 5, bonusBalance: 2, bonusExpiresAt: null })
      mockPrisma.submission.findMany.mockResolvedValue([])
      mockPrisma.scoreReport.findMany.mockResolvedValue([])
      mockPrisma.user.findUnique.mockResolvedValue({ weakSkills: ['speaking'] })
    })

    it('returns zero stats for a new user', async () => {
      const result = await service.getStats('user-1')
      expect(result.streak).toBe(0)
      expect(result.submissionCounts).toEqual({ writing: 0, speaking: 0, reading: 0, listening: 0 })
      expect(result.recentReports).toHaveLength(0)
      expect(result.creditBalance).toBe(5)
      expect(result.bonusBalance).toBe(2)
    })

    it('falls back to onboarding weakSkill when no reports exist', async () => {
      const result = await service.getStats('user-1')
      expect(result.weakestSkill).toBe('speaking')
      expect(result.nextAction).toContain('Speaking')
    })

    it('derives weakest skill from lowest avg band in reports', async () => {
      mockPrisma.scoreReport.findMany.mockResolvedValue([
        { id: 'r1', skill: 'writing', overallBand: 7.0, createdAt: day(1) },
        { id: 'r2', skill: 'speaking', overallBand: 5.5, createdAt: day(2) },
      ])
      const result = await service.getStats('user-1')
      expect(result.weakestSkill).toBe('speaking')
    })

    it('counts consecutive-day streak correctly', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { skill: 'writing', createdAt: day(0) },
        { skill: 'speaking', createdAt: day(1) },
        { skill: 'reading', createdAt: day(2) },
        // gap at day 3
        { skill: 'listening', createdAt: day(4) },
      ])
      const result = await service.getStats('user-1')
      expect(result.streak).toBe(3)
    })

    it('returns streak 0 when no submission today or yesterday', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { skill: 'writing', createdAt: day(5) },
      ])
      const result = await service.getStats('user-1')
      expect(result.streak).toBe(0)
    })

    it('counts submissions per skill', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { skill: 'writing', createdAt: day(0) },
        { skill: 'writing', createdAt: day(1) },
        { skill: 'speaking', createdAt: day(0) },
      ])
      const result = await service.getStats('user-1')
      expect(result.submissionCounts.writing).toBe(2)
      expect(result.submissionCounts.speaking).toBe(1)
      expect(result.submissionCounts.reading).toBe(0)
    })
  })

  it('creates user and wallet on first login (AC-4)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.user.create.mockResolvedValue({ id: 'app-uuid' })
      mockPrisma.wallet.create.mockResolvedValue({})
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      return fn(mockPrisma)
    })

    const result = await service.findOrCreate({
      id: 'supa-uuid',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    } as any)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(result).toEqual(mockUser)
  })
})
