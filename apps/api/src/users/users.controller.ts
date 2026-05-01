import { Controller, Get } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() supabaseUser: SupabaseUser) {
    const user = await this.users.findOrCreate(supabaseUser)
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
