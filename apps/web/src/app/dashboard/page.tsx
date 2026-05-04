import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const SKILL_LABEL: Record<string, string> = {
  writing: 'Writing', speaking: 'Speaking', reading: 'Reading', listening: 'Listening',
}

const SKILL_HREF: Record<string, string> = {
  writing: '/writing', speaking: '/speaking', reading: '/reading', listening: '/listening',
}

const BAND_COLOR = (band: number) => {
  if (band >= 7) return '#16a34a'
  if (band >= 6) return '#ca8a04'
  return '#dc2626'
}

interface Stats {
  creditBalance: number
  bonusBalance: number
  streak: number
  submissionCounts: Record<string, number>
  recentReports: { reportId: string; skill: string; band: number; createdAt: string }[]
  weakestSkill: string | null
  nextAction: string | null
}

interface Props {
  searchParams: Promise<{ welcome?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const apiUrl = process.env.API_URL ?? ''

  const [meRes, statsRes] = await Promise.all([
    fetch(`${apiUrl}/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/v1/users/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  if (!meRes.ok) redirect('/login')
  const { user: profile } = await meRes.json()
  if (!profile.onboardingCompletedAt) redirect('/onboarding')

  const stats: Stats = statsRes.ok ? await statsRes.json() : {
    creditBalance: 0, bonusBalance: 0, streak: 0,
    submissionCounts: {}, recentReports: [], weakestSkill: null, nextAction: null,
  }

  const params = await searchParams
  const isWelcome = params.welcome === '1'
  const totalSubmissions = Object.values(stats.submissionCounts).reduce((a, b) => a + b, 0)

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Link href="/reports" style={{ color: '#6366f1', fontSize: '0.9rem' }}>My Reports →</Link>
      </div>
      <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Welcome back, {profile.name}</p>

      {/* Welcome banner — shown once after onboarding */}
      {isWelcome && (
        <div style={{ background: '#ede9fe', border: '1px solid #a78bfa', borderRadius: 12, padding: '1.25rem 1.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>🎉 You earned {stats.creditBalance} trial credits!</h2>
          <p style={{ margin: '0.5rem 0 0' }}>Your study plan is set. Target band: <strong>{profile.targetBand}</strong></p>
        </div>
      )}

      {/* Above the fold — weakest skill + next action */}
      {stats.weakestSkill && stats.nextAction && (
        <div style={{ marginTop: '1.5rem', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Focus area · {SKILL_LABEL[stats.weakestSkill]}
          </p>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600, fontSize: '1.05rem' }}>{stats.nextAction}</p>
          <Link
            href={SKILL_HREF[stats.weakestSkill] ?? '/writing'}
            style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.5rem 1.1rem', background: '#d97706', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
          >
            Start now →
          </Link>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Day streak', value: stats.streak === 0 ? '—' : `${stats.streak}d`, emoji: '🔥' },
          { label: 'Credits', value: String(stats.creditBalance + stats.bonusBalance), emoji: '💳' },
          { label: 'Sessions', value: totalSubmissions === 0 ? '—' : String(totalSubmissions), emoji: '📝' },
        ].map(({ label, value, emoji }) => (
          <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.5rem' }}>{emoji}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.4rem', fontWeight: 700 }}>{value}</p>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Skill activity */}
      <h2 style={{ marginTop: '2rem' }}>Practice by skill</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {(['writing', 'speaking', 'reading', 'listening'] as const).map((skill) => (
          <Link
            key={skill}
            href={SKILL_HREF[skill]}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit' }}
          >
            <div>
              <strong style={{ fontSize: '0.95rem' }}>{SKILL_LABEL[skill]}</strong>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                {stats.submissionCounts[skill] ?? 0} session{stats.submissionCounts[skill] !== 1 ? 's' : ''}
              </p>
            </div>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>→</span>
          </Link>
        ))}
      </div>

      {/* Recent reports */}
      {stats.recentReports.length > 0 && (
        <>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Recent reports</h2>
            <Link href="/reports" style={{ color: '#6366f1', fontSize: '0.85rem' }}>View all →</Link>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {stats.recentReports.map((r) => (
              <Link
                key={r.reportId}
                href={`/reports/${r.reportId}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: BAND_COLOR(r.band), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {r.band}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{SKILL_LABEL[r.skill] ?? r.skill}</strong>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 600 }}>View →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
