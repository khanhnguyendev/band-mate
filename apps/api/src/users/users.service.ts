import { Injectable } from '@nestjs/common'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Called on every authenticated request; creates user + wallet on first login.
  async findOrCreate(supabaseUser: SupabaseUser) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      include: { wallet: true },
    })

    if (existing) return existing

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.['name'] ?? supabaseUser.email!.split('@')[0],
          role: 'learner',
        },
      })

      await tx.wallet.create({
        data: { userId: user.id, balance: 0, bonusBalance: 0 },
      })

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { wallet: true },
      })
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { wallet: true },
    })
  }
}
