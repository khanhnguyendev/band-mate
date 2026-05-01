import { z } from 'zod'

const SkillEnum = z.enum(['writing', 'speaking', 'reading', 'listening'])

export const OnboardingSchema = z.object({
  targetBand: z.number().min(4.0).max(9.0).multipleOf(0.5),
  testDate: z.string().date().optional(),
  weakSkills: z.array(SkillEnum).min(1).max(4),
  motivation: z.string().min(1).max(500),
})

export type OnboardingInput = z.infer<typeof OnboardingSchema>
export type Skill = z.infer<typeof SkillEnum>
