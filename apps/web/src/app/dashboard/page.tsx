import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const SKILL_LABELS: Record<string, string> = {
  writing: 'Try a Writing Task 2 practice',
  speaking: 'Try a Speaking Part 1 practice',
  reading: 'Try a Reading passage',
  listening: 'Try a Listening Section 1 exercise',
}

interface Props {
  searchParams: Promise<{ welcome?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const res = await fetch(`${process.env.API_URL}/v1/users/me`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })

  if (!res.ok) redirect('/login')

  const { user: profile, wallet } = await res.json()

  // Gate: redirect to onboarding if not completed
  if (!profile.onboardingCompletedAt) redirect('/onboarding')

  const params = await searchParams
  const isWelcome = params.welcome === '1'
  const firstWeakSkill = profile.weakSkills?.[0]

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#666' }}>Welcome back, {profile.name}</p>

      {/* Welcome banner shown once after onboarding */}
      {isWelcome && (
        <div style={{
          background: '#ede9fe',
          border: '1px solid #a78bfa',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginTop: '1.5rem',
        }}>
          <h2 style={{ margin: 0 }}>🎉 You earned {wallet.balance} trial credits!</h2>
          <p style={{ margin: '0.5rem 0 0' }}>
            Your study plan is set. Target band: <strong>{profile.targetBand}</strong>
          </p>
          {firstWeakSkill && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 8 }}>
              <strong>Start here →</strong> {SKILL_LABELS[firstWeakSkill] ?? 'Explore practice exercises'}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <p>Credits: <strong>{wallet.balance}</strong> standard + <strong>{wallet.bonusBalance}</strong> bonus</p>
      </div>
    </main>
  )
}
