import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { getQueueToken } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { AppModule } from './app.module'
import { STREAK_REMINDER_QUEUE } from './workers/streak-reminder.worker'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('v1')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  // Register hourly streak reminder as a repeatable job
  try {
    const streakQueue = app.get<Queue>(getQueueToken(STREAK_REMINDER_QUEUE))
    await streakQueue.add('remind', {}, { repeat: { pattern: '0 * * * *' }, jobId: 'streak-reminder-hourly' })
  } catch {
    // Queue not available in test environments
  }

  const port = process.env.API_PORT ?? 4000
  await app.listen(port)
  console.log(`API running on http://localhost:${port}/v1`)
}

bootstrap()
