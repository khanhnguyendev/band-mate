import { UsersService } from '../users.service'

const mockUser = {
  id: 'app-uuid',
  supabaseUserId: 'supa-uuid',
  email: 'test@example.com',
  name: 'Test User',
  role: 'learner',
  wallet: { balance: 0, bonusBalance: 0, bonusExpiresAt: null },
}

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  wallet: { create: jest.fn() },
  $transaction: jest.fn(),
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new UsersService(mockPrisma as any)
  })

  it('returns existing user without creating (idempotent)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    const result = await service.findOrCreate({ id: 'supa-uuid', email: 'test@example.com' } as any)
    expect(result).toEqual(mockUser)
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates user and wallet on first login (AC-4)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.user.create.mockResolvedValue({ id: 'app-uuid' })
      mockPrisma.wallet.create.mockResolvedValue({})
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      return fn(mockPrisma)
    })

    const result = await service.findOrCreate({
      id: 'supa-uuid',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    } as any)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(result).toEqual(mockUser)
  })
})
