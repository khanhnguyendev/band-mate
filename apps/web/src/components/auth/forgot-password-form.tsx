'use client'

import { ForgotPasswordSchema } from '@band-mate/shared'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const parsed = ForgotPasswordSchema.safeParse({ email: form.get('email') })

    if (!parsed.success) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // Always show success — don't reveal whether email exists
    setDone(true)
  }

  if (done) {
    return (
      <div>
        <h2>Check your email</h2>
        <p>If an account exists for that email, we sent a password reset link.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Reset your password</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p>
        <a href="/login">Back to login</a>
      </p>
    </form>
  )
}
