import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const res = await fetch(`${process.env.API_URL}/v1/users/me`, {
    headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
    cache: 'no-store',
  })

  if (res.ok) {
    const { user: profile } = await res.json()
    if (profile.onboardingCompletedAt) redirect('/dashboard')
  }

  return <OnboardingWizard />
}
