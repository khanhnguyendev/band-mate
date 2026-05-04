import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ReadingQuiz } from '@/components/reading/reading-quiz'

interface Props {
  params: Promise<{ setId: string }>
}

export default async function ReadingSetPage({ params }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_READING !== 'true') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { setId } = await params
  const session = (await supabase.auth.getSession()).data.session

  const res = await fetch(`${process.env.API_URL}/v1/reading/sets`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
    cache: 'no-store',
  })
  const sets = res.ok ? await res.json() : []

  type QSet = { id: string; title: string; questions: { id: string; prompt: string; mediaUrl: string | null; order: number }[] }
  const set = sets.find((s: QSet) => s.id === setId)
  if (!set) redirect('/reading')

  const passage = set.questions[0]?.mediaUrl ?? ''

  return (
    <ReadingQuiz
      setId={setId}
      title={set.title}
      passage={passage}
      questions={set.questions.map((q: { id: string; prompt: string; order: number }) => ({ id: q.id, prompt: q.prompt, order: q.order }))}
      accessToken={session?.access_token ?? ''}
      apiUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
    />
  )
}
