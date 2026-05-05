import { ScoreSpeakingWorker } from '../score-speaking.worker'

const mockSubmission = {
  id: 'sub-id',
  userId: 'user-id',
  transcript: 'Test spoken response transcript.',
  reservationId: 'reserve-id',
  question: { prompt: 'Test prompt', set: { taskType: 'part1' } },
}

const mockPromptPack = {
  systemPrompt: 'Score this speaking.',
  userPromptTemplate: '{{task_type}}\n{{prompt}}\n{{transcript}}',
}

const mockScoringResult = {
  criteria: [
    { name: 'Fluency and Coherence', band: 6.0, explanation: 'Good flow.', strengths: ['Clear'], weaknesses: [] },
    { name: 'Pronunciation', band: 6.5, explanation: 'Mostly clear.', strengths: [], weaknesses: [] },
    { name: 'Lexical Resource', band: 6.0, explanation: 'Adequate.', strengths: [], weaknesses: [] },
    { name: 'Grammatical Range and Accuracy', band: 6.0, explanation: 'Minor errors.', strengths: [], weaknesses: [] },
  ],
  improvementTasks: [{ description: 'Vary sentence structures', criterion: 'Grammatical Range and Accuracy' }],
}

const mockPrisma = {
  scoreReport: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'report-id' }),
  },
  submission: {
    update: jest.fn().mockResolvedValue({}),
    findUniqueOrThrow: jest.fn().mockResolvedValue(mockSubmission),
    findUnique: jest.fn().mockResolvedValue(mockSubmission),
  },
  promptPack: { findFirstOrThrow: jest.fn().mockResolvedValue(mockPromptPack) },
  criterionRow: { create: jest.fn() },
  improvementTask: { create: jest.fn() },
  $transaction: jest.fn(),
}

const mockAnthropic = {
  client: {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockScoringResult) }],
      }),
    },
  },
}

const mockWallet = { consume: jest.fn().mockResolvedValue({}), refund: jest.fn().mockResolvedValue({}) }
const mockNotification = { sendReportReady: jest.fn().mockResolvedValue(undefined) }

describe('ScoreSpeakingWorker', () => {
  let worker: ScoreSpeakingWorker

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.scoreReport.findUnique.mockResolvedValue(null)
    mockPrisma.scoreReport.create.mockResolvedValue({ id: 'report-id' })
    mockPrisma.submission.findUniqueOrThrow.mockResolvedValue(mockSubmission)
    mockPrisma.submission.findUnique.mockResolvedValue(mockSubmission)
    mockPrisma.submission.update.mockResolvedValue({})
    mockPrisma.promptPack.findFirstOrThrow.mockResolvedValue(mockPromptPack)
    mockAnthropic.client.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockScoringResult) }],
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockWallet.consume.mockResolvedValue({})
    mockWallet.refund.mockResolvedValue({})

    worker = new ScoreSpeakingWorker(mockPrisma as any, mockAnthropic as any, mockWallet as any, mockNotification as any)
  })

  it('scores transcript and consumes credits on success (AC-3)', async () => {
    await worker.process({ data: { submissionId: 'sub-id' } } as any)

    expect(mockAnthropic.client.messages.create).toHaveBeenCalled()
    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(mockWallet.consume).toHaveBeenCalledWith('reserve-id', 'consume:sub-id')
  })

  it('is idempotent — skips if report already exists', async () => {
    mockPrisma.scoreReport.findUnique.mockResolvedValue({ id: 'existing-report' })

    await worker.process({ data: { submissionId: 'sub-id' } } as any)

    expect(mockAnthropic.client.messages.create).not.toHaveBeenCalled()
  })

  it('refunds credits on permanent failure (AC-4)', async () => {
    const job = { data: { submissionId: 'sub-id' }, attemptsMade: 3, opts: { attempts: 3 } } as any

    await worker.onFailed(job, new Error('Claude API error'))

    expect(mockPrisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'failed' } }),
    )
    expect(mockWallet.refund).toHaveBeenCalledWith('reserve-id', 'refund:sub-id')
  })
})
