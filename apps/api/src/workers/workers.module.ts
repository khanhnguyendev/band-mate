import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WalletModule } from '../wallet/wallet.module'
import { TranscriptionModule } from '../transcription/transcription.module'
import { SCORE_WRITING_QUEUE, TRANSCRIBE_AUDIO_QUEUE } from '../submissions/submissions.service'
import { SCORE_SPEAKING_QUEUE } from './transcribe-audio.worker'
import { ScoreWritingWorker } from './score-writing.worker'
import { TranscribeAudioWorker } from './transcribe-audio.worker'
import { ScoreSpeakingWorker } from './score-speaking.worker'

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SCORE_WRITING_QUEUE },
      { name: TRANSCRIBE_AUDIO_QUEUE },
      { name: SCORE_SPEAKING_QUEUE },
    ),
    WalletModule,
    TranscriptionModule,
  ],
  providers: [ScoreWritingWorker, TranscribeAudioWorker, ScoreSpeakingWorker],
})
export class WorkersModule {}
