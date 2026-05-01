import { WalletService } from '../wallet.service'

const walletRow = { id: 'wallet-uuid', userId: 'user-uuid', balance: 0, bonusBalance: 0 }
const ledgerRow = { id: 'ledger-uuid', walletId: 'wallet-uuid', type: 'grant', amount: 3, balanceAfter: 3, idempotencyKey: 'onboarding:user-uuid' }

const mockPrisma = {
  ledgerEntry: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  wallet: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('WalletService', () => {
  let service: WalletService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WalletService(mockPrisma as any)
  })

  it('grants credits and writes ledger entry (AC-3)', async () => {
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue(walletRow)
      mockPrisma.wallet.update.mockResolvedValue({ ...walletRow, balance: 3 })
      mockPrisma.ledgerEntry.create.mockResolvedValue(ledgerRow)
      return fn(mockPrisma)
    })

    const result = await service.grant('user-uuid', 3, 'Onboarding trial credits', 'onboarding:user-uuid')

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(result.balanceAfter).toBe(3)
    expect(result.idempotencyKey).toBe('onboarding:user-uuid')
  })

  it('is idempotent — returns existing entry without re-granting', async () => {
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(ledgerRow)

    const result = await service.grant('user-uuid', 3, 'Onboarding trial credits', 'onboarding:user-uuid')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(result).toEqual(ledgerRow)
  })
})
