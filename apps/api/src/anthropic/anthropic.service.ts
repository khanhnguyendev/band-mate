import Anthropic from '@anthropic-ai/sdk'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AnthropicService {
  readonly client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
}
