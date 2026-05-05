import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bullmq'
import { AnthropicModule } from './anthropic/anthropic.module'
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard'
import { PrismaModule } from './prisma/prisma.module'
import { QuestionsModule } from './questions/questions.module'
import { ReportsModule } from './reports/reports.module'
import { SubmissionsModule } from './submissions/submissions.module'
import { SupabaseModule } from './supabase/supabase.module'
import { UsersModule } from './users/users.module'
import { WalletModule } from './wallet/wallet.module'
import { GamificationModule } from './gamification/gamification.module'
import { ListeningModule } from './listening/listening.module'
import { ReadingModule } from './reading/reading.module'
import { TranscriptionModule } from './transcription/transcription.module'
import { WorkersModule } from './workers/workers.module'
import { NotificationModule } from './notification/notification.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    BullModule.forRoot({
      connection: { url: process.env.UPSTASH_REDIS_URL ?? 'redis://localhost:6379' },
    }),
    PrismaModule,
    AnthropicModule,
    SupabaseModule,
    UsersModule,
    WalletModule,
    QuestionsModule,
    SubmissionsModule,
    ReportsModule,
    ReadingModule,
    GamificationModule,
    ListeningModule,
    TranscriptionModule,
    WorkersModule,
    NotificationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
})
export class AppModule {}
