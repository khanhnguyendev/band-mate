import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

interface LedgerEntry {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
}

interface WalletData {
  balance: number
  bonusBalance: number
  bonusExpiresAt: string | null
  plan: {
    name: string
    monthlyCredits: number
    writingCreditCost: number
    speakingCreditCost: number
  } | null
  ledger: LedgerEntry[]
}

const TYPE_LABEL: Record<string, string> = {
  grant: 'Credited',
  reserve: 'Reserved',
  consume: 'Charged',
  refund: 'Refunded',
  bonus: 'Bonus',
}

const TYPE_COLOR: Record<string, string> = {
  grant: '#16a34a',
  refund: '#16a34a',
  bonus: '#16a34a',
  reserve: '#dc2626',
  consume: '#dc2626',
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const apiUrl = process.env.API_URL ?? ''

  const res = await fetch(`${apiUrl}/v1/users/me/wallet`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) redirect('/dashboard')
  const wallet: WalletData = await res.json()

  const totalBalance = wallet.balance + wallet.bonusBalance

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>
      <h1 style={{ marginTop: '0.5rem' }}>My Wallet</h1>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{wallet.balance}</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Practice credits</p>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', textAlign: 'center', background: wallet.bonusBalance > 0 ? '#f0fdf4' : '#fff' }}>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: wallet.bonusBalance > 0 ? '#16a34a' : '#9ca3af' }}>{wallet.bonusBalance}</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Bonus credits</p>
          {wallet.bonusExpiresAt && (
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#ca8a04' }}>
              Expires {new Date(wallet.bonusExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Plan info */}
      {wallet.plan && (
        <div style={{ marginTop: '1.5rem', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', textTransform: 'capitalize' }}>
            {wallet.plan.name} Plan
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            <div>
              <strong>{wallet.plan.monthlyCredits}</strong>
              <p style={{ margin: '0.1rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>monthly credits</p>
            </div>
            <div>
              <strong>{wallet.plan.writingCreditCost}</strong>
              <p style={{ margin: '0.1rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>per writing</p>
            </div>
            <div>
              <strong>{wallet.plan.speakingCreditCost}</strong>
              <p style={{ margin: '0.1rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>per speaking</p>
            </div>
          </div>
        </div>
      )}

      {/* Total + top-up placeholder */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: 10 }}>
        <span style={{ color: '#374151', fontWeight: 600 }}>Total: {totalBalance} credit{totalBalance !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Top-ups coming soon</span>
      </div>

      {/* Ledger */}
      {wallet.ledger.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem', marginBottom: '0.75rem', fontSize: '1rem' }}>Recent transactions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {wallet.ledger.map((entry) => (
              <div
                key={entry.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: '0.85rem' }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{TYPE_LABEL[entry.type] ?? entry.type}</span>
                  <p style={{ margin: '0.1rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>{entry.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: TYPE_COLOR[entry.type] ?? '#374151' }}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </span>
                  <p style={{ margin: '0.1rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>
                    {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
