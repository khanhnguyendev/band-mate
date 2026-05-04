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
export class ReadingService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private questions: QuestionsService,
  ) {}

  private assertFeatureEnabled() {
    if (process.env.FEATURE_READING !== 'true') {
      throw new ForbiddenException('Reading practice is not yet available')
    }
  }

  async findSets() {
    this.assertFeatureEnabled()
    return this.questions.findReading({})
  }

  async submitReading(userId: string, setId: string, answers: Record<string, string>) {
    this.assertFeatureEnabled()

    const sets = await this.prisma.questionSet.findUnique({
      where: { id: setId },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    if (!sets) throw new NotFoundException('Reading set not found')

    const breakdown: BreakdownItem[] = sets.questions.map((q) => {
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
        questionId: sets.questions[0]?.id ?? setId,
        skill: 'reading',
        status: 'completed',
        inputText: JSON.stringify(answers),
        creditCost: 0,
      },
    })

    // Award bonus credit via gamification (cap-enforced, idempotent)
    await this.gamification.award(userId, 1, `Reading bonus — set ${setId}`, `reading-bonus:${userId}:${setId}`)

    return { score, total, percentage, breakdown }
  }
}
