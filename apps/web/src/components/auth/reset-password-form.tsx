'use client'

import { ResetPasswordSchema } from '@band-mate/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const parsed = ResetPasswordSchema.safeParse({ password: form.get('password') })

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid password')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Set new password</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        New password
        <input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  )
}
