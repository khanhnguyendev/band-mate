'use client'

import { RegisterSchema } from '@band-mate/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const parsed = RegisterSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
    })

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div>
        <h2>Check your email</h2>
        <p>We sent a verification link to your email address. Click it to activate your account.</p>
      </div>
    )
  }

  return (
    <form method="post" onSubmit={handleSubmit}>
      <h1>Create your account</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Name
        <input name="name" type="text" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </form>
  )
}
