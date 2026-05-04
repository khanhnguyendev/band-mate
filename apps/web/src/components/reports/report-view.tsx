'use client'

import { useState } from 'react'

interface Criterion {
  name: string
  band: number
  explanation?: string
  strengths?: string[]
  weaknesses?: string[]
}

interface ImprovementTask {
  taskId: string
  description: string
  criterion?: string | null
}

interface CompareResult {
  skill: string
  current: { band: number; createdAt: string; criteria: { name: string; band: number }[] }
  previous: { band: number; createdAt: string; criteria: { name: string; band: number }[] } | null
}

interface Props {
  reportId: string
  skill: string
  overallBand: number
  disclaimer: string
  criteria: Criterion[]
  improvementTasks: ImprovementTask[]
  compare: CompareResult
  accessToken: string
  apiUrl: string
}

const SKILL_LABEL: Record<string, string> = {
  writing: 'Writing', speaking: 'Speaking', reading: 'Reading', listening: 'Listening',
}

const BAND_COLOR = (band: number) => {
  if (band >= 7) return '#16a34a'
  if (band >= 6) return '#ca8a04'
  return '#dc2626'
}

export function ReportView({ reportId, skill, overallBand, disclaimer, criteria, improvementTasks, compare, accessToken, apiUrl }: Props) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [accepting, setAccepting] = useState<string | null>(null)

  const handleAccept = async (taskId: string) => {
    setAccepting(taskId)
    try {
      await fetch(`${apiUrl}/v1/reports/${reportId}/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setAccepted((prev) => new Set([...prev, taskId]))
    } finally {
      setAccepting(null)
    }
  }

  const bandDelta = compare.previous ? overallBand - compare.previous.band : null

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <a href="/reports" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← My Reports</a>

      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: BAND_COLOR(overallBand),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '1.75rem', fontWeight: 700, flexShrink: 0,
        }}>
          {overallBand}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{SKILL_LABEL[skill] ?? skill} Score Report</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#f59e0b', fontSize: '0.85rem' }}>⚠️ {disclaimer}</p>
        </div>
      </div>

      {/* Compare with previous */}
      {compare.previous && (
        <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <strong style={{ fontSize: '0.9rem', color: '#374151' }}>Progress vs previous attempt</strong>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Previous</p>
              <p style={{ margin: 0, fontWeight: 700, color: BAND_COLOR(compare.previous.band) }}>Band {compare.previous.band}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Now</p>
              <p style={{ margin: 0, fontWeight: 700, color: BAND_COLOR(overallBand) }}>Band {overallBand}</p>
            </div>
            {bandDelta !== null && (
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Change</p>
                <p style={{ margin: 0, fontWeight: 700, color: bandDelta > 0 ? '#16a34a' : bandDelta < 0 ? '#dc2626' : '#6b7280' }}>
                  {bandDelta > 0 ? `+${bandDelta.toFixed(1)}` : bandDelta.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Criterion breakdown */}
      <h2 style={{ marginTop: '2rem' }}>Criterion Breakdown</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {criteria.map((c) => (
          <div key={c.name} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.name}</strong>
              <span style={{ fontWeight: 700, color: BAND_COLOR(c.band), fontSize: '1.1rem' }}>Band {c.band}</span>
            </div>
            {c.explanation && <p style={{ margin: '0.5rem 0', color: '#374151', lineHeight: 1.6 }}>{c.explanation}</p>}
            {c.strengths && c.strengths.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#16a34a' }}>✓ Strengths</strong>
                <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                  {c.strengths.map((s, i) => <li key={i} style={{ fontSize: '0.9rem', color: '#374151' }}>{s}</li>)}
                </ul>
              </div>
            )}
            {c.weaknesses && c.weaknesses.length > 0 && (
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
      {improvementTasks.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Recommendations</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 0 }}>
            Add recommendations to your personal improvement list to track progress.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {improvementTasks.map((t) => {
              const isAccepted = accepted.has(t.taskId)
              return (
                <div key={t.taskId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem 1rem', background: isAccepted ? '#f0fdf4' : '#fff' }}>
                  <div>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{t.description}</p>
                    {t.criterion && <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>{t.criterion}</p>}
                  </div>
                  <button
                    onClick={() => !isAccepted && handleAccept(t.taskId)}
                    disabled={isAccepted || accepting === t.taskId}
                    style={{
                      padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: isAccepted ? 'default' : 'pointer', flexShrink: 0,
                      background: isAccepted ? '#bbf7d0' : '#4f46e5', color: isAccepted ? '#15803d' : '#fff',
                    }}
                  >
                    {isAccepted ? '✓ Added' : accepting === t.taskId ? '…' : 'Add to my tasks'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <a href={`/${skill}`} style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Practice Again
        </a>
        <a href="/reports" style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          All Reports
        </a>
      </div>
    </main>
  )
}
