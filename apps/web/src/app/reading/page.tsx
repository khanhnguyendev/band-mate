import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function ReadingPage() {
  if (process.env.NEXT_PUBLIC_FEATURE_READING !== 'true') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const res = await fetch(`${process.env.API_URL}/v1/reading/sets`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })
  const sets = res.ok ? await res.json() : []

  type QSet = { id: string; title: string; difficulty: string; estimatedMinutes: number; questions: { id: string }[] }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>

      <h1 style={{ marginTop: '1.5rem' }}>Reading Practice</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Read the passage and answer all questions. Scoring is instant — no credits required.
      </p>

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {sets.map((s: QSet) => (
          <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600 }}>
                    Academic
                  </span>
                  <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
                    {s.difficulty}
                  </span>
                  <span style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
                    +1 bonus credit
                  </span>
                </div>
                <strong>{s.title}</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                  {s.questions.length} questions · {s.estimatedMinutes} min · Free
                </p>
              </div>
              <Link
                href={`/reading/${s.id}`}
                style={{ padding: '0.6rem 1.2rem', background: '#16a34a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Start →
              </Link>
            </div>
          </div>
        ))}
        {sets.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No reading sets available yet.</p>
        )}
      </div>
    </main>
  )
}
