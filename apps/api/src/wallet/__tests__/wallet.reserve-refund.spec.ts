import { HttpException } from '@nestjs/common'
import { WalletService } from '../wallet.service'

const walletRow = { id: 'wallet-id', userId: 'user-id', balance: 10, bonusBalance: 0 }
const reserveEntry = { id: 'ledger-reserve-id', walletId: 'wallet-id', amount: -2, balanceAfter: 8, idempotencyKey: 'reserve:test' }

const mockPrisma = {
  ledgerEntry: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn() },
  wallet: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
}

describe('WalletService.reserve()', () => {
  let service: WalletService

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(null)
    service = new WalletService(mockPrisma as any)
  })

  it('deducts credits and creates reserve ledger entry (AC-2)', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue(walletRow)
      mockPrisma.wallet.update.mockResolvedValue({ ...walletRow, balance: 8 })
      mockPrisma.ledgerEntry.create.mockResolvedValue(reserveEntry)
      return fn(mockPrisma)
    })

    const result = await service.reserve('user-id', 2, 'Writing submission', 'reserve:test')

    expect(mockPrisma.$transaction).toHaveBeenCalled()
    expect(result.amount).toBe(-2)
    expect(result.balanceAfter).toBe(8)
  })

  it('throws 402 when balance is insufficient (AC-2)', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({ ...walletRow, balance: 1 })
      return fn(mockPrisma)
    })

    await expect(service.reserve('user-id', 2, 'Writing submission', 'reserve:test'))
      .rejects.toThrow(HttpException)
  })

  it('is idempotent — returns existing entry without double-deducting', async () => {
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(reserveEntry)

    const result = await service.reserve('user-id', 2, 'Writing submission', 'reserve:test')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(result).toEqual(reserveEntry)
  })
})

describe('WalletService.refund()', () => {
  let service: WalletService

  beforeEach(() => {
    jest.resetAllMocks()
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(null)
    service = new WalletService(mockPrisma as any)
  })

  it('restores balance and creates refund ledger entry (AC-4)', async () => {
    const refundEntry = { id: 'ledger-refund-id', walletId: 'wallet-id', type: 'refund', amount: 2, balanceAfter: 10 }
    mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
      mockPrisma.ledgerEntry.findUniqueOrThrow = jest.fn().mockResolvedValue(reserveEntry)
      mockPrisma.wallet.findUniqueOrThrow.mockResolvedValue({ ...walletRow, balance: 8 })
      mockPrisma.wallet.update.mockResolvedValue({ ...walletRow, balance: 10 })
      mockPrisma.ledgerEntry.create.mockResolvedValue(refundEntry)
      return fn(mockPrisma)
    })

    const result = await service.refund('ledger-reserve-id', 'refund:test')

    expect(result.amount).toBe(2)
    expect(result.balanceAfter).toBe(10)
  })

  it('is idempotent — returns existing refund entry', async () => {
    const existing = { id: 'ledger-refund-id', type: 'refund' }
    mockPrisma.ledgerEntry.findUnique.mockResolvedValue(existing)

    const result = await service.refund('ledger-reserve-id', 'refund:test')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(result).toEqual(existing)
  })
})
