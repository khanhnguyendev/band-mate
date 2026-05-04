import { Module } from '@nestjs/common'
import { GamificationModule } from '../gamification/gamification.module'
import { QuestionsModule } from '../questions/questions.module'
import { UsersModule } from '../users/users.module'
import { ReadingController } from './reading.controller'
import { ReadingService } from './reading.service'

@Module({
  imports: [GamificationModule, QuestionsModule, UsersModule],
  controllers: [ReadingController],
  providers: [ReadingService],
})
export class ReadingModule {}
