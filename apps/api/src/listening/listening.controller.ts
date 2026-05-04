import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { z } from 'zod'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { ListeningService } from './listening.service'

const SubmitListeningSchema = z.object({
  answers: z.record(z.string(), z.string()),
})

@Controller('listening')
export class ListeningController {
  constructor(
    private listening: ListeningService,
    private users: UsersService,
  ) {}

  @Get('sets')
  async getSets() {
    return this.listening.findSets()
  }

  @Post('sets/:setId/submit')
  async submit(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Param('setId') setId: string,
    @Body() body: unknown,
  ) {
    const { answers } = SubmitListeningSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.listening.submitListening(appUser.id, setId, answers)
  }
}
