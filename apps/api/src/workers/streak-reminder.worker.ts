import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

export const STREAK_REMINDER_QUEUE = 'streak-reminder'

@Processor(STREAK_REMINDER_QUEUE)
export class StreakReminderWorker extends WorkerHost {
  private readonly logger = new Logger(StreakReminderWorker.name)

  constructor(
    private prisma: PrismaService,
    private notification: NotificationService,
  ) {
    super()
  }

  async process(_job: Job): Promise<void> {
    const nowUtc = new Date()
    const currentUtcHour = nowUtc.getUTCHours()

    const prefs = await this.prisma.notificationPreference.findMany({
      where: { emailStreakReminder: true },
      include: { user: { select: { id: true, email: true } } },
    })

    const todayUtc = nowUtc.toISOString().slice(0, 10)
    let sent = 0

    for (const pref of prefs) {
      // Convert reminderHour from user's timezone to UTC hour for comparison
      const userOffset = this.timezoneOffsetHours(pref.timezone, nowUtc)
      const userLocalHour = ((currentUtcHour + userOffset) % 24 + 24) % 24

      if (userLocalHour !== pref.reminderHour) continue

      // Check if user already has a submission today
      const todaySubmission = await this.prisma.submission.findFirst({
        where: {
          userId: pref.userId,
          status: 'completed',
          createdAt: { gte: new Date(`${todayUtc}T00:00:00.000Z`) },
        },
      })
      if (todaySubmission) continue

      // Compute streak (reuse same logic as stats)
      const recentSubs = await this.prisma.submission.findMany({
        where: { userId: pref.userId, status: 'completed' },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      const days = new Set(recentSubs.map((s) => s.createdAt.toISOString().slice(0, 10)))
      let streak = 0
      for (let i = 1; i <= 100; i++) {
        const d = new Date(nowUtc)
        d.setUTCDate(d.getUTCDate() - i)
        if (days.has(d.toISOString().slice(0, 10))) streak++
        else break
      }

      await this.notification.sendStreakReminder(pref.userId, streak)
      sent++
    }

    this.logger.log(`Streak reminders sent: ${sent}`)
  }

  private timezoneOffsetHours(timezone: string, date: Date): number {
    try {
      const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC', hour: 'numeric', hour12: false })
      const localStr = date.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
      return parseInt(localStr, 10) - parseInt(utcStr, 10)
    } catch {
      return 0
    }
  }
}
