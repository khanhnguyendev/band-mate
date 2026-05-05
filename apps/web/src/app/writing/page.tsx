import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

interface QuestionSet {
  id: string
  title: string
  taskType: string
  difficulty: string
  estimatedMinutes: number
  questions: { id: string; prompt: string }[]
}

interface WalletInfo {
  balance: number
  bonusBalance: number
  plan: { writingCreditCost: number; name: string } | null
}

const DIFFICULTY_LABEL: Record<string, string> = {
  band5: 'Band 5',
  band6: 'Band 6',
  band7: 'Band 7',
  band8: 'Band 8+',
}

const TASK_LABEL: Record<string, string> = {
  task1: 'Task 1 — Data Description',
  task2: 'Task 2 — Essay',
}

export default async function WritingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const apiUrl = process.env.API_URL ?? ''

  const [setsRes, walletRes] = await Promise.all([
    fetch(`${apiUrl}/v1/questions/writing`, { cache: 'no-store' }),
    fetch(`${apiUrl}/v1/users/me/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  const sets: QuestionSet[] = setsRes.ok ? await setsRes.json() : []
  const wallet: WalletInfo | null = walletRes.ok ? await walletRes.json() : null

  const creditCost = wallet?.plan?.writingCreditCost ?? 2
  const totalBalance = (wallet?.balance ?? 0) + (wallet?.bonusBalance ?? 0)
  const canAfford = totalBalance >= creditCost

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Writing Practice</h1>
        <Link href="/wallet" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          💳 {totalBalance} credit{totalBalance !== 1 ? 's' : ''}
        </Link>
      </div>
      <p style={{ color: '#666', marginTop: '0.25rem' }}>
        Select a task to practise. Each submission costs {creditCost} credit{creditCost !== 1 ? 's' : ''}.
      </p>

      {!canAfford && (
        <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#b91c1c' }}>
          Insufficient credits.{' '}
          <Link href="/wallet" style={{ color: '#b91c1c', fontWeight: 600 }}>Top up →</Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {sets.map((set) => (
          <Link
            key={set.id}
            href={canAfford ? `/writing/${set.questions[0]?.id}` : '/wallet'}
            style={{ textDecoration: 'none', color: 'inherit', opacity: canAfford ? 1 : 0.6 }}
          >
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: '#ede9fe',
                    color: '#6d28d9',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                  }}>
                    {TASK_LABEL[set.taskType] ?? set.taskType}
                  </span>
                  <h3 style={{ margin: '0.5rem 0 0.25rem' }}>{set.title}</h3>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>
                    {set.questions[0]?.prompt.slice(0, 120)}…
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{DIFFICULTY_LABEL[set.difficulty]}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    ~{set.estimatedMinutes} min
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '0.25rem', fontWeight: 600 }}>
                    {creditCost} credit{creditCost !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {sets.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No writing tasks available yet.</p>
        )}
      </div>
    </main>
  )
}
