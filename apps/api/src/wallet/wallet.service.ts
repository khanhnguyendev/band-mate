import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async grant(userId: string, amount: number, description: string, idempotencyKey: string) {
    const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
    if (existing) return existing

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } })
        const newBalance = wallet.balance + amount
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } })
        return tx.ledgerEntry.create({
          data: { walletId: wallet.id, type: 'grant', amount, balanceAfter: newBalance, description, idempotencyKey },
        })
      },
      { isolationLevel: 'Serializable' },
    )
  }

  async reserve(userId: string, amount: number, description: string, idempotencyKey: string) {
    const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
    if (existing) return existing

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } })

        if (wallet.balance < amount) {
          throw new HttpException('Insufficient credits', HttpStatus.PAYMENT_REQUIRED)
        }

        const newBalance = wallet.balance - amount
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } })

        return tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'reserve',
            amount: -amount,
            balanceAfter: newBalance,
            description,
            idempotencyKey,
          },
        })
      },
      { isolationLevel: 'Serializable' },
    )
  }

  // Finalises the charge after successful scoring — balance already deducted on reserve.
  async consume(reservationLedgerEntryId: string, idempotencyKey: string) {
    const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
    if (existing) return existing

    const reservation = await this.prisma.ledgerEntry.findUniqueOrThrow({
      where: { id: reservationLedgerEntryId },
    })

    return this.prisma.ledgerEntry.create({
      data: {
        walletId: reservation.walletId,
        type: 'consume',
        amount: 0,
        balanceAfter: reservation.balanceAfter,
        description: `Consumed reservation ${reservationLedgerEntryId}`,
        referenceId: reservationLedgerEntryId,
        idempotencyKey,
      },
    })
  }

  // Restores balance when scoring fails permanently after all retries.
  async refund(reservationLedgerEntryId: string, idempotencyKey: string) {
    const existing = await this.prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
    if (existing) return existing

    return this.prisma.$transaction(
      async (tx) => {
        const reservation = await tx.ledgerEntry.findUniqueOrThrow({
          where: { id: reservationLedgerEntryId },
        })
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: reservation.walletId } })

        const refundAmount = Math.abs(reservation.amount)
        const newBalance = wallet.balance + refundAmount
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } })

        return tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'refund',
            amount: refundAmount,
            balanceAfter: newBalance,
            description: `Refund for reservation ${reservationLedgerEntryId}`,
            referenceId: reservationLedgerEntryId,
            idempotencyKey,
          },
        })
      },
      { isolationLevel: 'Serializable' },
    )
  }
}
