import { Controller, Get, Query } from '@nestjs/common'
import { Difficulty, TaskType } from '@prisma/client'
import { Public } from '../common/decorators/public.decorator'
import { QuestionsService } from './questions.service'

@Controller('questions')
export class QuestionsController {
  constructor(private questions: QuestionsService) {}

  @Public()
  @Get('writing')
  async writing(@Query('type') type?: string, @Query('difficulty') difficulty?: string) {
    return this.questions.findWriting({
      type: type as TaskType | undefined,
      difficulty: difficulty as Difficulty | undefined,
    })
  }

  @Public()
  @Get('speaking')
  async speaking(@Query('part') part?: string, @Query('difficulty') difficulty?: string) {
    return this.questions.findSpeaking({
      part: part as TaskType | undefined,
      difficulty: difficulty as Difficulty | undefined,
    })
  }
}
