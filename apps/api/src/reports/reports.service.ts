import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const DISCLAIMER = 'This is an AI-estimated practice score, not an official IELTS result.'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findById(reportId: string, userId: string) {
    const report = await this.prisma.scoreReport.findFirst({
      where: { id: reportId, userId },
      include: {
        criterionRows: { orderBy: { criterionName: 'asc' } },
        improvementTasks: { where: { status: 'pending' }, take: 5 },
      },
    })

    if (!report) throw new NotFoundException('Report not found')

    return {
      reportId: report.id,
      submissionId: report.submissionId,
      skill: report.skill,
      overallBand: Number(report.overallBand),
      disclaimer: DISCLAIMER,
      criteria: report.criterionRows.map((c) => ({
        name: c.criterionName,
        band: Number(c.band),
        explanation: c.explanation,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
      })),
      improvementTasks: report.improvementTasks.map((t) => ({
        taskId: t.id,
        description: t.description,
        skill: t.skill,
        criterion: t.criterion,
      })),
      createdAt: report.createdAt,
    }
  }

  async listByUser(userId: string, skill?: string) {
    return this.prisma.scoreReport.findMany({
      where: { userId, ...(skill ? { skill: skill as any } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, skill: true, overallBand: true, createdAt: true },
    })
  }
}
