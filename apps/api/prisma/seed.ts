import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WRITING_SYSTEM_PROMPT = `You are an expert IELTS examiner. Score the provided IELTS Writing response strictly using official band descriptors.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "criteria": [
    {
      "name": "Task Response",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<2-3 sentences assessing task achievement>",
      "strengths": ["<strength>", "<strength>"],
      "weaknesses": ["<weakness>", "<weakness>"]
    },
    {
      "name": "Coherence and Cohesion",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment>",
      "strengths": [],
      "weaknesses": []
    },
    {
      "name": "Lexical Resource",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment>",
      "strengths": [],
      "weaknesses": []
    },
    {
      "name": "Grammatical Range and Accuracy",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment>",
      "strengths": [],
      "weaknesses": []
    }
  ],
  "improvementTasks": [
    { "description": "<specific, actionable improvement>", "criterion": "<criterion name>" }
  ]
}

All band scores must be between 0 and 9 in 0.5 increments. Be strict and accurate.`

const WRITING_USER_PROMPT_TEMPLATE = `IELTS Writing Task: {{task_type}}

Question/Prompt:
{{prompt}}

Candidate Response:
{{response}}

Score this response now.`

async function main() {
  // ─── Plans ─────────────────────────────────────────────────────────────────
  await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: { name: 'free', monthlyCredits: 3, writingCreditCost: 2, speakingCreditCost: 2, isActive: true },
  })
  await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: { name: 'starter', monthlyCredits: 20, writingCreditCost: 2, speakingCreditCost: 2, isActive: true },
  })
  await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: { name: 'pro', monthlyCredits: 60, writingCreditCost: 1, speakingCreditCost: 1, isActive: true },
  })
  console.log('✓ Plans seeded')

  // ─── Writing Question Sets ─────────────────────────────────────────────────
  const task2Set1 = await prisma.questionSet.upsert({
    where: { id: 'qs-writing-task2-001' },
    update: {},
    create: {
      id: 'qs-writing-task2-001',
      skill: 'writing',
      title: 'Technology and Society',
      taskType: 'task2',
      difficulty: 'band6',
      estimatedMinutes: 40,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-writing-001' },
    update: {},
    create: {
      id: 'q-writing-001',
      setId: task2Set1.id,
      prompt: 'Some people believe that technology has made our lives more complicated. Others think it has made life simpler. Discuss both views and give your own opinion.',
      order: 1,
    },
  })

  const task2Set2 = await prisma.questionSet.upsert({
    where: { id: 'qs-writing-task2-002' },
    update: {},
    create: {
      id: 'qs-writing-task2-002',
      skill: 'writing',
      title: 'Education and Employment',
      taskType: 'task2',
      difficulty: 'band7',
      estimatedMinutes: 40,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-writing-002' },
    update: {},
    create: {
      id: 'q-writing-002',
      setId: task2Set2.id,
      prompt: 'Universities should focus on providing students with skills that are directly relevant to the job market, rather than offering a broader academic education. To what extent do you agree or disagree?',
      order: 1,
    },
  })

  const task1Set1 = await prisma.questionSet.upsert({
    where: { id: 'qs-writing-task1-001' },
    update: {},
    create: {
      id: 'qs-writing-task1-001',
      skill: 'writing',
      title: 'Bar Chart — Energy Consumption',
      taskType: 'task1',
      difficulty: 'band6',
      estimatedMinutes: 20,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-writing-003' },
    update: {},
    create: {
      id: 'q-writing-003',
      setId: task1Set1.id,
      prompt: 'The bar chart below shows the average energy consumption per household in five countries in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\n[Bar chart data: USA: 1,200 kWh/month, Germany: 650 kWh/month, Japan: 580 kWh/month, Brazil: 370 kWh/month, India: 210 kWh/month]',
      order: 1,
    },
  })
  console.log('✓ Writing questions seeded')

  // ─── Writing Prompt Pack ───────────────────────────────────────────────────
  await prisma.promptPack.upsert({
    where: { id: 'pp-writing-v1' },
    update: {},
    create: {
      id: 'pp-writing-v1',
      skill: 'writing',
      version: '1.0.0',
      systemPrompt: WRITING_SYSTEM_PROMPT,
      userPromptTemplate: WRITING_USER_PROMPT_TEMPLATE,
      rubricSchema: {
        type: 'object',
        required: ['criteria', 'improvementTasks'],
        properties: {
          criteria: { type: 'array', minItems: 4, maxItems: 4 },
          improvementTasks: { type: 'array' },
        },
      },
      isActive: true,
    },
  })
  console.log('✓ Prompt pack seeded')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
