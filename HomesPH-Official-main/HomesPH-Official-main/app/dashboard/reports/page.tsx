import ReportsDashboardClient from '@/components/reports/reports-dashboard-client'
import { getReportsRawBundle } from '@/lib/reports-admin'

export default async function DashboardReportsPage() {
  const rawBundle = await getReportsRawBundle()
  return <ReportsDashboardClient rawBundle={rawBundle} />
}