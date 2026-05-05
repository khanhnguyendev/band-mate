import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import { PrismaService } from '../prisma/prisma.service'

const SKILL_LABEL: Record<string, string> = {
  writing: 'Writing',
  speaking: 'Speaking',
  reading: 'Reading',
  listening: 'Listening',
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private readonly resend: Resend | null
  private readonly fromEmail: string

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY
    this.resend = apiKey ? new Resend(apiKey) : null
    this.fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Bandy <bandy@bandmate.app>'
  }

  async sendReportReady(userId: string, reportId: string, skill: string, band: number): Promise<void> {
    const [user, prefs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
    ])

    if (!user) return
    if (prefs && !prefs.emailReportReady) return

    const skillLabel = SKILL_LABEL[skill] ?? skill
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

    await this.send(user.email, `Your ${skillLabel} report is ready! 🦉`, `
      <p>Hi ${user.name},</p>
      <p>Bandy here! 🦉 Your <strong>${skillLabel}</strong> report is ready.</p>
      <p>Overall band: <strong>${band}</strong></p>
      <p><a href="${appUrl}/reports/${reportId}">View your report →</a></p>
      <p>Keep practising — you're making great progress!</p>
      <p>— Bandy, your IELTS coach 🦉</p>
    `)
  }

  async sendStreakReminder(userId: string, streak: number): Promise<void> {
    const [user, prefs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
    ])

    if (!user) return
    if (prefs && !prefs.emailStreakReminder) return

    const streakMsg = streak > 0
      ? `You're on a <strong>${streak}-day streak</strong> — don't break it!`
      : `Start a new streak today!`

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

    await this.send(user.email, `Don't break your streak! 🦉`, `
      <p>Hi ${user.name},</p>
      <p>Bandy here! 🦉 ${streakMsg}</p>
      <p>A quick practice session keeps your IELTS skills sharp.</p>
      <p><a href="${appUrl}/dashboard">Practice now →</a></p>
      <p>— Bandy, your IELTS coach 🦉</p>
    `)
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Email suppressed (no RESEND_API_KEY): ${subject} → ${to}`)
      return
    }

    try {
      await this.resend.emails.send({ from: this.fromEmail, to, subject, html })
      this.logger.log(`Email sent: ${subject} → ${to}`)
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message}`)
    }
  }
}
