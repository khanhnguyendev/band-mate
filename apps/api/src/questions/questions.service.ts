import { Injectable } from '@nestjs/common'
import { Difficulty, Skill, TaskType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findWriting(filters: { type?: TaskType; difficulty?: Difficulty }) {
    return this.prisma.questionSet.findMany({
      where: {
        skill: Skill.writing,
        isPublished: true,
        ...(filters.type ? { taskType: filters.type } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      include: { questions: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findListening(filters: { difficulty?: Difficulty }) {
    return this.prisma.questionSet.findMany({
      where: {
        skill: Skill.listening,
        isPublished: true,
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findReading(filters: { difficulty?: Difficulty }) {
    return this.prisma.questionSet.findMany({
      where: {
        skill: Skill.reading,
        isPublished: true,
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findSpeaking(filters: { part?: TaskType; difficulty?: Difficulty }) {
    return this.prisma.questionSet.findMany({
      where: {
        skill: Skill.speaking,
        isPublished: true,
        ...(filters.part ? { taskType: filters.part } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      include: { questions: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findQuestionById(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { set: true },
    })
  }
}
