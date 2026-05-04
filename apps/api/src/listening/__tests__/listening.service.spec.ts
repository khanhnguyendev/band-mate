import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ListeningService } from '../listening.service'

const mockSet = {
  id: 'qs-listening-001',
  questions: [
    { id: 'q-1', prompt: 'Q1', answerKey: { answer: '$950' }, mediaUrl: 'https://cdn.example.com/audio.mp3', order: 1 },
    { id: 'q-2', prompt: 'Q2', answerKey: { answer: 'two' }, mediaUrl: null, order: 2 },
    { id: 'q-3', prompt: 'Q3', answerKey: { answer: 'third' }, mediaUrl: null, order: 3 },
  ],
}

const mockPrisma = {
  questionSet: { findUnique: jest.fn().mockResolvedValue(mockSet) },
  submission: { create: jest.fn().mockResolvedValue({ id: 'sub-id' }) },
}

const mockWallet = { grant: jest.fn().mockResolvedValue({}) }
const mockQuestions = { findListening: jest.fn().mockResolvedValue([mockSet]) }

describe('ListeningService', () => {
  let service: ListeningService
  const originalEnv = process.env.FEATURE_LISTENING

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.FEATURE_LISTENING = 'true'
    mockPrisma.questionSet.findUnique.mockResolvedValue(mockSet)
    mockPrisma.submission.create.mockResolvedValue({ id: 'sub-id' })
    mockWallet.grant.mockResolvedValue({})
    mockQuestions.findListening.mockResolvedValue([mockSet])
    service = new ListeningService(mockPrisma as any, mockWallet as any, mockQuestions as any)
  })

  afterEach(() => {
    process.env.FEATURE_LISTENING = originalEnv
  })

  it('scores all correct answers (AC-1)', async () => {
    const result = await service.submitListening('user-id', 'qs-listening-001', {
      'q-1': '$950',
      'q-2': 'two',
      'q-3': 'third',
    })

    expect(result.score).toBe(3)
    expect(result.total).toBe(3)
    expect(result.percentage).toBe(100)
    expect(result.breakdown.every((b) => b.correct)).toBe(true)
  })

  it('scores partial correct answers correctly', async () => {
    const result = await service.submitListening('user-id', 'qs-listening-001', {
      'q-1': '$950',
      'q-2': 'three',  // wrong
      'q-3': 'third',
    })

    expect(result.score).toBe(2)
    expect(result.percentage).toBe(67)
  })

  it('grants bonus credit on completion (AC-2)', async () => {
    await service.submitListening('user-id', 'qs-listening-001', {
      'q-1': '$950', 'q-2': 'two', 'q-3': 'third',
    })

    expect(mockWallet.grant).toHaveBeenCalledWith(
      'user-id', 1, expect.any(String), 'listening-bonus:user-id:qs-listening-001',
    )
  })

  it('is idempotent — double-submit uses same idempotency key', async () => {
    await service.submitListening('user-id', 'qs-listening-001', { 'q-1': '$950', 'q-2': 'two', 'q-3': 'third' })
    await service.submitListening('user-id', 'qs-listening-001', { 'q-1': '$950', 'q-2': 'two', 'q-3': 'third' })

    expect(mockWallet.grant).toHaveBeenCalledTimes(2)
    expect(mockWallet.grant).toHaveBeenCalledWith('user-id', 1, expect.any(String), 'listening-bonus:user-id:qs-listening-001')
  })

  it('throws NotFoundException for unknown set', async () => {
    mockPrisma.questionSet.findUnique.mockResolvedValue(null)
    await expect(service.submitListening('user-id', 'bad-id', {})).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when feature flag is off', async () => {
    process.env.FEATURE_LISTENING = 'false'
    await expect(service.submitListening('user-id', 'qs-listening-001', {})).rejects.toThrow(ForbiddenException)
  })

  it('is case-insensitive when comparing answers', async () => {
    const result = await service.submitListening('user-id', 'qs-listening-001', {
      'q-1': '$950',
      'q-2': 'TWO',
      'q-3': 'THIRD',
    })

    expect(result.score).toBe(3)
  })
})
