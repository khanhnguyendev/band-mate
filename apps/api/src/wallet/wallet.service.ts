import { ConflictException, Injectable } from '@nestjs/common'
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
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        })

        return tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'grant',
            amount,
            balanceAfter: newBalance,
            description,
            idempotencyKey,
          },
        })
      },
      { isolationLevel: 'Serializable' },
    )
  }
}
