import { Injectable } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { OnboardingInput } from '@band-mate/shared'
import { PrismaService } from '../prisma/prisma.service'
import { WalletService } from '../wallet/wallet.service'

const ONBOARDING_TRIAL_CREDITS = 3

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
      const user = await tx.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.['name'] ?? supabaseUser.email!.split('@')[0],
          role: 'learner',
        },
      })

      await tx.wallet.create({
        data: { userId: user.id, balance: 0, bonusBalance: 0 },
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

  async completeOnboarding(userId: string, dto: OnboardingInput) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        targetBand: dto.targetBand,
        testDate: dto.testDate ? new Date(dto.testDate) : null,
        weakSkills: dto.weakSkills,
        motivation: dto.motivation,
        onboardingCompletedAt: new Date(),
      },
      include: { wallet: true },
    })

    await this.wallet.grant(
      userId,
      ONBOARDING_TRIAL_CREDITS,
      'Onboarding trial credits',
      `onboarding:${userId}`,
    )

    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { wallet: true },
    })
  }
}
