import ActivityLogTable from '@/components/reports/activity-log-table'
import { getActivityLogsForDashboardScope } from '@/lib/reports-admin'

export default async function DashboardActivityLogsPage() {
  const bundle = await getActivityLogsForDashboardScope()
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-500">{bundle.description}</p>
      </div>
      <ActivityLogTable data={bundle.activityLogs} title={bundle.title} />
    </div>
  )
}
