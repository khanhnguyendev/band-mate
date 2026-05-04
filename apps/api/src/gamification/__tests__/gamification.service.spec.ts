import { GamificationService } from '../gamification.service'

const NOW = new Date('2026-01-15T10:00:00Z') // Wednesday

const mockPrisma = {
  gameConfig: { findUnique: jest.fn() },
  ledgerEntry: { count: jest.fn(), findMany: jest.fn() },
  questDefinition: { findMany: jest.fn() },
  submission: { findMany: jest.fn() },
}

const mockWallet = { grant: jest.fn() }

const dailyQuest = {
  id: 'quest-daily-reading',
  title: 'Reader',
  description: 'Complete 1 reading set',
  skill: 'reading',
  action: 'reading_complete',
  requiredCount: 1,
  rewardCredits: 1,
  period: 'daily',
  isActive: true,
}

const weeklyQuest = {
  id: 'quest-weekly-allskills',
  title: 'All-Rounder',
  description: 'Practice all 4 skills',
  skill: null,
  action: 'all_skills',
  requiredCount: 4,
  rewardCredits: 3,
  period: 'weekly',
  isActive: true,
}

describe('GamificationService', () => {
  let service: GamificationService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW)
    jest.resetAllMocks()
    mockPrisma.gameConfig.findUnique.mockResolvedValue(null) // use fallbacks by default
    mockPrisma.ledgerEntry.count.mockResolvedValue(0)
    mockPrisma.ledgerEntry.findMany.mockResolvedValue([])
    mockPrisma.questDefinition.findMany.mockResolvedValue([dailyQuest, weeklyQuest])
    mockPrisma.submission.findMany.mockResolvedValue([])
    mockWallet.grant.mockResolvedValue({})
    service = new GamificationService(mockPrisma as any, mockWallet as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('award()', () => {
    it('calls wallet.grant() when under daily and weekly cap', async () => {
      mockPrisma.ledgerEntry.count.mockResolvedValue(0)
      await service.award('user-1', 1, 'Reading bonus', 'reading-bonus:user-1:set-1')
      expect(mockWallet.grant).toHaveBeenCalledWith('user-1', 1, 'Reading bonus', 'reading-bonus:user-1:set-1')
    })

    it('skips wallet.grant() when daily cap reached', async () => {
      mockPrisma.gameConfig.findUnique
        .mockResolvedValueOnce({ value: '5' })  // daily_earn_cap
        .mockResolvedValueOnce({ value: '20' }) // weekly_earn_cap
      mockPrisma.ledgerEntry.count
        .mockResolvedValueOnce(5)  // daily count = cap
        .mockResolvedValueOnce(5)  // weekly count
      await service.award('user-1', 1, 'Reading bonus', 'key-1')
      expect(mockWallet.grant).not.toHaveBeenCalled()
    })

    it('skips wallet.grant() when weekly cap reached', async () => {
      mockPrisma.ledgerEntry.count
        .mockResolvedValueOnce(2)   // daily count (under daily cap of 5)
        .mockResolvedValueOnce(20)  // weekly count = cap
      await service.award('user-1', 1, 'Reading bonus', 'key-1')
      expect(mockWallet.grant).not.toHaveBeenCalled()
    })

    it('reads cap values from GameConfig when present', async () => {
      mockPrisma.gameConfig.findUnique
        .mockResolvedValueOnce({ value: '2' })  // daily cap = 2
        .mockResolvedValueOnce({ value: '10' }) // weekly cap = 10
      mockPrisma.ledgerEntry.count
        .mockResolvedValueOnce(2)  // at daily cap
        .mockResolvedValueOnce(5)
      await service.award('user-1', 1, 'desc', 'key-1')
      expect(mockWallet.grant).not.toHaveBeenCalled()
    })
  })

  describe('getQuestsForUser()', () => {
    it('returns quests with zero progress for new user', async () => {
      const result = await service.getQuestsForUser('user-1')
      expect(result).toHaveLength(2)
      expect(result[0].progress).toBe(0)
      expect(result[0].completed).toBe(false)
      expect(result[0].claimed).toBe(false)
    })

    it('counts daily reading submissions toward reading quest', async () => {
      mockPrisma.submission.findMany
        .mockResolvedValueOnce([{ skill: 'reading' }]) // daily
        .mockResolvedValueOnce([{ skill: 'reading' }]) // weekly
      const result = await service.getQuestsForUser('user-1')
      const dailyReading = result.find((q) => q.questId === 'quest-daily-reading')
      expect(dailyReading?.progress).toBe(1)
      expect(dailyReading?.completed).toBe(true)
    })

    it('counts distinct skills for all_skills weekly quest', async () => {
      const subs = [{ skill: 'reading' }, { skill: 'writing' }, { skill: 'speaking' }]
      mockPrisma.submission.findMany
        .mockResolvedValueOnce(subs) // daily
        .mockResolvedValueOnce(subs) // weekly
      const result = await service.getQuestsForUser('user-1')
      const weekly = result.find((q) => q.questId === 'quest-weekly-allskills')
      expect(weekly?.progress).toBe(3)
      expect(weekly?.completed).toBe(false) // needs 4
    })

    it('marks quest as claimed when idempotency key exists in ledger', async () => {
      mockPrisma.submission.findMany
        .mockResolvedValueOnce([{ skill: 'reading' }])
        .mockResolvedValueOnce([{ skill: 'reading' }])
      const todayKey = NOW.toISOString().slice(0, 10)
      mockPrisma.ledgerEntry.findMany.mockResolvedValue([
        { idempotencyKey: `quest:quest-daily-reading:user-1:${todayKey}` },
      ])
      const result = await service.getQuestsForUser('user-1')
      const dailyReading = result.find((q) => q.questId === 'quest-daily-reading')
      expect(dailyReading?.claimed).toBe(true)
    })
  })
})
