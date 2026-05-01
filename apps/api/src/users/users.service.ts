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
