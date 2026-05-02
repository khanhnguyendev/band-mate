import { SubmissionsService } from '../submissions.service'

const mockQuestion = { id: 'q-id', prompt: 'Test prompt', set: { taskType: 'part1' } }
const mockReservation = { id: 'reserve-id', amount: -2 }
const mockSubmission = { id: 'sub-id', status: 'queued', creditCost: 2 }

const mockPrisma = { submission: { create: jest.fn() } }
const mockSupabase = {
  client: {
    storage: {
      from: jest.fn().mockReturnValue({
        createSignedUploadUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.example.com/upload', token: 'tok', path: 'speaking/user-id/123.webm' },
          error: null,
        }),
      }),
    },
  },
}
const mockWallet = { reserve: jest.fn().mockResolvedValue(mockReservation) }
const mockQuestions = { findQuestionById: jest.fn().mockResolvedValue(mockQuestion) }
const mockWritingQueue = { add: jest.fn() }
const mockTranscribeQueue = { add: jest.fn() }

describe('SubmissionsService.submitSpeaking()', () => {
  let service: SubmissionsService

  beforeEach(() => {
    jest.resetAllMocks()
    mockWallet.reserve.mockResolvedValue(mockReservation)
    mockQuestions.findQuestionById.mockResolvedValue(mockQuestion)
    mockPrisma.submission.create.mockResolvedValue(mockSubmission)
    mockSupabase.client.storage.from.mockReturnValue({
      createSignedUploadUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://storage.example.com/upload', token: 'tok', path: 'speaking/user-id/123.webm' },
        error: null,
      }),
    })
    service = new SubmissionsService(
      mockPrisma as any,
      mockSupabase as any,
      mockWallet as any,
      mockQuestions as any,
      mockWritingQueue as any,
      mockTranscribeQueue as any,
    )
  })

  it('reserves credits and enqueues transcription job (AC-2)', async () => {
    const result = await service.submitSpeaking('user-id', 'q-id', 'speaking/user-id/123.webm')

    expect(mockWallet.reserve).toHaveBeenCalledWith('user-id', 2, expect.any(String), expect.any(String))
    expect(mockPrisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ skill: 'speaking', audioKey: 'speaking/user-id/123.webm', reservationId: 'reserve-id' }),
      }),
    )
    expect(mockTranscribeQueue.add).toHaveBeenCalledWith('transcribe', { submissionId: 'sub-id' }, expect.any(Object))
    expect(result.submissionId).toBe('sub-id')
  })

  it('returns upload URL for audio key', async () => {
    const result = await service.getSpeakingUploadUrl('user-id', 'q-id')

    expect(result.uploadUrl).toBe('https://storage.example.com/upload')
    expect(result.audioKey).toMatch(/^speaking\/user-id\/\d+\.webm$/)
  })

  it('throws NotFoundException when question does not exist', async () => {
    mockQuestions.findQuestionById.mockResolvedValue(null)
    await expect(service.submitSpeaking('user-id', 'bad-id', 'audio.webm')).rejects.toThrow()
  })
})
