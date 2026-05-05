import { ScoreWritingWorker } from '../score-writing.worker'

const mockSubmission = {
  id: 'sub-id',
  userId: 'user-id',
  inputText: 'Test essay text',
  reservationId: 'reserve-id',
  question: { prompt: 'Test prompt', set: { taskType: 'task2' } },
}

const mockPromptPack = {
  systemPrompt: 'Score this.',
  userPromptTemplate: 'Task: {{task_type}}\nPrompt: {{prompt}}\nResponse: {{response}}',
}

const mockScoringResult = {
  criteria: [
    { name: 'Task Response', band: 6.0, explanation: 'Good.', strengths: ['Clear'], weaknesses: ['Vague'] },
    { name: 'Coherence and Cohesion', band: 6.5, explanation: 'Well structured.', strengths: [], weaknesses: [] },
    { name: 'Lexical Resource', band: 6.0, explanation: 'Adequate vocab.', strengths: [], weaknesses: [] },
    { name: 'Grammatical Range and Accuracy', band: 6.5, explanation: 'Minor errors.', strengths: [], weaknesses: [] },
  ],
  improvementTasks: [{ description: 'Expand vocabulary range', criterion: 'Lexical Resource' }],
}

const mockPrisma = {
  scoreReport: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'report-id' }) },
  submission: { update: jest.fn(), findUniqueOrThrow: jest.fn().mockResolvedValue(mockSubmission), findUnique: jest.fn().mockResolvedValue(mockSubmission) },
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

describe('ScoreWritingWorker', () => {
  let worker: ScoreWritingWorker

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.scoreReport.findUnique.mockResolvedValue(null)
    mockPrisma.submission.findUniqueOrThrow.mockResolvedValue(mockSubmission)
    mockPrisma.promptPack.findFirstOrThrow.mockResolvedValue(mockPromptPack)
    mockAnthropic.client.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockScoringResult) }],
    })
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => fn(mockPrisma))
    mockPrisma.scoreReport.create.mockResolvedValue({ id: 'report-id' })
    mockWallet.consume.mockResolvedValue({})
    mockWallet.refund.mockResolvedValue({})

    worker = new ScoreWritingWorker(mockPrisma as any, mockAnthropic as any, mockWallet as any, mockNotification as any)
  })

  it('scores submission and consumes credits on success (AC-3)', async () => {
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
    const job = {
      data: { submissionId: 'sub-id' },
      attemptsMade: 3,
      opts: { attempts: 3 },
    } as any
    mockPrisma.submission.update.mockResolvedValue({})
    mockPrisma.submission.findUnique.mockResolvedValue(mockSubmission)

    await worker.onFailed(job, new Error('AI API error'))

    expect(mockPrisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'failed' } }),
    )
    expect(mockWallet.refund).toHaveBeenCalledWith('reserve-id', 'refund:sub-id')
  })
})
