import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QuestionsModule } from '../questions/questions.module'
import { UsersModule } from '../users/users.module'
import { WalletModule } from '../wallet/wallet.module'
import { SubmissionsController } from './submissions.controller'
import { SubmissionsService } from './submissions.service'
import { SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE } from './submissions.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: SCORE_WRITING_QUEUE }),
    BullModule.registerQueue({ name: TRANSCRIBE_AUDIO_QUEUE }),
    WalletModule,
    QuestionsModule,
    UsersModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
