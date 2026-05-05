import type { UserRole } from '../schemas/user'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  targetBand: number | null
  testDate: string | null
  weakSkills: string[]
  motivation: string | null
  onboardingCompletedAt: string | null
  createdAt: string
}

export interface WalletSummary {
  balance: number
  bonusBalance: number
  bonusExpiresAt: string | null
}

export interface MeResponse {
  user: UserProfile
  wallet: WalletSummary
}
