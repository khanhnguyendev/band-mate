import { TranscribeAudioWorker } from '../transcribe-audio.worker'

const mockSubmission = {
  id: 'sub-id',
  userId: 'user-id',
  audioKey: 'speaking/user-id/123.webm',
  transcript: null,
  reservationId: 'reserve-id',
}

const mockPrisma = {
  submission: {
    findUniqueOrThrow: jest.fn().mockResolvedValue(mockSubmission),
    findUnique: jest.fn().mockResolvedValue(mockSubmission),
    update: jest.fn().mockResolvedValue({}),
  },
}

const mockTranscription = { transcribeAudio: jest.fn().mockResolvedValue('This is a test transcript.') }
const mockWallet = { refund: jest.fn().mockResolvedValue({}) }
const mockScoreQueue = { add: jest.fn().mockResolvedValue({}) }

describe('TranscribeAudioWorker', () => {
  let worker: TranscribeAudioWorker

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.submission.findUniqueOrThrow.mockResolvedValue(mockSubmission)
    mockPrisma.submission.findUnique.mockResolvedValue(mockSubmission)
    mockPrisma.submission.update.mockResolvedValue({})
    mockTranscription.transcribeAudio.mockResolvedValue('This is a test transcript.')
    mockWallet.refund.mockResolvedValue({})
    mockScoreQueue.add.mockResolvedValue({})

    worker = new TranscribeAudioWorker(
      mockPrisma as any,
      mockTranscription as any,
      mockWallet as any,
      mockScoreQueue as any,
    )
  })

  it('transcribes audio and enqueues score-speaking job (AC-2)', async () => {
    await worker.process({ data: { submissionId: 'sub-id' } } as any)

    expect(mockTranscription.transcribeAudio).toHaveBeenCalledWith('speaking/user-id/123.webm')
    expect(mockPrisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ transcript: 'This is a test transcript.' }) }),
    )
    expect(mockScoreQueue.add).toHaveBeenCalledWith('score', { submissionId: 'sub-id' }, expect.any(Object))
  })

  it('is idempotent — skips transcription if transcript already set', async () => {
    mockPrisma.submission.findUniqueOrThrow.mockResolvedValue({ ...mockSubmission, transcript: 'Already done.' })

    await worker.process({ data: { submissionId: 'sub-id' } } as any)

    expect(mockTranscription.transcribeAudio).not.toHaveBeenCalled()
    expect(mockScoreQueue.add).toHaveBeenCalledWith('score', { submissionId: 'sub-id' }, expect.any(Object))
  })

  it('refunds credits on permanent failure (AC-4)', async () => {
    const job = { data: { submissionId: 'sub-id' }, attemptsMade: 3, opts: { attempts: 3 } } as any
    mockPrisma.submission.update.mockResolvedValue({})

    await worker.onFailed(job, new Error('Whisper API error'))

    expect(mockPrisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'failed' } }),
    )
    expect(mockWallet.refund).toHaveBeenCalledWith('reserve-id', 'refund:sub-id')
  })
})
