import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private users: UsersService,
  ) {}

  private async requireAdmin(supabaseUser: SupabaseUser) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    if (appUser.role !== 'admin') throw new ForbiddenException('Admin only')
    return appUser
  }

  @Get('jobs')
  async jobs(@CurrentUser() supabaseUser: SupabaseUser, @Query('queue') queue?: string) {
    await this.requireAdmin(supabaseUser)
    return this.admin.getJobs(queue)
  }

  @Post('jobs/:queue/:jobId/retry')
  async retryJob(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Param('queue') queue: string,
    @Param('jobId') jobId: string,
  ) {
    await this.requireAdmin(supabaseUser)
    return this.admin.retryJob(queue, jobId)
  }

  @Get('quests')
  async listQuests(@CurrentUser() supabaseUser: SupabaseUser) {
    await this.requireAdmin(supabaseUser)
    return this.admin.listQuests()
  }

  @Patch('quests/:id')
  async updateQuest(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Param('id') id: string,
    @Body() body: { rewardCredits?: number; requiredCount?: number; isActive?: boolean },
  ) {
    await this.requireAdmin(supabaseUser)
    return this.admin.updateQuest(id, body)
  }

  @Get('prompt-packs')
  async listPromptPacks(@CurrentUser() supabaseUser: SupabaseUser) {
    await this.requireAdmin(supabaseUser)
    return this.admin.listPromptPacks()
  }

  @Post('prompt-packs')
  async createPromptPack(
    @CurrentUser() supabaseUser: SupabaseUser,
    @Body()
    body: {
      skill: string
      version: string
      systemPrompt: string
      userPromptTemplate: string
      rubricSchema: object
    },
  ) {
    await this.requireAdmin(supabaseUser)
    return this.admin.createPromptPack(body)
  }

  @Post('prompt-packs/:id/activate')
  async activatePromptPack(@CurrentUser() supabaseUser: SupabaseUser, @Param('id') id: string) {
    await this.requireAdmin(supabaseUser)
    return this.admin.activatePromptPack(id)
  }
}
