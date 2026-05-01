'use client'

import { LoginSchema } from '@band-mate/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const parsed = LoginSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    })

    if (!parsed.success) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (signInError) {
      // Map Supabase's "Email not confirmed" error to the spec message (AC-2)
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email before logging in')
      } else {
        setError('Invalid email or password')
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log in to Band Mate</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Log in'}
      </button>
      <p>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p>
        No account? <a href="/register">Create one</a>
      </p>
    </form>
  )
}
