'use client'

import { useState } from 'react'

interface Question {
  id: string
  prompt: string
  order: number
}

interface BreakdownItem {
  questionId: string
  correct: boolean
  userAnswer: string
  correctAnswer: string
}

interface ScoreResult {
  score: number
  total: number
  percentage: number
  breakdown: BreakdownItem[]
}

interface Props {
  setId: string
  title: string
  audioUrl: string
  questions: Question[]
  accessToken: string
  apiUrl: string
}

export function ListeningQuiz({ setId, title, audioUrl, questions, accessToken, apiUrl }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${apiUrl}/v1/listening/sets/${setId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <a href="/listening" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← Listening Practice</a>

      <h1 style={{ marginTop: '1.5rem' }}>{title}</h1>

      {/* Audio player */}
      <div style={{ marginTop: '1rem', background: '#f0f9ff', borderRadius: 10, padding: '1.25rem', border: '1px solid #bae6fd' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#0369a1', fontWeight: 500 }}>
          🎧 Listen carefully before answering. You may replay the audio.
        </p>
        <audio controls src={audioUrl} style={{ width: '100%' }}>
          Your browser does not support audio playback.
        </audio>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Questions</h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 0 }}>
        Type your answers based on what you heard.
      </p>

      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500 }}>{i + 1}. {q.prompt}</p>
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Your answer…"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', background: submitting ? '#9ca3af' : '#0369a1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem', alignSelf: 'flex-start' }}
          >
            {submitting ? 'Submitting…' : 'Submit Answers'}
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem',
            background: result.percentage >= 80 ? '#f0fdf4' : result.percentage >= 60 ? '#fefce8' : '#fef2f2',
            border: `1px solid ${result.percentage >= 80 ? '#bbf7d0' : result.percentage >= 60 ? '#fde68a' : '#fecaca'}`,
          }}>
            <h2 style={{ margin: 0, color: result.percentage >= 80 ? '#16a34a' : result.percentage >= 60 ? '#ca8a04' : '#dc2626' }}>
              {result.score}/{result.total} correct ({result.percentage}%)
            </h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
              🎉 +1 bonus credit awarded for completing this set!
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.breakdown.map((b, i) => (
              <div key={b.questionId} style={{ padding: '0.75rem 1rem', borderRadius: 8, background: b.correct ? '#f0fdf4' : '#fef2f2', border: `1px solid ${b.correct ? '#bbf7d0' : '#fecaca'}` }}>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {b.correct ? '✓' : '✗'} Q{i + 1}: {questions[i]?.prompt}
                </p>
                {!b.correct && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    Your answer: <strong>{b.userAnswer || '(not answered)'}</strong> · Correct: <strong>{b.correctAnswer}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <a href="/listening" style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Try Another Set
            </a>
            <a href="/dashboard" style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
              Dashboard
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
