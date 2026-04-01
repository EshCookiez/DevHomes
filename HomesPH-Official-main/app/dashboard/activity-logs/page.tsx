import ActivityLogTable from '@/components/reports/activity-log-table'
import { getReportsRawBundle } from '@/lib/reports-admin'

export default async function DashboardActivityLogsPage() {
  const rawBundle = await getReportsRawBundle()
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Recent system-level activity across the dashboard and data management modules.</p>
      </div>
      <ActivityLogTable data={rawBundle.activityLogs} title="Recent System Activities" />
    </div>
  )
}