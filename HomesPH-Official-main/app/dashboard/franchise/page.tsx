import Link from 'next/link'
import { ArrowRight, BarChart3, Building2, ClipboardList, Link2, MapPin, Settings, Users } from 'lucide-react'
import DashboardChart from '@/components/dashboard/DashboardChart'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getFranchiseDashboardSnapshot } from './actions'

function MetricCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string
  icon: typeof Users
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

export default async function FranchiseDashboardPage() {
  const snapshot = await getFranchiseDashboardSnapshot()

  if (!snapshot.hasCompany) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <Card className="border-dashed border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Franchise Setup Needed
            </Badge>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Franchise Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Your account is approved, but there is no live franchise organization linked yet. Finish your organization
                setup first so the dashboard can load members, offices, and reports.
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

  const { latestMembers, offices, summary } = snapshot

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{summary.companyName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the main office, secretary assignment, direct members, suboffices, applications, and invitations from
            the live franchise owner pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/dashboard/franchise/applications">Owner Applications</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/dashboard/franchise/suboffices">Manage Suboffices</Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
            <Link href="/dashboard/franchise/settings">Organization Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Network Members"
          value={summary.networkMembers}
          description="Direct members and branch-linked members in the organization."
          icon={Users}
        />
        <MetricCard
          title="Active Members"
          value={summary.activeMembers}
          description="Approved accounts with active dashboard access."
          icon={Users}
        />
        <MetricCard
          title="Pending Applications"
          value={summary.pendingApplications}
          description="Applications still waiting for review or correction."
          icon={ClipboardList}
        />
        <MetricCard
          title="Suboffices"
          value={summary.suboffices}
          description="Connected branch offices under the main franchise."
          icon={Building2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <DashboardChart
          title="Team Onboarding"
          subtitle="New member records linked to the franchise network over the last 6 months."
          type="bar"
          data={snapshot.applicationsByMonth}
          dataKey="count"
          color="#1428ae"
        />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Live Queue Snapshot</CardTitle>
            <CardDescription>Current operational totals across the franchise structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Ready for Owner Approval</span>
              <span className="text-lg font-black text-slate-900">{summary.ownerReady}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Pending Invitations</span>
              <span className="text-lg font-black text-slate-900">{summary.pendingInvites}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Assigned Secretaries</span>
              <span className="text-lg font-black text-slate-900">{summary.assignedSecretaries}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Salespersons</span>
              <span className="text-lg font-black text-slate-900">{summary.salespersons}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Newest Member Records</CardTitle>
                <CardDescription>Recently linked members across your franchise organization.</CardDescription>
              </div>
              <Button
                asChild
                variant="ghost"
                className="rounded-xl text-[#1428ae] hover:bg-blue-50 hover:text-[#1428ae]"
              >
                <Link href="/dashboard/franchise/team">
                  View Team <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-4 py-4">Office</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {latestMembers.length ? (
                  latestMembers.map((member) => (
                    <tr key={`${member.companyId}-${member.profileId}`} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{member.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{member.email || 'No email on file'}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{member.workplace}</td>
                      <td className="px-4 py-4 text-slate-600">{member.roleLabel}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Not available'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                      No members are linked to this franchise yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Office Coverage</CardTitle>
                <CardDescription>Parent office and connected suboffice summaries.</CardDescription>
              </div>
              <Button
                asChild
                variant="ghost"
                className="rounded-xl text-[#1428ae] hover:bg-blue-50 hover:text-[#1428ae]"
              >
                <Link href="/dashboard/franchise/suboffices">
                  Manage Suboffices <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {offices.map((office) => (
              <div key={office.companyId} className="rounded-xl border border-slate-200 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{office.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          office.isParent
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }
                      >
                        {office.isParent ? 'Parent Office' : 'Suboffice'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{office.address}</p>
                  </div>
                  <BarChart3 size={16} className="text-slate-300" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-500">
                  <div>
                    <p className="font-black uppercase tracking-wide text-slate-400">Members</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{office.memberCount}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-wide text-slate-400">Queue</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{office.pendingApplications}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-wide text-slate-400">Secretary</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{office.secretaryName || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Franchise Organization</CardTitle>
          <CardDescription>
            Current owner-level responsibilities that are already live across your franchise management pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/franchise/settings"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1428ae]">
                <MapPin size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Set Address</p>
                <p className="mt-1 text-xs text-slate-500">Set and manage the main office address.</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/franchise/settings"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Users size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Assign Secretary</p>
                <p className="mt-1 text-xs text-slate-500">Assign and manage the main secretary.</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/franchise/team"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1428ae]">
                <Users size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Direct Members</p>
                <p className="mt-1 text-xs text-slate-500">Manage direct members under the franchise.</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/franchise/suboffices"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Suboffices</p>
                <p className="mt-1 text-xs text-slate-500">Create and oversee suboffices.</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/franchise/applications"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Approve Applications</p>
                <p className="mt-1 text-xs text-slate-500">Review and approve applications.</p>
              </div>
            </div>
          </Link>
          <Link
            href="/dashboard/franchise/invitations"
            className="rounded-xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Link2 size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Invitations</p>
                <p className="mt-1 text-xs text-slate-500">Manage owner-side invitations.</p>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Settings size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Parent Organization Responsibilities</CardTitle>
                <CardDescription>
                  Franchise-level member control stays with the parent organization, even when members are later placed
                  under suboffices.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live Now</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Set and manage main office address</li>
                <li>Assign and manage the main secretary</li>
                <li>Manage direct members</li>
                <li>Create and oversee suboffices</li>
                <li>Review and approve applications</li>
                <li>Manage owner-side invitations</li>
                <li>Assign members to suboffices</li>
                <li>Transfer members between suboffices</li>
                <li>Deactivate or remove members</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Member Control</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Keep direct members in the main office when branch placement is not needed.</li>
                <li>Move members into the correct suboffice as operations expand.</li>
                <li>Transfer members between suboffices without recreating their record.</li>
                <li>Deactivate access or remove members from the franchise scope when needed.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Building2 size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Suboffice</CardTitle>
                <CardDescription>
                  Branch-level operations stay local to the suboffice and are managed day to day through the assigned
                  secretary.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Set address', 'Secretary', 'Manage branch members', 'Send invites'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Franchise-wide approvals, cross-suboffice transfers, and full member control remain owner-level actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
