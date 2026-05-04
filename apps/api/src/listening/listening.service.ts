import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { GamificationService } from '../gamification/gamification.service'
import { PrismaService } from '../prisma/prisma.service'
import { QuestionsService } from '../questions/questions.service'

interface AnswerKey {
  answer: string
}

interface BreakdownItem {
  questionId: string
  correct: boolean
  userAnswer: string
  correctAnswer: string
}

@Injectable()
export class ListeningService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private questions: QuestionsService,
  ) {}

  private assertFeatureEnabled() {
    if (process.env.FEATURE_LISTENING !== 'true') {
      throw new ForbiddenException('Listening practice is not yet available')
    }
  }

  async findSets() {
    this.assertFeatureEnabled()
    return this.questions.findListening({})
  }

  async submitListening(userId: string, setId: string, answers: Record<string, string>) {
    this.assertFeatureEnabled()

    const set = await this.prisma.questionSet.findUnique({
      where: { id: setId },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    if (!set) throw new NotFoundException('Listening set not found')

    const breakdown: BreakdownItem[] = set.questions.map((q) => {
      const key = q.answerKey as AnswerKey | null
      const correctAnswer = key?.answer ?? ''
      const userAnswer = (answers[q.id] ?? '').trim()
      return {
        questionId: q.id,
        correct: userAnswer.toLowerCase() === correctAnswer.toLowerCase(),
        userAnswer,
        correctAnswer,
      }
    })

    const score = breakdown.filter((b) => b.correct).length
    const total = breakdown.length
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0

    await this.prisma.submission.create({
      data: {
        userId,
        questionId: set.questions[0]?.id ?? setId,
        skill: 'listening',
        status: 'completed',
        inputText: JSON.stringify(answers),
        creditCost: 0,
      },
    })

    // Grant 1 bonus credit on completion — quest system integration in Module 9
    await this.gamification.award(userId, 1, `Listening bonus — set ${setId}`, `listening-bonus:${userId}:${setId}`)

    return { score, total, percentage, breakdown }
  }
}
