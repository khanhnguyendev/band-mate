import { UsersController } from '../users.controller'

const mockUser = {
  id: 'app-uuid',
  email: 'test@example.com',
  name: 'Test User',
  role: 'learner',
  targetBand: 6.5,
  testDate: null,
  weakSkills: ['writing'],
  motivation: 'University abroad',
  onboardingCompletedAt: new Date('2026-05-01T00:00:00Z'),
  createdAt: new Date(),
  wallet: { balance: 3, bonusBalance: 0, bonusExpiresAt: null },
}

const mockSupabaseUser = { id: 'supa-uuid', email: 'test@example.com' } as any

const mockUsersService = {
  findOrCreate: jest.fn().mockResolvedValue(mockUser),
  completeOnboarding: jest.fn().mockResolvedValue(mockUser),
}

describe('UsersController PATCH /onboarding', () => {
  let controller: UsersController

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new UsersController(mockUsersService as any)
  })

  it('parses payload and calls completeOnboarding', async () => {
    const body = {
      targetBand: 6.5,
      weakSkills: ['writing'],
      motivation: 'University abroad',
    }

    const result = await controller.onboarding(mockSupabaseUser, body)

    expect(mockUsersService.findOrCreate).toHaveBeenCalledWith(mockSupabaseUser)
    expect(mockUsersService.completeOnboarding).toHaveBeenCalledWith('app-uuid', {
      targetBand: 6.5,
      weakSkills: ['writing'],
      motivation: 'University abroad',
    })
    expect(result.user.onboardingCompletedAt).toBeDefined()
    expect(result.wallet.balance).toBe(3)
  })

  it('rejects invalid payload with ZodError', async () => {
    const body = { targetBand: 99, weakSkills: [], motivation: '' }
    await expect(controller.onboarding(mockSupabaseUser, body)).rejects.toThrow()
  })
})
