import { Injectable } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { OnboardingInput } from '@band-mate/shared'
import { PrismaService } from '../prisma/prisma.service'
import { WalletService } from '../wallet/wallet.service'

const ONBOARDING_TRIAL_CREDITS = 3
const FREE_PLAN_NAME = 'free'
const SUBSCRIPTION_PERIOD_DAYS = 30

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async findOrCreate(supabaseUser: SupabaseUser) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      include: { wallet: true },
    })

    if (existing) return existing

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { supabaseUserId: supabaseUser.id },
        update: {},
        create: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.['name'] ?? supabaseUser.email!.split('@')[0],
          role: 'learner',
        },
      })

      await tx.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, balance: 0, bonusBalance: 0 },
      })

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { wallet: true },
      })
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    })
  }

  async getStats(userId: string) {
    const [wallet, submissions, reports, user] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId } }),
      this.prisma.submission.findMany({
        where: { userId, status: 'completed' },
        select: { skill: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scoreReport.findMany({
        where: { userId },
        select: { id: true, skill: true, overallBand: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { weakSkills: true } }),
    ])

    // Submission counts per skill
    const submissionCounts: Record<string, number> = { writing: 0, speaking: 0, reading: 0, listening: 0 }
    for (const s of submissions) submissionCounts[s.skill] = (submissionCounts[s.skill] ?? 0) + 1

    // Streak — consecutive calendar days (UTC) with ≥1 submission
    const days = new Set(submissions.map((s) => s.createdAt.toISOString().slice(0, 10)))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i)
      if (days.has(d.toISOString().slice(0, 10))) streak++
      else break
    }

    // Weakest skill — lowest average band from reports
    const bandsBySkill: Record<string, number[]> = {}
    for (const r of reports) {
      if (!bandsBySkill[r.skill]) bandsBySkill[r.skill] = []
      bandsBySkill[r.skill].push(Number(r.overallBand))
    }
    const avgBySkill = Object.entries(bandsBySkill).map(([skill, bands]) => ({
      skill,
      avg: bands.reduce((a, b) => a + b, 0) / bands.length,
    }))
    const weakestFromReports = avgBySkill.sort((a, b) => a.avg - b.avg)[0]?.skill ?? null
    const weakestSkill = weakestFromReports ?? user?.weakSkills?.[0] ?? null

    const NEXT_ACTIONS: Record<string, string> = {
      writing: 'Practice a Writing Task 2 essay',
      speaking: 'Try a Speaking Part 1 response',
      reading: 'Work through a Reading passage',
      listening: 'Complete a Listening Section 1 exercise',
    }
    const nextAction = weakestSkill ? (NEXT_ACTIONS[weakestSkill] ?? null) : null

    return {
      creditBalance: wallet?.balance ?? 0,
      bonusBalance: wallet?.bonusBalance ?? 0,
      streak,
      submissionCounts,
      recentReports: reports.slice(0, 3).map((r) => ({
        reportId: r.id,
        skill: r.skill,
        band: Number(r.overallBand),
        createdAt: r.createdAt,
      })),
      weakestSkill,
      nextAction,
    }
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { userId },
      include: {
        entries: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    })

    // Lazy bonus expiry
    let bonusBalance = wallet.bonusBalance
    if (wallet.bonusExpiresAt && wallet.bonusExpiresAt < new Date() && bonusBalance > 0) {
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { bonusBalance: 0 },
      })
      bonusBalance = 0
    }

    return {
      balance: wallet.balance,
      bonusBalance,
      bonusExpiresAt: bonusBalance > 0 ? wallet.bonusExpiresAt : null,
      plan: subscription?.plan
        ? {
            name: subscription.plan.name,
            monthlyCredits: subscription.plan.monthlyCredits,
            writingCreditCost: subscription.plan.writingCreditCost,
            speakingCreditCost: subscription.plan.speakingCreditCost,
          }
        : null,
      ledger: wallet.entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        balanceAfter: e.balanceAfter,
        description: e.description,
        createdAt: e.createdAt,
      })),
    }
  }

  async grantMonthlyCredits() {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
    })

    const now = new Date()
    const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const results: { userId: string; granted: number }[] = []

    for (const sub of activeSubscriptions) {
      const idempotencyKey = `monthly-grant:${sub.userId}:${periodKey}`
      try {
        await this.wallet.grant(
          sub.userId,
          sub.plan.monthlyCredits,
          `Monthly credits — ${sub.plan.name} plan`,
          idempotencyKey,
        )
        results.push({ userId: sub.userId, granted: sub.plan.monthlyCredits })
      } catch {
        // Already granted this period (idempotent) — skip
      }
    }

    return { granted: results.length, results }
  }

  async completeOnboarding(userId: string, dto: OnboardingInput) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        targetBand: dto.targetBand,
        testDate: dto.testDate ? new Date(dto.testDate) : null,
        weakSkills: dto.weakSkills,
        motivation: dto.motivation,
        onboardingCompletedAt: new Date(),
      },
    })

    await this.wallet.grant(
      userId,
      ONBOARDING_TRIAL_CREDITS,
      'Onboarding trial credits',
      `onboarding:${userId}`,
    )

    // Subscribe to Free plan (idempotent — upsert by userId)
    const freePlan = await this.prisma.plan.findUnique({ where: { name: FREE_PLAN_NAME } })
    if (freePlan) {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + SUBSCRIPTION_PERIOD_DAYS)
      await this.prisma.subscription.upsert({
        where: { userId },
        create: { userId, planId: freePlan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd },
        update: {},
      })
    }

    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { wallet: true },
    })
  }

  async getNotificationPrefs(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({ where: { userId } })
    return prefs ?? {
      userId,
      timezone: 'UTC',
      emailReportReady: true,
      emailStreakReminder: true,
      reminderHour: 20,
    }
  }

  async updateNotificationPrefs(userId: string, dto: {
    timezone?: string
    emailReportReady?: boolean
    emailStreakReminder?: boolean
    reminderHour?: number
  }) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    })
  }
}
