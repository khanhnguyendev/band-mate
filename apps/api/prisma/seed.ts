import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      monthlyCredits: 3,
      writingCreditCost: 2,
      speakingCreditCost: 2,
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { name: 'starter' },
    update: {},
    create: {
      name: 'starter',
      monthlyCredits: 20,
      writingCreditCost: 2,
      speakingCreditCost: 2,
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      monthlyCredits: 60,
      writingCreditCost: 1,
      speakingCreditCost: 1,
      isActive: true,
    },
  })

  console.log('Seeded plans')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
