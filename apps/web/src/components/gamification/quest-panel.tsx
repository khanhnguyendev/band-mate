'use client'

interface Quest {
  questId: string
  title: string
  description: string
  period: string
  progress: number
  required: number
  rewardCredits: number
  completed: boolean
  claimed: boolean
}

interface Props {
  quests: Quest[]
}

export function QuestPanel({ quests }: Props) {
  const daily = quests.filter((q) => q.period === 'daily')
  const weekly = quests.filter((q) => q.period === 'weekly')

  if (quests.length === 0) return null

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ margin: '0 0 0.75rem' }}>Daily Quests</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {daily.map((q) => <QuestCard key={q.questId} quest={q} />)}
      </div>

      {weekly.length > 0 && (
        <>
          <h2 style={{ margin: '1.5rem 0 0.75rem' }}>Weekly Challenge</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {weekly.map((q) => <QuestCard key={q.questId} quest={q} />)}
          </div>
        </>
      )}
    </div>
  )
}

function QuestCard({ quest }: { quest: Quest }) {
  const pct = Math.min(Math.round((quest.progress / quest.required) * 100), 100)
  const statusColor = quest.claimed ? '#16a34a' : quest.completed ? '#ca8a04' : '#6b7280'

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '0.85rem 1rem',
      background: quest.claimed ? '#f0fdf4' : quest.completed ? '#fefce8' : '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <strong style={{ fontSize: '0.9rem' }}>{quest.title}</strong>
            <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: '#f3f4f6', borderRadius: 999, color: '#6b7280' }}>
              +{quest.rewardCredits} credit{quest.rewardCredits !== 1 ? 's' : ''}
            </span>
            {quest.claimed && <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Done</span>}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{quest.description}</p>

          <div style={{ marginTop: '0.5rem', background: '#f3f4f6', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: statusColor, flexShrink: 0 }}>
          {quest.progress}/{quest.required}
        </span>
      </div>
    </div>
  )
}
