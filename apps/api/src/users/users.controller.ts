import { Body, Controller, Get, Patch } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { OnboardingSchema } from '@band-mate/shared'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() supabaseUser: SupabaseUser) {
    const user = await this.users.findOrCreate(supabaseUser)
    return this.toResponse(user)
  }

  @Get('me/stats')
  async stats(@CurrentUser() supabaseUser: SupabaseUser) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.users.getStats(appUser.id)
  }

  @Patch('onboarding')
  async onboarding(@CurrentUser() supabaseUser: SupabaseUser, @Body() body: unknown) {
    const dto = OnboardingSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    const user = await this.users.completeOnboarding(appUser.id, dto)
    return this.toResponse(user)
  }

  private toResponse(user: Awaited<ReturnType<UsersService['findOrCreate']>>) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        targetBand: user.targetBand,
        testDate: user.testDate,
        weakSkills: user.weakSkills,
        motivation: user.motivation,
        onboardingCompletedAt: user.onboardingCompletedAt,
        createdAt: user.createdAt,
      },
      wallet: {
        balance: user.wallet?.balance ?? 0,
        bonusBalance: user.wallet?.bonusBalance ?? 0,
        bonusExpiresAt: user.wallet?.bonusExpiresAt ?? null,
      },
    }
  }
}
