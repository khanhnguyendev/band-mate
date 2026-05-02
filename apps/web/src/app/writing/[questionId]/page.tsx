import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { WritingEditor } from '@/components/writing/writing-editor'

interface Props {
  params: Promise<{ questionId: string }>
}

export default async function WritingEditorPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { questionId } = await params
  const session = (await supabase.auth.getSession()).data.session

  const res = await fetch(`${process.env.API_URL}/v1/questions/writing`, { cache: 'no-store' })
  const sets = res.ok ? await res.json() : []

  type QSet = { questions: { id: string; prompt: string }[]; taskType: string; estimatedMinutes: number }
  const question = sets
    .flatMap((s: QSet) => s.questions.map((q: { id: string; prompt: string }) => ({ ...q, taskType: s.taskType, estimatedMinutes: s.estimatedMinutes })))
    .find((q: { id: string }) => q.id === questionId)

  if (!question) redirect('/writing')

  return (
    <WritingEditor
      questionId={questionId}
      prompt={question.prompt}
      taskType={question.taskType}
      estimatedMinutes={question.estimatedMinutes}
      accessToken={session?.access_token ?? ''}
      apiUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
    />
  )
}
