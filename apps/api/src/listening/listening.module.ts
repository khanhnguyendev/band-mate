import { Module } from '@nestjs/common'
import { QuestionsModule } from '../questions/questions.module'
import { UsersModule } from '../users/users.module'
import { WalletModule } from '../wallet/wallet.module'
import { ListeningController } from './listening.controller'
import { ListeningService } from './listening.service'

@Module({
  imports: [WalletModule, QuestionsModule, UsersModule],
  controllers: [ListeningController],
  providers: [ListeningService],
})
export class ListeningModule {}
