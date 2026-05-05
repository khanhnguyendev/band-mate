import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

interface JobCounts {
  waiting: number
  active: number
  failed: number
  completed: number
}

interface FailedJob {
  id: string
  name: string
  failedReason: string
  attemptsMade: number
}

interface QueueSummary {
  queue: string
  counts: JobCounts
  failedJobs: FailedJob[]
}

interface Quest {
  id: string
  title: string
  description: string
  skill: string | null
  action: string
  requiredCount: number
  rewardCredits: number
  period: string
  isActive: boolean
}

interface PromptPack {
  id: string
  skill: string
  version: string
  isActive: boolean
  createdAt: string
}

async function fetchAdmin<T>(path: string, token: string): Promise<T | null> {
  const apiUrl = process.env.API_URL ?? ''
  try {
    const res = await fetch(`${apiUrl}/v1/admin/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const token = session.access_token

  const [jobs, quests, promptPacks] = await Promise.all([
    fetchAdmin<QueueSummary[]>('jobs', token),
    fetchAdmin<Quest[]>('quests', token),
    fetchAdmin<PromptPack[]>('prompt-packs', token),
  ])

  const totalFailed = jobs?.reduce((sum, q) => sum + q.counts.failed, 0) ?? 0

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Admin Console</h1>

      {/* Queue summary */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Job Queues {totalFailed > 0 && <span style={{ color: '#dc2626' }}>({totalFailed} failed)</span>}
        </h2>
        {jobs ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {jobs.map((q) => (
              <div
                key={q.queue}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '1rem',
                  background: q.counts.failed > 0 ? '#fef2f2' : '#f9fafb',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{q.queue}</div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>Waiting: {q.counts.waiting}</span>
                  <span>Active: {q.counts.active}</span>
                  <span style={{ color: q.counts.failed > 0 ? '#dc2626' : undefined }}>
                    Failed: {q.counts.failed}
                  </span>
                  <span>Completed: {q.counts.completed}</span>
                </div>
                {q.failedJobs.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {q.failedJobs.map((job) => (
                      <div
                        key={job.id}
                        style={{
                          fontSize: '0.8rem',
                          background: '#fff',
                          border: '1px solid #fca5a5',
                          borderRadius: 4,
                          padding: '0.5rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div style={{ fontFamily: 'monospace', color: '#9ca3af' }}>
                          {job.id} — attempt {job.attemptsMade}
                        </div>
                        <div style={{ color: '#dc2626', marginTop: 2 }}>{job.failedReason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>Unable to load queue data (admin access required)</p>
        )}
      </section>

      {/* Quest definitions */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Quest Definitions</h2>
        {quests ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Title</th>
                <th style={{ padding: '0.5rem' }}>Skill</th>
                <th style={{ padding: '0.5rem' }}>Required</th>
                <th style={{ padding: '0.5rem' }}>Reward</th>
                <th style={{ padding: '0.5rem' }}>Period</th>
                <th style={{ padding: '0.5rem' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {quests.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.5rem' }}>{q.title}</td>
                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{q.skill ?? 'any'}</td>
                  <td style={{ padding: '0.5rem' }}>{q.requiredCount}</td>
                  <td style={{ padding: '0.5rem' }}>{q.rewardCredits} cr</td>
                  <td style={{ padding: '0.5rem' }}>{q.period}</td>
                  <td style={{ padding: '0.5rem' }}>{q.isActive ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280' }}>No quest data</p>
        )}
      </section>

      {/* Prompt packs */}
      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Prompt Packs</h2>
        {promptPacks ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Skill</th>
                <th style={{ padding: '0.5rem' }}>Version</th>
                <th style={{ padding: '0.5rem' }}>Active</th>
                <th style={{ padding: '0.5rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {promptPacks.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid #f3f4f6', background: p.isActive ? '#f0fdf4' : undefined }}
                >
                  <td style={{ padding: '0.5rem' }}>{p.skill}</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.version}</td>
                  <td style={{ padding: '0.5rem' }}>{p.isActive ? '✅ active' : '—'}</td>
                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280' }}>No prompt pack data</p>
        )}
      </section>
    </main>
  )
}
