import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

const SKILL_LABEL: Record<string, string> = {
  writing: 'Writing',
  speaking: 'Speaking',
  reading: 'Reading',
  listening: 'Listening',
}

const BAND_COLOR = (band: number) => {
  if (band >= 7) return '#16a34a'
  if (band >= 6) return '#ca8a04'
  return '#dc2626'
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = (await supabase.auth.getSession()).data.session
  const res = await fetch(`${process.env.API_URL}/v1/reports`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })
  const reports = res.ok ? await res.json() : []

  type ReportSummary = { id: string; skill: string; overallBand: string; createdAt: string }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>

      <h1 style={{ marginTop: '1.5rem' }}>My Reports</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>All past scoring reports across skills.</p>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {reports.map((r: ReportSummary) => (
          <Link
            key={r.id}
            href={`/reports/${r.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: BAND_COLOR(Number(r.overallBand)),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}>
                {Number(r.overallBand).toFixed(1)}
              </div>
              <div>
                <strong>{SKILL_LABEL[r.skill] ?? r.skill}</strong>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.9rem' }}>View →</span>
          </Link>
        ))}
        {reports.length === 0 && (
          <p style={{ color: '#9ca3af' }}>No reports yet. Submit a writing or speaking practice to generate your first report.</p>
        )}
      </div>
    </main>
  )
}
