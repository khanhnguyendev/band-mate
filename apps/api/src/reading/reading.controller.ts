import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { z } from 'zod'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { ReadingService } from './reading.service'

const SubmitReadingSchema = z.object({
  answers: z.record(z.string(), z.string()),
})

@Controller('reading')
export class ReadingController {
  constructor(
    private reading: ReadingService,
    private users: UsersService,
  ) {}

  @Get('sets')
  async getSets() {
    return this.reading.findSets()
  }

  @Post('sets/:setId/submit')
  async submit(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Param('setId') setId: string,
    @Body() body: unknown,
  ) {
    const { answers } = SubmitReadingSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.reading.submitReading(appUser.id, setId, answers)
  }
}
