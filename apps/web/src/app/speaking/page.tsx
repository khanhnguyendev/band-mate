import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

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

  const res = await fetch(`${process.env.API_URL}/v1/questions/speaking`, { cache: 'no-store' })
  const sets = res.ok ? await res.json() : []

  type QSet = { id: string; questions: { id: string; prompt: string }[]; taskType: string; difficulty: string; estimatedMinutes: number; title: string }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>

      <h1 style={{ marginTop: '1.5rem' }}>Speaking Practice</h1>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Choose a speaking task. Record your response or upload an audio file. AI will score your transcript.
      </p>

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {sets.map((s: QSet) => {
          const question = s.questions[0]
          if (!question) return null
          return (
            <div key={s.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600 }}>
                      {PART_LABEL[s.taskType] ?? s.taskType}
                    </span>
                    <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>
                      {s.difficulty}
                    </span>
                  </div>
                  <strong>{s.title}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    {PART_DESC[s.taskType] ?? `${s.estimatedMinutes} min`}
                  </p>
                </div>
                <Link
                  href={`/speaking/${question.id}`}
                  style={{ padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Start →
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
