import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WalletService } from '../wallet/wallet.service'

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  /** Award bonus credits with daily/weekly earn cap enforcement. */
  async award(userId: string, credits: number, description: string, idempotencyKey: string): Promise<void> {
    const [dailyCap, weeklyCap, dailyCount, weeklyCount] = await Promise.all([
      this.getConfigInt('daily_earn_cap', 5),
      this.getConfigInt('weekly_earn_cap', 20),
      this.countBonusGrantsInPeriod(userId, 'daily'),
      this.countBonusGrantsInPeriod(userId, 'weekly'),
    ])

    if (dailyCount >= dailyCap || weeklyCount >= weeklyCap) return

    await this.wallet.grant(userId, credits, description, idempotencyKey)
  }

  /** Return active quests with per-user progress for today / this week. */
  async getQuestsForUser(userId: string) {
    const quests = await this.prisma.questDefinition.findMany({ where: { isActive: true } })
    const now = new Date()
    const todayStart = this.startOf('daily', now)
    const weekStart = this.startOf('weekly', now)

    const [dailySubmissions, weeklySubmissions, ledgerKeys] = await Promise.all([
      this.prisma.submission.findMany({
        where: { userId, status: 'completed', createdAt: { gte: todayStart } },
        select: { skill: true },
      }),
      this.prisma.submission.findMany({
        where: { userId, status: 'completed', createdAt: { gte: weekStart } },
        select: { skill: true },
      }),
      this.prisma.ledgerEntry.findMany({
        where: { wallet: { userId }, type: 'grant' },
        select: { idempotencyKey: true },
      }),
    ])

    const claimedKeys = new Set(ledgerKeys.map((e) => e.idempotencyKey))
    const dailySkills = new Set(dailySubmissions.map((s) => s.skill))
    const weeklySkills = new Set(weeklySubmissions.map((s) => s.skill))

    return quests.map((q) => {
      const periodStart = q.period === 'daily' ? todayStart : weekStart
      const submissions = q.period === 'daily' ? dailySubmissions : weeklySubmissions
      const skills = q.period === 'daily' ? dailySkills : weeklySkills

      let progress = 0
      if (q.action === 'all_skills') {
        progress = (['writing', 'speaking', 'reading', 'listening'] as const).filter((s) => skills.has(s)).length
      } else {
        const skill = this.actionToSkill(q.action)
        progress = skill ? submissions.filter((s) => s.skill === skill).length : 0
      }

      const periodKey = q.period === 'daily'
        ? periodStart.toISOString().slice(0, 10)
        : `week-${this.isoWeek(periodStart)}`

      const claimed = claimedKeys.has(`quest:${q.id}:${userId}:${periodKey}`)

      return {
        questId: q.id,
        title: q.title,
        description: q.description,
        period: q.period,
        progress: Math.min(progress, q.requiredCount),
        required: q.requiredCount,
        rewardCredits: q.rewardCredits,
        completed: progress >= q.requiredCount,
        claimed,
      }
    })
  }

  private async getConfigInt(key: string, fallback: number): Promise<number> {
    const row = await this.prisma.gameConfig.findUnique({ where: { key } })
    return row ? parseInt(row.value, 10) : fallback
  }

  private async countBonusGrantsInPeriod(userId: string, period: 'daily' | 'weekly'): Promise<number> {
    const since = this.startOf(period, new Date())
    return this.prisma.ledgerEntry.count({
      where: { wallet: { userId }, type: 'grant', createdAt: { gte: since } },
    })
  }

  private startOf(period: 'daily' | 'weekly', date: Date): Date {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    if (period === 'weekly') {
      const day = d.getUTCDay()
      d.setUTCDate(d.getUTCDate() - day) // Sunday = start of week
    }
    return d
  }

  private isoWeek(date: Date): string {
    return `${date.getUTCFullYear()}-W${String(Math.ceil((date.getUTCDate()) / 7)).padStart(2, '0')}`
  }

  private actionToSkill(action: string): string | null {
    const map: Record<string, string> = {
      reading_complete: 'reading',
      listening_complete: 'listening',
      speaking_submit: 'speaking',
      writing_submit: 'writing',
    }
    return map[action] ?? null
  }
}
