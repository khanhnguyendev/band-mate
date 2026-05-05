import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

interface WalletInfo {
  balance: number
  bonusBalance: number
  plan: { speakingCreditCost: number; name: string } | null
}

const PART_LABEL: Record<string, string> = {
  part1: 'Part 1',
  part2: 'Part 2',
  part3: 'Part 3',
}

const PART_DESC: Record<string, string> = {
  part1: 'Familiar topics — 4–5 min',
  part2: 'Long turn / cue card — 3–4 min',
  part3: 'Discussion — 4–5 min',
}

export default async function SpeakingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const apiUrl = process.env.API_URL ?? ''

  const [setsRes, walletRes] = await Promise.all([
    fetch(`${apiUrl}/v1/questions/speaking`, { cache: 'no-store' }),
    fetch(`${apiUrl}/v1/users/me/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  const sets = setsRes.ok ? await setsRes.json() : []
  const wallet: WalletInfo | null = walletRes.ok ? await walletRes.json() : null

  const creditCost = wallet?.plan?.speakingCreditCost ?? 2
  const totalBalance = (wallet?.balance ?? 0) + (wallet?.bonusBalance ?? 0)
  const canAfford = totalBalance >= creditCost

  type QSet = { id: string; questions: { id: string; prompt: string }[]; taskType: string; difficulty: string; estimatedMinutes: number; title: string }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Speaking Practice</h1>
        <Link href="/wallet" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          💳 {totalBalance} credit{totalBalance !== 1 ? 's' : ''}
        </Link>
      </div>
      <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
        Choose a speaking task. Record your response or upload an audio file. AI will score your transcript.
        Each submission costs {creditCost} credit{creditCost !== 1 ? 's' : ''}.
      </p>

      {!canAfford && (
        <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#b91c1c' }}>
          Insufficient credits.{' '}
          <Link href="/wallet" style={{ color: '#b91c1c', fontWeight: 600 }}>Top up →</Link>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {sets.map((s: QSet) => {
          const question = s.questions[0]
          if (!question) return null
          return (
            <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem', opacity: canAfford ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600 }}>
                      {PART_LABEL[s.taskType] ?? s.taskType}
                    </span>
                    <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
                      {s.difficulty}
                    </span>
                    <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600 }}>
                      {creditCost} credit{creditCost !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <strong>{s.title}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    {PART_DESC[s.taskType] ?? `${s.estimatedMinutes} min`}
                  </p>
                </div>
                <Link
                  href={canAfford ? `/speaking/${question.id}` : '/wallet'}
                  style={{ padding: '0.6rem 1.2rem', background: canAfford ? '#4f46e5' : '#9ca3af', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {canAfford ? 'Start →' : 'Top up →'}
                </Link>
              </div>
            </div>
          )
        })}
        {sets.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No speaking tasks available yet.</p>
        )}
      </div>
    </main>
  )
}
