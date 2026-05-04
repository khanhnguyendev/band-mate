import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { WalletModule } from '../wallet/wallet.module'
import { GamificationController } from './gamification.controller'
import { GamificationService } from './gamification.service'

@Module({
  imports: [WalletModule, UsersModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
