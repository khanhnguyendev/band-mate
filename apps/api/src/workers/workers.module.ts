import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WalletModule } from '../wallet/wallet.module'
import { SCORE_WRITING_QUEUE } from '../submissions/submissions.service'
import { ScoreWritingWorker } from './score-writing.worker'

@Module({
  imports: [
    BullModule.registerQueue({ name: SCORE_WRITING_QUEUE }),
    WalletModule,
  ],
  providers: [ScoreWritingWorker],
})
export class WorkersModule {}
