import { Controller, Get } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { GamificationService } from './gamification.service'

@Controller('quests')
export class GamificationController {
  constructor(
    private gamification: GamificationService,
    private users: UsersService,
  ) {}

  @Get()
  async list(@CurrentUser() supabaseUser: SupabaseUser) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.gamification.getQuestsForUser(appUser.id)
  }
}
