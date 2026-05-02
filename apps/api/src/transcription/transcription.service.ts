import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name)
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  constructor(private supabase: SupabaseService) {}

  async transcribeAudio(audioKey: string): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from('audio-submissions')
      .download(audioKey)

    if (error || !data) {
      throw new Error(`Failed to download audio ${audioKey}: ${error?.message}`)
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    const ext = audioKey.split('.').pop() ?? 'webm'
    const file = new File([buffer], `audio.${ext}`, { type: `audio/${ext}` })

    const result = await this.openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
    })

    this.logger.log(`Transcribed ${audioKey} — ${result.text.length} chars`)
    return result.text
  }
}
