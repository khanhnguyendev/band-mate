'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Skill = 'writing' | 'speaking' | 'reading' | 'listening'

const SKILLS: { value: Skill; label: string }[] = [
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
]

const BAND_OPTIONS = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [targetBand, setTargetBand] = useState(6.5)
  const [testDate, setTestDate] = useState('')
  const [weakSkills, setWeakSkills] = useState<Skill[]>([])
  const [motivation, setMotivation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleSkill(skill: Skill) {
    setWeakSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    )
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetBand,
          testDate: testDate || undefined,
          weakSkills,
          motivation,
        }),
      })
      if (!res.ok) throw new Error('Failed to save onboarding')
      router.push('/dashboard?welcome=1')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      {/* Mascot greeting — step 1 only */}
      {step === 1 && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '4rem' }}>🦉</div>
          <h2 style={{ margin: '0.5rem 0' }}>Hi! I'm Bandy, your IELTS coach.</h2>
          <p style={{ color: '#666' }}>Let's set up your study plan in under 3 minutes.</p>
        </div>
      )}

      <div style={{ marginBottom: '0.5rem', color: '#999', fontSize: '0.85rem' }}>
        Step {step} of 4
      </div>

      {step === 1 && (
        <div>
          <h3>What band score are you aiming for?</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {BAND_OPTIONS.map((b) => (
              <button
                key={b}
                onClick={() => setTargetBand(b)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: targetBand === b ? '2px solid #4f46e5' : '1px solid #ccc',
                  background: targetBand === b ? '#ede9fe' : '#fff',
                  cursor: 'pointer',
                  fontWeight: targetBand === b ? 600 : 400,
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            style={nextBtnStyle}
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>When is your IELTS test? (optional)</h3>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem', borderRadius: 8, border: '1px solid #ccc', width: '100%', marginTop: '1rem' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(3)} style={nextBtnStyle}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Which skills do you want to improve? (select all that apply)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {SKILLS.map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={weakSkills.includes(value)}
                  onChange={() => toggleSkill(value)}
                  style={{ width: 18, height: 18 }}
                />
                {label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
            <button
              onClick={() => setStep(4)}
              disabled={weakSkills.length === 0}
              style={{ ...nextBtnStyle, opacity: weakSkills.length === 0 ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3>What's your main motivation for taking IELTS?</h3>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="e.g. Applying for a university abroad, immigration, job requirement..."
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: 8, border: '1px solid #ccc', marginTop: '1rem', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
            <button
              onClick={submit}
              disabled={motivation.trim().length === 0 || loading}
              style={{ ...nextBtnStyle, opacity: motivation.trim().length === 0 || loading ? 0.5 : 1 }}
            >
              {loading ? 'Saving...' : "Let's go! 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const nextBtnStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  background: '#4f46e5',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 600,
}

const backBtnStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  background: '#f3f4f6',
  color: '#374151',
  border: 'none',
  borderRadius: 8,
  fontSize: '1rem',
  cursor: 'pointer',
}
