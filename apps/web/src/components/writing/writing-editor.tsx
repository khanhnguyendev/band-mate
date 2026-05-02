'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Props {
  questionId: string
  prompt: string
  taskType: string
  estimatedMinutes: number
  accessToken: string
  apiUrl: string
}

const MIN_WORDS = 150
const DRAFT_KEY = (id: string) => `writing-draft:${id}`

export function WritingEditor({ questionId, prompt, taskType, estimatedMinutes, accessToken, apiUrl }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(estimatedMinutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY(questionId))
    if (saved) setText(saved)
  }, [questionId])

  // Autosave draft
  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(DRAFT_KEY(questionId), text), 800)
    return () => clearTimeout(id)
  }, [text, questionId])

  // Countdown timer
  useEffect(() => {
    if (polling) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [polling])

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timerColor = secondsLeft < 300 ? '#ef4444' : '#374151'

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${apiUrl}/v1/submissions/writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ questionId, text }),
      })

      if (res.status === 402) { setError('Insufficient credits.'); setSubmitting(false); return }
      if (!res.ok) { setError('Submission failed. Please try again.'); setSubmitting(false); return }

      const { submissionId } = await res.json()
      localStorage.removeItem(DRAFT_KEY(questionId))
      setPolling(true)

      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`${apiUrl}/v1/submissions/${submissionId}/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!statusRes.ok) return
        const { status, reportId } = await statusRes.json()

        if (status === 'completed' && reportId) {
          clearInterval(pollRef.current!)
          router.push(`/reports/${reportId}`)
        } else if (status === 'failed') {
          clearInterval(pollRef.current!)
          setError('Scoring failed. Your credits have been refunded.')
          setPolling(false)
          setSubmitting(false)
        }
      }, 3000)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.85rem', background: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.6rem', borderRadius: 4, fontWeight: 600 }}>
          {taskType === 'task1' ? 'Task 1' : 'Task 2'}
        </span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
          ⏱ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      {/* Prompt */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, lineHeight: 1.7 }}>{prompt}</p>
      </div>

      {/* Editor */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitting || polling}
        placeholder={`Write your ${taskType === 'task1' ? 'data description' : 'essay'} here…`}
        style={{
          width: '100%',
          minHeight: 320,
          padding: '1rem',
          fontSize: '1rem',
          lineHeight: 1.7,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', color: wordCount < MIN_WORDS ? '#ef4444' : '#6b7280' }}>
          {wordCount} words {wordCount < MIN_WORDS && `(minimum ${MIN_WORDS})`}
        </span>
        <button
          onClick={submit}
          disabled={submitting || polling || wordCount < MIN_WORDS}
          style={{
            padding: '0.75rem 1.75rem',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            opacity: submitting || polling || wordCount < MIN_WORDS ? 0.5 : 1,
          }}
        >
          {polling ? 'Scoring… ✨' : submitting ? 'Submitting…' : 'Submit for AI Scoring — 2 credits'}
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginTop: '0.75rem' }}>{error}</p>}

      {polling && (
        <p style={{ color: '#6366f1', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          🤖 AI is scoring your response. This takes about 15–30 seconds…
        </p>
      )}
    </div>
  )
}
