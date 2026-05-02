import Link from 'next/link'

interface QuestionSet {
  id: string
  title: string
  taskType: string
  difficulty: string
  estimatedMinutes: number
  questions: { id: string; prompt: string }[]
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
  const res = await fetch(`${process.env.API_URL}/v1/questions/writing`, {
    cache: 'no-store',
  })

  const sets: QuestionSet[] = res.ok ? await res.json() : []

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', fontSize: '0.9rem' }}>← Dashboard</Link>
      <h1 style={{ marginTop: '0.5rem' }}>Writing Practice</h1>
      <p style={{ color: '#666' }}>Select a task to practise. Each submission costs 2 credits.</p>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
        {sets.map((set) => (
          <Link
            key={set.id}
            href={`/writing/${set.questions[0]?.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
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
                  <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '0.25rem' }}>2 credits</div>
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
