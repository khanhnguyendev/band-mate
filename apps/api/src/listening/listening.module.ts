import { Module } from '@nestjs/common'
import { GamificationModule } from '../gamification/gamification.module'
import { QuestionsModule } from '../questions/questions.module'
import { UsersModule } from '../users/users.module'
import { ListeningController } from './listening.controller'
import { ListeningService } from './listening.service'

@Module({
  imports: [GamificationModule, QuestionsModule, UsersModule],
  controllers: [ListeningController],
  providers: [ListeningService],
})
export class ListeningModule {}
