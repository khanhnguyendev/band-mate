import { Module } from '@nestjs/common'
import { QuestionsModule } from '../questions/questions.module'
import { UsersModule } from '../users/users.module'
import { WalletModule } from '../wallet/wallet.module'
import { ReadingController } from './reading.controller'
import { ReadingService } from './reading.service'

@Module({
  imports: [WalletModule, QuestionsModule, UsersModule],
  controllers: [ReadingController],
  providers: [ReadingService],
})
export class ReadingModule {}
