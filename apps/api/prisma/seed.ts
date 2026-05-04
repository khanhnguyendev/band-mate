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

  // ─── Speaking Question Sets ────────────────────────────────────────────────
  const part1Set = await prisma.questionSet.upsert({
    where: { id: 'qs-speaking-part1-001' },
    update: {},
    create: {
      id: 'qs-speaking-part1-001',
      skill: 'speaking',
      title: 'Part 1 — Daily Life',
      taskType: 'part1',
      difficulty: 'band6',
      estimatedMinutes: 5,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-speaking-001' },
    update: {},
    create: {
      id: 'q-speaking-001',
      setId: part1Set.id,
      prompt: 'The examiner will ask you questions about yourself and familiar topics. Topics may include: your hometown, your studies or work, hobbies, daily routine, or travel.\n\nExample questions:\n1. Where are you from, and what do you like most about your hometown?\n2. Do you prefer spending time indoors or outdoors? Why?\n3. How do you usually spend your weekends?',
      order: 1,
    },
  })

  const part2Set = await prisma.questionSet.upsert({
    where: { id: 'qs-speaking-part2-001' },
    update: {},
    create: {
      id: 'qs-speaking-part2-001',
      skill: 'speaking',
      title: 'Part 2 — Describe a Person',
      taskType: 'part2',
      difficulty: 'band6',
      estimatedMinutes: 4,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-speaking-002' },
    update: {},
    create: {
      id: 'q-speaking-002',
      setId: part2Set.id,
      prompt: 'Describe a person who has had a significant influence on your life.\n\nYou should say:\n• who this person is\n• how you know them\n• what they have done that has influenced you\n• and explain why their influence has been important to you.\n\nYou have one minute to prepare. Then speak for 1–2 minutes.',
      order: 1,
    },
  })

  const part3Set = await prisma.questionSet.upsert({
    where: { id: 'qs-speaking-part3-001' },
    update: {},
    create: {
      id: 'qs-speaking-part3-001',
      skill: 'speaking',
      title: 'Part 3 — Influence and Society',
      taskType: 'part3',
      difficulty: 'band7',
      estimatedMinutes: 5,
    },
  })
  await prisma.question.upsert({
    where: { id: 'q-speaking-003' },
    update: {},
    create: {
      id: 'q-speaking-003',
      setId: part3Set.id,
      prompt: 'The examiner will ask you more abstract questions related to the Part 2 topic of influential people.\n\nExample questions:\n1. In what ways can famous people influence young people in society today?\n2. Do you think social media has changed the type of people who are considered influential? How?\n3. Is it better for a society to have many role models or just a few very prominent ones?',
      order: 1,
    },
  })
  console.log('✓ Speaking questions seeded')

  // ─── Speaking Prompt Pack ──────────────────────────────────────────────────
  await prisma.promptPack.upsert({
    where: { id: 'pp-speaking-v1' },
    update: {},
    create: {
      id: 'pp-speaking-v1',
      skill: 'speaking',
      version: '1.0.0',
      systemPrompt: `You are an expert IELTS Speaking examiner. Score the provided transcript of a candidate's spoken response using official IELTS band descriptors.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "criteria": [
    {
      "name": "Fluency and Coherence",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<2-3 sentences assessing fluency, hesitation, and logical flow>",
      "strengths": ["<strength>"],
      "weaknesses": ["<weakness>"]
    },
    {
      "name": "Pronunciation",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment of intelligibility, stress, intonation, and sounds>",
      "strengths": [],
      "weaknesses": []
    },
    {
      "name": "Lexical Resource",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment of vocabulary range, precision, and naturalness>",
      "strengths": [],
      "weaknesses": []
    },
    {
      "name": "Grammatical Range and Accuracy",
      "band": <0-9 in 0.5 increments>,
      "explanation": "<assessment of grammatical structures, complexity, and error frequency>",
      "strengths": [],
      "weaknesses": []
    }
  ],
  "improvementTasks": [
    { "description": "<specific, actionable improvement for spoken English>", "criterion": "<criterion name>" }
  ]
}

Note: You are scoring a transcript of spoken language. Consider that natural spoken English differs from written English — focus on fluency, coherence, and communication effectiveness. All band scores must be between 0 and 9 in 0.5 increments.`,
      userPromptTemplate: `IELTS Speaking {{task_type}}

Topic/Prompt:
{{prompt}}

Candidate Transcript:
{{transcript}}

Score this spoken response now.`,
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
  console.log('✓ Speaking prompt pack seeded')

  // ─── Reading Question Set ──────────────────────────────────────────────────
  const readingSet1 = await prisma.questionSet.upsert({
    where: { id: 'qs-reading-academic-001' },
    update: {},
    create: {
      id: 'qs-reading-academic-001',
      skill: 'reading',
      title: 'Climate Change and Global Policy',
      taskType: 'task1',
      difficulty: 'band6',
      estimatedMinutes: 20,
    },
  })

  const readingPassage = `Climate change has emerged as one of the most pressing challenges of the twenty-first century. Scientific consensus, represented by bodies such as the Intergovernmental Panel on Climate Change (IPCC), confirms that global average temperatures have risen by approximately 1.1 degrees Celsius above pre-industrial levels. This warming trend is primarily attributed to increased concentrations of greenhouse gases resulting from human activities, particularly the burning of fossil fuels and deforestation.

International efforts to address climate change culminated in the Paris Agreement of 2015, which committed signatory nations to limiting global warming to well below 2 degrees Celsius, with an aspirational target of 1.5 degrees Celsius. However, critics argue that the voluntary nature of national commitments under this framework makes enforcement practically impossible. Several major economies have revised their targets upward since the agreement was signed, while others have temporarily withdrawn from the accord entirely.

Renewable energy adoption has accelerated markedly over the past decade. Solar panel installation costs have fallen by over 80 percent since 2010, making solar power cost-competitive with fossil fuels in many regions. Wind energy capacity has similarly expanded, with offshore installations becoming increasingly common in European waters. Despite this progress, fossil fuels still account for more than 80 percent of global primary energy consumption, suggesting that the energy transition remains incomplete.`

  const readingQuestions = [
    { id: 'q-reading-001', prompt: 'The IPCC represents scientific consensus on the topic of climate change.', answerKey: { answer: 'True' }, order: 1 },
    { id: 'q-reading-002', prompt: 'Global temperatures have risen by exactly 1.5 degrees Celsius above pre-industrial levels.', answerKey: { answer: 'False' }, order: 2 },
    { id: 'q-reading-003', prompt: 'The Paris Agreement requires member nations to submit to binding international enforcement mechanisms.', answerKey: { answer: 'False' }, order: 3 },
    { id: 'q-reading-004', prompt: 'The cost of installing solar panels has decreased significantly since 2010.', answerKey: { answer: 'True' }, order: 4 },
    { id: 'q-reading-005', prompt: 'Offshore wind installations are more cost-effective than onshore installations.', answerKey: { answer: 'Not Given' }, order: 5 },
  ]

  for (const q of readingQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: { id: q.id, setId: readingSet1.id, prompt: q.prompt, answerKey: q.answerKey, order: q.order, mediaUrl: readingPassage },
    })
  }
  console.log('✓ Reading questions seeded')

  // ─── Listening Question Set ────────────────────────────────────────────────
  const listeningSet1 = await prisma.questionSet.upsert({
    where: { id: 'qs-listening-s1-001' },
    update: {},
    create: {
      id: 'qs-listening-s1-001',
      skill: 'listening',
      title: 'Section 1 — Apartment Enquiry',
      taskType: 'task1',
      difficulty: 'band6',
      estimatedMinutes: 10,
    },
  })

  // Audio URL stored in mediaUrl of the first question; placeholder until real audio is recorded
  const LISTENING_AUDIO_URL = 'https://cdn.bandmate.app/audio/sample-listening-s1-001.mp3'

  const listeningQuestions = [
    { id: 'q-listening-001', prompt: 'What is the monthly rent for the apartment?', answerKey: { answer: '$950' }, order: 1 },
    { id: 'q-listening-002', prompt: 'How many bedrooms does the apartment have?', answerKey: { answer: 'two' }, order: 2 },
    { id: 'q-listening-003', prompt: 'Which floor is the apartment on?', answerKey: { answer: 'third' }, order: 3 },
    { id: 'q-listening-004', prompt: 'Is parking included in the rent?', answerKey: { answer: 'yes' }, order: 4 },
    { id: 'q-listening-005', prompt: 'When is the earliest move-in date?', answerKey: { answer: '1st of next month' }, order: 5 },
  ]

  for (let i = 0; i < listeningQuestions.length; i++) {
    const q = listeningQuestions[i]
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        setId: listeningSet1.id,
        prompt: q.prompt,
        answerKey: q.answerKey,
        order: q.order,
        mediaUrl: i === 0 ? LISTENING_AUDIO_URL : null,
      },
    })
  }
  console.log('✓ Listening questions seeded')

  await seedGamification()
}

