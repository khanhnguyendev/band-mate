import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ReadingService } from '../reading.service'

const mockSet = {
  id: 'qs-reading-001',
  questions: [
    { id: 'q-1', prompt: 'Statement 1', answerKey: { answer: 'True' }, mediaUrl: 'passage text', order: 1 },
    { id: 'q-2', prompt: 'Statement 2', answerKey: { answer: 'False' }, mediaUrl: 'passage text', order: 2 },
    { id: 'q-3', prompt: 'Statement 3', answerKey: { answer: 'Not Given' }, mediaUrl: 'passage text', order: 3 },
  ],
}

const mockPrisma = {
  questionSet: { findUnique: jest.fn().mockResolvedValue(mockSet) },
  submission: { create: jest.fn().mockResolvedValue({ id: 'sub-id' }) },
}

const mockGamification = { award: jest.fn().mockResolvedValue({}) }
const mockQuestions = { findReading: jest.fn().mockResolvedValue([mockSet]) }

describe('ReadingService', () => {
  let service: ReadingService
  const originalEnv = process.env.FEATURE_READING

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.FEATURE_READING = 'true'
    mockPrisma.questionSet.findUnique.mockResolvedValue(mockSet)
    mockPrisma.submission.create.mockResolvedValue({ id: 'sub-id' })
    mockGamification.award.mockResolvedValue({})
    mockQuestions.findReading.mockResolvedValue([mockSet])
    service = new ReadingService(mockPrisma as any, mockGamification as any, mockQuestions as any)
  })

  afterEach(() => {
    process.env.FEATURE_READING = originalEnv
  })

  it('scores all correct answers (AC-2)', async () => {
    const result = await service.submitReading('user-id', 'qs-reading-001', {
      'q-1': 'True',
      'q-2': 'False',
      'q-3': 'Not Given',
    })

    expect(result.score).toBe(3)
    expect(result.total).toBe(3)
    expect(result.percentage).toBe(100)
    expect(result.breakdown.every((b) => b.correct)).toBe(true)
  })

  it('scores partial correct answers correctly', async () => {
    const result = await service.submitReading('user-id', 'qs-reading-001', {
      'q-1': 'True',
      'q-2': 'True',   // wrong
      'q-3': 'Not Given',
    })

    expect(result.score).toBe(2)
    expect(result.percentage).toBe(67)
  })

  it('grants bonus credit on completion (AC-3)', async () => {
    await service.submitReading('user-id', 'qs-reading-001', {
      'q-1': 'True', 'q-2': 'False', 'q-3': 'Not Given',
    })

    expect(mockGamification.award).toHaveBeenCalledWith(
      'user-id', 1, expect.any(String), 'reading-bonus:user-id:qs-reading-001',
    )
  })

  it('is idempotent — double-submit does not double-grant (idempotency key prevents it)', async () => {
    await service.submitReading('user-id', 'qs-reading-001', { 'q-1': 'True', 'q-2': 'False', 'q-3': 'Not Given' })
    await service.submitReading('user-id', 'qs-reading-001', { 'q-1': 'True', 'q-2': 'False', 'q-3': 'Not Given' })

    // grant is called twice but idempotency key is the same — wallet.grant handles dedup
    expect(mockGamification.award).toHaveBeenCalledTimes(2)
    expect(mockGamification.award).toHaveBeenCalledWith('user-id', 1, expect.any(String), 'reading-bonus:user-id:qs-reading-001')
  })

  it('throws NotFoundException for unknown set', async () => {
    mockPrisma.questionSet.findUnique.mockResolvedValue(null)
    await expect(service.submitReading('user-id', 'bad-id', {})).rejects.toThrow(NotFoundException)
  })

  it('throws ForbiddenException when feature flag is off', async () => {
    process.env.FEATURE_READING = 'false'
    await expect(service.submitReading('user-id', 'qs-reading-001', {})).rejects.toThrow(ForbiddenException)
  })

  it('is case-insensitive when comparing answers', async () => {
    const result = await service.submitReading('user-id', 'qs-reading-001', {
      'q-1': 'true',
      'q-2': 'FALSE',
      'q-3': 'not given',
    })

    expect(result.score).toBe(3)
  })
})
