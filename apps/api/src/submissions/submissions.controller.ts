import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { z } from 'zod'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { SubmissionsService } from './submissions.service'

const SubmitWritingSchema = z.object({
  questionId: z.string().uuid(),
  text: z.string().min(50, 'Response must be at least 50 characters'),
})

const SpeakingUploadUrlSchema = z.object({
  questionId: z.string().uuid(),
})

const SubmitSpeakingSchema = z.object({
  questionId: z.string().uuid(),
  audioKey: z.string().min(1),
})

@Controller('submissions')
export class SubmissionsController {
  constructor(
    private submissions: SubmissionsService,
    private users: UsersService,
  ) {}

  @Post('writing')
  async submitWriting(@CurrentUser() supabaseUser: SupabaseUser, @Body() body: unknown) {
    const { questionId, text } = SubmitWritingSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.submissions.submitWriting(appUser.id, questionId, text)
  }

  @Post('speaking/upload-url')
  async getSpeakingUploadUrl(@CurrentUser() supabaseUser: SupabaseUser, @Body() body: unknown) {
    const { questionId } = SpeakingUploadUrlSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.submissions.getSpeakingUploadUrl(appUser.id, questionId)
  }

  @Post('speaking')
  async submitSpeaking(@CurrentUser() supabaseUser: SupabaseUser, @Body() body: unknown) {
    const { questionId, audioKey } = SubmitSpeakingSchema.parse(body)
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.submissions.submitSpeaking(appUser.id, questionId, audioKey)
  }

  @Get(':id/status')
  async getStatus(@CurrentUser() supabaseUser: SupabaseUser, @Param('id') id: string) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.submissions.getStatus(id, appUser.id)
  }

  @Get()
  async list(@CurrentUser() supabaseUser: SupabaseUser, @Query('skill') skill?: string) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.submissions.listByUser(appUser.id, skill)
  }
}
