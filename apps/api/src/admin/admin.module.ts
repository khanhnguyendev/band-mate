import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { UsersModule } from '../users/users.module'
import { SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE } from '../submissions/submissions.service'
import { SCORE_SPEAKING_QUEUE } from '../workers/transcribe-audio.worker'
import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCORE_WRITING_QUEUE },
      { name: TRANSCRIBE_AUDIO_QUEUE },
      { name: SCORE_SPEAKING_QUEUE },
    ),
    UsersModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
