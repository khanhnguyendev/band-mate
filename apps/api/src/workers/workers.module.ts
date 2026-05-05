import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WalletModule } from '../wallet/wallet.module'
import { TranscriptionModule } from '../transcription/transcription.module'
import { NotificationModule } from '../notification/notification.module'
import { SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE } from '../submissions/submissions.service'
import { SCORE_SPEAKING_QUEUE } from './transcribe-audio.worker'
import { ScoreWritingWorker } from './score-writing.worker'
import { TranscribeAudioWorker } from './transcribe-audio.worker'
import { ScoreSpeakingWorker } from './score-speaking.worker'
import { StreakReminderWorker, STREAK_REMINDER_QUEUE } from './streak-reminder.worker'

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCORE_WRITING_QUEUE },
      { name: TRANSCRIBE_AUDIO_QUEUE },
      { name: SCORE_SPEAKING_QUEUE },
      { name: STREAK_REMINDER_QUEUE },
    ),
    WalletModule,
    TranscriptionModule,
    NotificationModule,
  ],
  providers: [ScoreWritingWorker, TranscribeAudioWorker, ScoreSpeakingWorker, StreakReminderWorker],
})
export class WorkersModule {}
