import { z } from 'zod'

export const UserRoleSchema = z.enum(['learner', 'admin'])

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  targetBand: z.number().min(0).max(9).multipleOf(0.5).optional(),
  testDate: z.string().date().optional().nullable(),
  weakSkills: z.array(z.enum(['writing', 'speaking', 'reading', 'listening'])).optional(),
  motivation: z.enum(['university', 'immigration', 'career', 'other']).optional(),
})

export type UserRole = z.infer<typeof UserRoleSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