async function seedGamification() {
  // Game config — earn caps and reward amounts (editable by admin in DB)
  const configs = [
    { key: 'daily_earn_cap', value: '5' },
    { key: 'weekly_earn_cap', value: '20' },
    { key: 'reading_reward', value: '1' },
    { key: 'listening_reward', value: '1' },
  ]
  for (const config of configs) {
    await prisma.gameConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log('✓ Game config seeded')

  // Quest definitions
  const quests = [
    { id: 'quest-daily-reading', title: 'Reader', description: 'Complete 1 reading set today', action: 'reading_complete', requiredCount: 1, rewardCredits: 1, period: 'daily' },
    { id: 'quest-daily-listening', title: 'Listener', description: 'Complete 1 listening set today', action: 'listening_complete', requiredCount: 1, rewardCredits: 1, period: 'daily' },
    { id: 'quest-daily-speaking', title: 'Speaker', description: 'Submit 1 speaking response today', action: 'speaking_submit', requiredCount: 1, rewardCredits: 1, period: 'daily' },
    { id: 'quest-weekly-allskills', title: 'All-Rounder', description: 'Practice all 4 skills this week', action: 'all_skills', requiredCount: 4, rewardCredits: 3, period: 'weekly' },
  ]
  for (const quest of quests) {
    await prisma.questDefinition.upsert({
      where: { id: quest.id },
      update: {},
      create: quest,
    })
  }
  console.log('✓ Quest definitions seeded')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
