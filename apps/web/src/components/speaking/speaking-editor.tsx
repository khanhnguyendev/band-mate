'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  questionId: string
  prompt: string
  taskType: string
  estimatedMinutes: number
  accessToken: string
  apiUrl: string
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'submitted' | 'polling' | 'failed'

const PART_TIPS: Record<string, string> = {
  part1: 'Answer naturally. Aim for 1–2 sentences per question.',
  part2: 'Use your preparation time. Cover all bullet points. Speak for ~2 minutes.',
  part3: 'Give extended answers with reasons and examples.',
}

export function SpeakingEditor({ questionId, prompt, taskType, estimatedMinutes, accessToken, apiUrl }: Props) {
  const router = useRouter()
  const [state, setState] = useState<RecordingState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setState('recorded')
        if (timerRef.current) clearInterval(timerRef.current)
      }

      mr.start()
      setState('recording')
      setElapsedSec(0)
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    } catch {
      setStatusMsg('Microphone access denied. Please upload an audio file instead.')
    }
  }

  const stopRecording = () => { mediaRecorderRef.current?.stop() }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
    setState('recorded')
  }

  const handleSubmit = async () => {
    if (!audioBlob) return
    setState('uploading')
    setStatusMsg('Getting upload URL…')

    try {
      const urlRes = await fetch(`${apiUrl}/v1/submissions/speaking/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ questionId }),
      })
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, audioKey } = await urlRes.json()

      setStatusMsg('Uploading audio…')
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': audioBlob.type || 'audio/webm' },
        body: audioBlob,
      })
      if (!uploadRes.ok) throw new Error('Audio upload failed')

      setStatusMsg('Submitting…')
      const submitRes = await fetch(`${apiUrl}/v1/submissions/speaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ questionId, audioKey }),
      })
      if (!submitRes.ok) throw new Error('Submission failed')
      const { submissionId: sid } = await submitRes.json()
      setSubmissionId(sid)
      setState('polling')
      setStatusMsg('Transcribing and scoring your response…')
      startPolling(sid)
    } catch (err: unknown) {
      setState('failed')
      setStatusMsg(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  const startPolling = (sid: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/v1/submissions/${sid}/status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const { status, reportId } = await res.json()
        if (status === 'completed' && reportId) {
          clearInterval(pollRef.current!)
          router.push(`/reports/${reportId}`)
        } else if (status === 'failed') {
          clearInterval(pollRef.current!)
          setState('failed')
          setStatusMsg('Scoring failed. Your credits have been refunded.')
        } else if (status === 'transcribing') {
          setStatusMsg('Transcribing your audio…')
        } else if (status === 'scoring') {
          setStatusMsg('AI is scoring your response…')
        }
      } catch { /* retry on next tick */ }
    }, 3000)
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <a href="/speaking" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← Speaking Practice</a>

      <div style={{ marginTop: '1.5rem', background: '#f9fafb', borderRadius: 10, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600 }}>
            {taskType.toUpperCase()}
          </span>
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{estimatedMinutes} min</span>
        </div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#374151' }}>{prompt}</p>
        {PART_TIPS[taskType] && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: '#6366f1', fontStyle: 'italic' }}>
            💡 {PART_TIPS[taskType]}
          </p>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {state === 'idle' && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={startRecording}
              style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
            >
              🎙 Start Recording
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '0.75rem 1.5rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
            >
              📁 Upload Audio
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </div>
        )}

        {state === 'recording' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '1.1rem' }}>● Recording {fmtTime(elapsedSec)}</span>
            <button
              onClick={stopRecording}
              style={{ padding: '0.75rem 1.5rem', background: '#374151', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              ■ Stop
            </button>
          </div>
        )}

        {state === 'recorded' && audioUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <audio controls src={audioUrl} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleSubmit}
                style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Submit for Scoring (2 credits)
              </button>
              <button
                onClick={() => { setAudioBlob(null); setAudioUrl(null); setState('idle') }}
                style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Re-record
              </button>
            </div>
          </div>
        )}

        {(state === 'uploading' || state === 'polling') && (
          <div style={{ padding: '1.5rem', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
            <p style={{ margin: 0, color: '#0369a1', fontWeight: 500 }}>⏳ {statusMsg}</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>This may take up to a minute. Please keep this page open.</p>
          </div>
        )}

        {state === 'failed' && (
          <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
            <p style={{ margin: 0, color: '#dc2626' }}>{statusMsg}</p>
            <button
              onClick={() => setState('idle')}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
