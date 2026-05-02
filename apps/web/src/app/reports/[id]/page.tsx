import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

const BAND_COLOR = (band: number) => {
  if (band >= 7) return '#16a34a'
  if (band >= 6) return '#ca8a04'
  return '#dc2626'
}

export default async function ReportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const session = (await supabase.auth.getSession()).data.session

  const res = await fetch(`${process.env.API_URL}/v1/reports/${id}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })

  if (!res.ok) redirect('/dashboard')

  const report = await res.json()

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link href="/writing" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Writing Practice</Link>

      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: BAND_COLOR(report.overallBand),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.75rem', fontWeight: 700, flexShrink: 0,
        }}>
          {report.overallBand}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Writing Score Report</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#f59e0b', fontSize: '0.85rem' }}>
            ⚠️ {report.disclaimer}
          </p>
        </div>
      </div>

      {/* Criterion breakdown */}
      <h2 style={{ marginTop: '2rem' }}>Criterion Breakdown</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {report.criteria.map((c: { name: string; band: number; explanation: string; strengths: string[]; weaknesses: string[] }) => (
          <div key={c.name} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.name}</strong>
              <span style={{ fontWeight: 700, color: BAND_COLOR(c.band), fontSize: '1.1rem' }}>
                Band {c.band}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0', color: '#374151', lineHeight: 1.6 }}>{c.explanation}</p>
            {c.strengths.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#16a34a' }}>✓ Strengths</strong>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {c.strengths.map((s, i) => <li key={i} style={{ fontSize: '0.9rem', color: '#374151' }}>{s}</li>)}
                </ul>
              </div>
            )}
            {c.weaknesses.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#dc2626' }}>✗ Areas to improve</strong>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {c.weaknesses.map((w, i) => <li key={i} style={{ fontSize: '0.9rem', color: '#374151' }}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Improvement tasks */}
      {report.improvementTasks.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Next Steps</h2>
          <ol style={{ paddingLeft: '1.25rem' }}>
            {report.improvementTasks.map((t: { taskId: string; description: string; criterion?: string }) => (
              <li key={t.taskId} style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
                {t.description}
                {t.criterion && <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.5rem' }}>({t.criterion})</span>}
              </li>
            ))}
          </ol>
        </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link href="/writing" style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Practice Again
        </Link>
      </div>
    </main>
  )
}
