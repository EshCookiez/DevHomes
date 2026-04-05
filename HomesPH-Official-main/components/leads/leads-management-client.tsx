'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, CircleCheckBig, Handshake, UsersRound } from 'lucide-react'
import { updateLeadStatusAction } from '@/app/dashboard/leads/actions'
import DashboardChart from '@/components/dashboard/DashboardChart'
import LeadsKanbanBoard from '@/components/leads/leads-kanban-board'
import LeadsTable from '@/components/leads/leads-table'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { LeadAnalyticsBundle, LeadProjectOptionRecord, LeadRecord, LeadTimelineItem, LeadStatus, LeadUserOptionRecord } from '@/lib/leads-types'

function buildTimelineMap(leads: LeadRecord[]) {
  return new Map<number, LeadTimelineItem[]>(leads.map((lead) => [lead.id, [
    { id: `${lead.id}-created`, label: 'Lead created', description: `${lead.lead_name || 'Lead'} entered the pipeline.`, occurred_at: lead.created_at },
    { id: `${lead.id}-contact`, label: 'Last contacted', description: lead.last_contacted_at ? 'Sales outreach was recorded.' : 'No contact yet.', occurred_at: lead.last_contacted_at },
    { id: `${lead.id}-status`, label: 'Status updated', description: `Current stage is ${lead.status.replace(/_/g, ' ')}.`, occurred_at: lead.updated_at },
  ]]))
}

function buildAnalytics(leads: LeadRecord[]): LeadAnalyticsBundle {
  const totalLeads = leads.length
  const qualifiedLeads = leads.filter((lead) => ['qualified', 'proposal_sent', 'negotiation', 'closed_won'].includes(lead.status)).length
  const closedDeals = leads.filter((lead) => lead.status === 'closed_won').length
  const conversionRate = totalLeads > 0 ? Number(((closedDeals / totalLeads) * 100).toFixed(1)) : 0
  const monthMap = new Map<string, number>()
  const sourceMap = new Map<string, number>()
  const pipelineMap = new Map<string, number>([
    ['new', 0],
    ['contacted', 0],
    ['qualified', 0],
    ['proposal_sent', 0],
    ['negotiation', 0],
    ['closed_won', 0],
    ['closed_lost', 0],
  ])

  for (const lead of leads) {
    const date = lead.created_at ? new Date(lead.created_at) : null
    const monthKey = date && !Number.isNaN(date.getTime()) ? date.toLocaleString('en-US', { month: 'short' }) : 'Unknown'
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1)

    const source = lead.source?.trim() || 'Unknown'
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1)
    pipelineMap.set(lead.status, (pipelineMap.get(lead.status) ?? 0) + 1)
  }

  return {
    totalLeads,
    qualifiedLeads,
    closedDeals,
    conversionRate,
    leadsByMonth: Array.from(monthMap.entries()).map(([label, count]) => ({ label, count })),
    pipeline: Array.from(pipelineMap.entries()).map(([status, count]) => ({ status: status as LeadStatus, count })),
    sources: Array.from(sourceMap.entries()).map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count).slice(0, 6),
  }
}

export default function LeadsManagementClient({ initialLeads, analytics, users, agents, projects, pageTitle = 'Leads Management', pageDescription = 'Monitor, assign, and move sales leads through the CRM pipeline.', canCreate = true, canEdit = true, canAssign = true, canDelete = true, canReturn = true, enablePipeline = true }: { initialLeads: LeadRecord[]; analytics: LeadAnalyticsBundle; users: LeadUserOptionRecord[]; agents: LeadUserOptionRecord[]; projects: LeadProjectOptionRecord[]; pageTitle?: string; pageDescription?: string; canCreate?: boolean; canEdit?: boolean; canAssign?: boolean; canDelete?: boolean; canReturn?: boolean; enablePipeline?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState(initialLeads)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel('admin-leads-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => router.refresh()).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [router])

  const timelineMap = useMemo(() => buildTimelineMap(leads), [leads])
  const computedAnalytics = useMemo(() => buildAnalytics(leads), [leads])

  function handleKanbanStatusChange(lead: LeadRecord, status: LeadStatus) {
    const previous = leads
    setLeads(leads.map((entry) => entry.id === lead.id ? { ...entry, status } : entry))
    startTransition(async () => {
      const result = await updateLeadStatusAction(lead.id, status)
      if (!result.success || !result.data) {
        setLeads(previous)
        toast({ title: 'Pipeline update failed', description: result.message, variant: 'destructive' })
        return
      }
      setLeads(previous.map((entry) => entry.id === lead.id ? result.data as LeadRecord : entry))
      router.refresh()
      toast({ title: 'Lead status updated', description: result.message })
    })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{pageDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Leads" value={computedAnalytics.totalLeads.toString()} icon={UsersRound} tone="blue" />
        <MetricCard title="Qualified Leads" value={computedAnalytics.qualifiedLeads.toString()} icon={BarChart3} tone="emerald" />
        <MetricCard title="Closed Deals" value={computedAnalytics.closedDeals.toString()} icon={Handshake} tone="amber" />
        <MetricCard title="Conversion Rate" value={`${computedAnalytics.conversionRate}%`} icon={CircleCheckBig} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardChart title="Leads by Month" type="area" data={computedAnalytics.leadsByMonth.map((entry) => ({ label: entry.label, count: entry.count }))} dataKey="count" xKey="label" color="#2563eb" className="xl:col-span-1" />
        <DashboardChart title="Lead Conversion Pipeline" type="bar" data={computedAnalytics.pipeline.map((entry) => ({ name: entry.status.replace(/_/g, ' '), count: entry.count }))} dataKey="count" xKey="name" color="#059669" className="xl:col-span-1" />
        <DashboardChart title="Top Lead Sources" type="bar" data={computedAnalytics.sources.map((entry) => ({ label: entry.label, count: entry.count }))} dataKey="count" xKey="label" color="#d97706" className="xl:col-span-1" />
      </div>

      <Tabs defaultValue="table" className="gap-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
          <TabsTrigger value="table" className="rounded-xl px-4 py-2.5">Table View</TabsTrigger>
          {enablePipeline ? <TabsTrigger value="pipeline" className="rounded-xl px-4 py-2.5">Pipeline View</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="table"><LeadsTable leads={leads} users={users} agents={agents} projects={projects} timelineMap={timelineMap} onChange={setLeads} canCreate={canCreate} canEdit={canEdit} canAssign={canAssign} canDelete={canDelete} canReturn={canReturn} /></TabsContent>
        {enablePipeline ? <TabsContent value="pipeline"><LeadsKanbanBoard leads={leads} onStatusChange={handleKanbanStatusChange} canDrag={canEdit} /></TabsContent> : null}
      </Tabs>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof UsersRound; tone: 'blue' | 'emerald' | 'amber' | 'slate' }) {
  const toneClass = { blue: 'bg-blue-50 text-blue-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-700' }[tone]
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 px-5 py-5"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}><Icon size={20} /></span><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div></CardContent></Card>
}
