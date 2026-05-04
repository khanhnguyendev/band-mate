import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ReportView } from '@/components/reports/report-view'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token ?? ''
  const apiUrl = process.env.API_URL ?? ''

  const [reportRes, compareRes] = await Promise.all([
    fetch(`${apiUrl}/v1/reports/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`${apiUrl}/v1/reports/${id}/compare`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ])

  if (!reportRes.ok) redirect('/reports')

  const report = await reportRes.json()
  const compare = compareRes.ok
    ? await compareRes.json()
    : { skill: report.skill, current: { band: report.overallBand, createdAt: report.createdAt, criteria: [] }, previous: null }

  return (
    <ReportView
      reportId={id}
      skill={report.skill}
      overallBand={report.overallBand}
      disclaimer={report.disclaimer}
      criteria={report.criteria}
      improvementTasks={report.improvementTasks}
      compare={compare}
      accessToken={token}
      apiUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
    />
  )
}
