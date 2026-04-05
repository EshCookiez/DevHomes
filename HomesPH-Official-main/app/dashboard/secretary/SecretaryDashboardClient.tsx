'use client'

import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Link2,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react'
import ActivityFeed, { type ActivityItem } from '@/components/dashboard/ActivityFeed'
import KpiCard from '@/components/dashboard/KpiCard'
import PendingReviews from '@/components/dashboard/PendingReviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  pendingAgents: any[]
  leads: any[]
  summary: {
    activeMembers: number
    inactiveMembers: number
    ownerReady: number
    pendingInvites: number
    pendingOnboarding: number
    officeName: string
    ownerNotificationRecipients: number
  }
}

function buildActivityItems(pendingAgents: any[], leads: any[], summary: Props['summary']): ActivityItem[] {
  const items: ActivityItem[] = []

  const ownerReadyAgent = pendingAgents.find((agent) => agent.account_status === 'under_review')
  if (ownerReadyAgent) {
    items.push({
      id: `owner-${ownerReadyAgent.id}`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      title: `${ownerReadyAgent.full_name} is ready for final approval`,
      description: 'Reviewed by secretary and ready for final approval.',
      time: 'Current queue',
    })
  }

  const correctionAgent = pendingAgents.find((agent) => agent.account_status === 'correction_required')
  if (correctionAgent) {
    items.push({
      id: `correction-${correctionAgent.id}`,
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      title: `${correctionAgent.full_name} needs corrections`,
      description: correctionAgent.rejection_reason?.trim() || 'Waiting for the applicant to resubmit requirements.',
      time: 'Correction queue',
    })
  }

  if (summary.pendingInvites > 0) {
    items.push({
      id: 'pending-invites',
      icon: Link2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: `${summary.pendingInvites} invite${summary.pendingInvites === 1 ? '' : 's'} pending`,
      description: 'Track pending invite links and resend if applicants have not yet joined.',
      time: 'Invitations',
    })
  }

  if (leads.length > 0) {
    items.push({
      id: 'recent-leads',
      icon: Mail,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      title: `${leads.length} recent office inquiries`,
      description: 'The office has fresh inquiry activity worth monitoring.',
      time: 'Lead desk',
    })
  }

  return items.slice(0, 4)
}

export default function SecretaryDashboardClient({ pendingAgents, leads, summary }: Props) {
  const activityItems = buildActivityItems(pendingAgents, leads, summary)

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Operations Hub</h1>
          <p className="mt-1 font-medium text-slate-500">Manage office operations for {summary.officeName}.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Office Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[#1428ae]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1428ae]" />
            Connected
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Active Members" value={summary.activeMembers} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Pending Invites" value={summary.pendingInvites} icon={Link2} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <KpiCard title="Needs Review" value={pendingAgents.filter((agent) => agent.account_status === 'pending_approval').length} icon={ClipboardList} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Correction Queue" value={pendingAgents.filter((agent) => agent.account_status === 'correction_required').length} icon={AlertCircle} iconColor="text-rose-600" iconBg="bg-rose-50" description={`${summary.ownerReady} ready for final approval`} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <ClipboardList className="text-[#1428ae]" size={20} />
                Application Review Desk
              </h2>
              <Link href="/dashboard/secretary/applications" className="flex items-center gap-1 text-xs font-bold text-[#1428ae] hover:underline">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <PendingReviews agents={pendingAgents} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:shadow-slate-200/50">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={20} />
                </div>
                <CardTitle className="text-base font-bold">Member Records</CardTitle>
                <CardDescription className="text-xs">Update member details and monitor onboarding items.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/secretary/members">
                  <Button variant="outline" size="sm" className="w-full border-slate-200 text-xs font-bold">
                    Manage Members
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:shadow-slate-200/50">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Link2 size={20} />
                </div>
                <CardTitle className="text-base font-bold">Invitations</CardTitle>
                <CardDescription className="text-xs">Send, track, and renew invite links for new agents.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/secretary/invitations">
                  <Button variant="outline" size="sm" className="w-full border-slate-200 text-xs font-bold">
                    Track Invites
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:shadow-slate-200/50">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Building2 size={20} />
                </div>
                <CardTitle className="text-base font-bold">Office Information</CardTitle>
                <CardDescription className="text-xs">Maintain office address details and assigned structure.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/secretary/office">
                  <Button variant="outline" size="sm" className="w-full border-slate-200 text-xs font-bold">
                    Update Office
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-lg hover:shadow-slate-200/50">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <FileText size={20} />
                </div>
                <CardTitle className="text-base font-bold">Document Center</CardTitle>
                <CardDescription className="text-xs">Upload, preview, and organize member onboarding documents.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/secretary/documents">
                  <Button variant="outline" size="sm" className="w-full border-slate-200 text-xs font-bold">
                    Open Archive
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          <Card className="border-none bg-[#0f172a] text-white shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Communication Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/secretary/invitations" className="block w-full">
                <Button className="h-11 w-full rounded-xl bg-[#1428ae] font-black text-white shadow-md transition-all hover:bg-[#1e3dc4]">
                  <UserPlus size={16} className="mr-2" />
                  Invite New Member
                </Button>
              </Link>
              <Link href="/dashboard/secretary/applications" className="block w-full">
                <Button variant="ghost" className="h-11 w-full rounded-xl text-sm font-bold text-slate-300 transition-all hover:bg-white/5 hover:text-white">
                  <ClipboardList size={16} className="mr-3" />
                  Review Owner-Ready Queue
                </Button>
              </Link>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Notice for Owner</p>
                <p className="text-xs text-slate-300 italic">
                  {summary.ownerReady === 0
                    ? 'No applications are waiting for final approval right now.'
                    : `${summary.ownerReady} application${summary.ownerReady === 1 ? '' : 's'} are reviewed and ready for final approval.`}
                </p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Owner email recipients on file: {summary.ownerNotificationRecipients}
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Member Monitoring</h2>
              <Activity size={14} className="text-slate-300" />
            </div>
            <ActivityFeed
              items={activityItems.length ? activityItems : [
                {
                  id: 'empty-feed',
                  icon: CheckCircle2,
                  iconColor: 'text-emerald-600',
                  iconBg: 'bg-emerald-50',
                  title: 'All queues are clear',
                  description: 'No urgent Secretary activity is waiting right now.',
                  time: 'Now',
                },
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
