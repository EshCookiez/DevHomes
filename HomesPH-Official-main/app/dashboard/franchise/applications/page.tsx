import Link from 'next/link'
import { Search, ShieldCheck, ClipboardList, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getFranchiseApplicationsSnapshot } from '../actions'

type ApplicationsPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
    status?: string | string[]
  }>
}

type StatusFilterKey = 'all' | 'pending' | 'ready' | 'correction' | 'approved' | 'rejected'

const FILTER_OPTIONS: Array<{
  key: StatusFilterKey
  label: string
  matches: (status: string) => boolean
}> = [
  { key: 'all', label: 'All', matches: () => true },
  { key: 'ready', label: 'Ready for Owner', matches: (status) => status === 'under_review' },
  { key: 'pending', label: 'Pending', matches: (status) => status === 'pending_approval' },
  { key: 'correction', label: 'Correction', matches: (status) => status === 'correction_required' },
  { key: 'approved', label: 'Approved', matches: (status) => status === 'approved' },
  { key: 'rejected', label: 'Rejected', matches: (status) => status === 'rejected' },
]

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function buildFilterHref(filter: StatusFilterKey, query: string) {
  const params = new URLSearchParams()

  if (filter !== 'all') {
    params.set('status', filter)
  }

  if (query.trim()) {
    params.set('q', query.trim())
  }

  const search = params.toString()
  return `/dashboard/franchise/applications${search ? `?${search}` : ''}`
}

function getActionLabel(status: string) {
  switch (status) {
    case 'under_review':
      return 'Review & Decide'
    case 'correction_required':
      return 'View Correction'
    case 'approved':
    case 'rejected':
      return 'View Record'
    default:
      return 'Open Review'
  }
}

function SummaryCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string
  icon: typeof ClipboardList
  title: string
  value: number
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-1.5 text-xs text-slate-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1428ae]">
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function FranchiseApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const selectedStatus = getQueryValue(resolvedSearchParams.status) as StatusFilterKey
  const rawQuery = getQueryValue(resolvedSearchParams.q).trim()
  const query = rawQuery.toLowerCase()
  const activeFilter = FILTER_OPTIONS.find((option) => option.key === selectedStatus) ?? FILTER_OPTIONS[0]
  const snapshot = await getFranchiseApplicationsSnapshot()

  if (!snapshot.hasCompany) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <Card className="border-dashed border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Franchise Setup Needed
            </Badge>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Owner Applications</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Finish your franchise organization setup first so owner applications can be loaded under your office scope.
              </p>
            </div>
            <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Link href="/dashboard/franchise/settings">Open Organization Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const counts = {
    all: snapshot.applications.length,
    approved: snapshot.applications.filter((item) => item.status === 'approved').length,
    correction: snapshot.applications.filter((item) => item.status === 'correction_required').length,
    pending: snapshot.applications.filter((item) => item.status === 'pending_approval').length,
    ready: snapshot.applications.filter((item) => item.status === 'under_review').length,
    rejected: snapshot.applications.filter((item) => item.status === 'rejected').length,
  }

  const visibleApplications = snapshot.applications.filter((application) => {
    const matchesStatus = activeFilter.matches(application.status)
    const matchesQuery =
      !query ||
      application.fullName.toLowerCase().includes(query) ||
      application.email.toLowerCase().includes(query) ||
      application.workplace.toLowerCase().includes(query)

    return matchesStatus && matchesQuery
  })

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Applications</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Live Data
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review invited agent applications across your franchise scope, whether they are still pending, already reviewed, in correction, approved, or rejected.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/dashboard/franchise/team">Open My Team</Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
            <Link href="/dashboard/franchise">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Ready for Owner" value={counts.ready} description="Applications already screened and flagged by the secretary." icon={ShieldCheck} />
        <SummaryCard title="Pending" value={counts.pending} description="Applications you can still inspect and decide on directly." icon={ClipboardList} />
        <SummaryCard title="Correction Required" value={counts.correction} description="Applications returned to agents for updates and resubmission." icon={AlertCircle} />
        <SummaryCard title="Approved / Rejected" value={counts.approved + counts.rejected} description="Completed owner decisions already recorded in the queue history." icon={CheckCircle2} />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Owner Application Queue</CardTitle>
              <CardDescription>
                {snapshot.companyName} owner review scope. Open any record to inspect documents, approve, or reject it directly.
              </CardDescription>
            </div>
            <form className="flex w-full gap-3 lg:w-auto" action="/dashboard/franchise/applications" method="get">
              {activeFilter.key !== 'all' ? <input type="hidden" name="status" value={activeFilter.key} /> : null}
              <div className="relative min-w-[260px] flex-1 lg:w-80 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  defaultValue={rawQuery}
                  placeholder="Search applicant, email, or office"
                  className="rounded-xl border-slate-200 pl-9"
                />
              </div>
              <Button type="submit" variant="outline" className="rounded-xl border-slate-200">
                Search
              </Button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const value = counts[option.key]
              const isActive = activeFilter.key === option.key

              return (
                <Button
                  key={option.key}
                  asChild
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={isActive ? 'rounded-full bg-[#1428ae] hover:bg-[#0f1f8a]' : 'rounded-full border-slate-200'}
                >
                  <Link href={buildFilterHref(option.key, rawQuery)}>
                    {option.label}
                    <span className="ml-2 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                      {value}
                    </span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-4 py-4">Office</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Contact</th>
                <th className="px-4 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleApplications.length ? (
                visibleApplications.map((application) => (
                  <tr key={`${application.companyId}-${application.profileId}`} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{application.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{application.email || 'No email on file'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{application.workplace}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-600">{application.phone || 'No phone on file'}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {application.joinedAt ? new Date(application.joinedAt).toLocaleDateString() : 'Not available'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-200">
                        <Link href={`/dashboard/profile/${application.profileId}`}>{getActionLabel(application.status)}</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    No applications matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">How owner approval works now</p>
            <p className="mt-1 text-sm text-slate-500">
              Secretary review can help triage applications, but franchise owners can still inspect and decide on pending applications directly. PRC verification remains a separate platform-admin workflow.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <XCircle size={16} className="text-rose-500" />
            PRC is not your approval step
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
