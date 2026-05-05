import { UsersService } from '../users.service'

const NOW = new Date('2026-02-15T10:00:00Z')
const PAST = new Date('2026-01-01T00:00:00Z')
const FUTURE = new Date('2026-03-01T00:00:00Z')

const freePlan = {
  id: 'plan-free',
  name: 'free',
  monthlyCredits: 3,
  writingCreditCost: 2,
  speakingCreditCost: 2,
  isActive: true,
}

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
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  wallet: { create: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
  plan: { findUnique: jest.fn() },
  subscription: { findUnique: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
  submission: { findMany: jest.fn() },
  scoreReport: { findMany: jest.fn() },
  $transaction: jest.fn(),
}

const mockWallet = { grant: jest.fn(), reserve: jest.fn(), consume: jest.fn(), refund: jest.fn() }

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW)
    jest.resetAllMocks()
    mockPrisma.plan.findUnique.mockResolvedValue(freePlan)
    mockPrisma.subscription.upsert.mockResolvedValue({})
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
    mockWallet.grant.mockResolvedValue({})
    service = new UsersService(mockPrisma as any, mockWallet as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns existing user without creating (idempotent)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    const result = await service.findOrCreate({ id: 'supa-uuid', email: 'test@example.com' } as any)
    expect(result).toEqual(mockUser)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates user and wallet on first login', async () => {
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

  describe('getStats()', () => {
    const day = (offset: number) => {
      const d = new Date(NOW)
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
        { skill: 'listening', createdAt: day(4) }, // gap — streak stops at 3
      ])
      const result = await service.getStats('user-1')
      expect(result.streak).toBe(3)
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

  describe('getWallet()', () => {
    it('returns wallet with active bonus balance and plan', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'w-1',
        balance: 5,
        bonusBalance: 2,
        bonusExpiresAt: FUTURE,
        entries: [],
      })
      mockPrisma.subscription.findUnique.mockResolvedValue({ plan: freePlan })

      const result = await service.getWallet('user-1')
      expect(result.bonusBalance).toBe(2)
      expect(result.bonusExpiresAt).toEqual(FUTURE)
      expect(result.plan?.name).toBe('free')
    })

    it('zeroes expired bonus balance and updates DB', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'w-1',
        balance: 5,
        bonusBalance: 3,
        bonusExpiresAt: PAST,
        entries: [],
      })
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      const result = await service.getWallet('user-1')
      expect(result.bonusBalance).toBe(0)
      expect(result.bonusExpiresAt).toBeNull()
      expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'w-1' },
        data: { bonusBalance: 0 },
      })
    })

    it('does not update DB when bonus balance is already zero', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'w-1', balance: 5, bonusBalance: 0, bonusExpiresAt: PAST, entries: [],
      })
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      await service.getWallet('user-1')
      expect(mockPrisma.wallet.update).not.toHaveBeenCalled()
    })

    it('returns null plan when no subscription exists', async () => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({
        id: 'w-1', balance: 0, bonusBalance: 0, bonusExpiresAt: null, entries: [],
      })
      mockPrisma.subscription.findUnique.mockResolvedValue(null)

      const result = await service.getWallet('user-1')
      expect(result.plan).toBeNull()
    })
  })

  describe('completeOnboarding()', () => {
    it('grants trial credits and upserts Free plan subscription', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' })

      await service.completeOnboarding('user-1', {
        targetBand: 7,
        testDate: undefined,
        weakSkills: ['writing'],
        motivation: 'Study abroad',
      })

      expect(mockWallet.grant).toHaveBeenCalledWith('user-1', 3, 'Onboarding trial credits', 'onboarding:user-1')
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          create: expect.objectContaining({ userId: 'user-1', planId: 'plan-free', status: 'active' }),
          update: {},
        }),
      )
    })

    it('skips subscription upsert when Free plan not found in DB', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' })

      await service.completeOnboarding('user-1', {
        targetBand: 6,
        testDate: undefined,
        weakSkills: [],
        motivation: 'Work visa',
      })

      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled()
    })
  })
})
