import { SubmissionsService } from '../submissions.service'

const mockQuestion = { id: 'q-id', prompt: 'Test prompt', set: { taskType: 'task2' } }
const mockReservation = { id: 'reserve-id', amount: -2 }
const mockSubmission = { id: 'sub-id', status: 'queued', creditCost: 2 }

const mockPrisma = { submission: { create: jest.fn() } }
const mockWallet = { reserve: jest.fn().mockResolvedValue(mockReservation) }
const mockQuestions = { findQuestionById: jest.fn().mockResolvedValue(mockQuestion) }
const mockQueue = { add: jest.fn() }

describe('SubmissionsService.submitWriting()', () => {
  let service: SubmissionsService

  beforeEach(() => {
    jest.resetAllMocks()
    mockWallet.reserve.mockResolvedValue(mockReservation)
    mockQuestions.findQuestionById.mockResolvedValue(mockQuestion)
    mockPrisma.submission.create.mockResolvedValue(mockSubmission)
    service = new SubmissionsService(
      mockPrisma as any,
      mockWallet as any,
      mockQuestions as any,
      mockQueue as any,
    )
  })

  it('reserves credits before enqueuing (AC-2)', async () => {
    const result = await service.submitWriting('user-id', 'q-id', 'A'.repeat(100))

    expect(mockWallet.reserve).toHaveBeenCalledWith('user-id', 2, expect.any(String), expect.any(String))
    expect(mockPrisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reservationId: 'reserve-id' }) }),
    )
    expect(mockQueue.add).toHaveBeenCalledWith('score', { submissionId: 'sub-id' }, expect.any(Object))
    expect(result.submissionId).toBe('sub-id')
  })

  it('throws NotFoundException when question does not exist', async () => {
    mockQuestions.findQuestionById.mockResolvedValue(null)
    await expect(service.submitWriting('user-id', 'bad-id', 'A'.repeat(100))).rejects.toThrow()
  })
})
