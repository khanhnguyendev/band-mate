import { Controller, Get, Param, Query } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from '../users/users.service'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(
    private reports: ReportsService,
    private users: UsersService,
  ) {}

  @Get(':id')
  async findOne(@CurrentUser() supabaseUser: SupabaseUser, @Param('id') id: string) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.reports.findById(id, appUser.id)
  }

  @Get()
  async list(@CurrentUser() supabaseUser: SupabaseUser, @Query('skill') skill?: string) {
    const appUser = await this.users.findOrCreate(supabaseUser)
    return this.reports.listByUser(appUser.id, skill)
  }
}
