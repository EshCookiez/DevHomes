'use client'

import { useMemo, useState } from 'react'
import { addDays, endOfDay, endOfMonth, format, isAfter, isBefore, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { CalendarIcon, Download } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { DateRange } from 'react-day-picker'
import type { ReportsComputedBundle, ReportsCountRecord, ReportsPreset, ReportsRawBundle } from '@/lib/reports-types'
import AnalyticsCards, { calculateDelta } from './analytics-cards'
import UserGrowthChart from './user-growth-chart'
import ProjectsGrowthChart from './projects-growth-chart'
import LeadsFunnelChart from './leads-funnel-chart'
import InquiriesChart from './inquiries-chart'
import TopProjectsTable from './top-projects-table'
import TopAgentsTable from './top-agents-table'
import ActivityLogTable from './activity-log-table'

function getRangeDates(preset: ReportsPreset, customRange: DateRange | undefined) {
  const now = new Date()

  if (preset === 'custom' && customRange?.from) {
    return {
      from: startOfDay(customRange.from),
      to: endOfDay(customRange.to ?? customRange.from),
    }
  }

  if (preset === '7d') return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
  if (preset === '30d') return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
  if (preset === '6m') return { from: startOfMonth(subMonths(now, 5)), to: endOfDay(now) }
  return { from: startOfMonth(subMonths(now, 11)), to: endOfDay(now) }
}

function isInRange(value: string | null, from: Date, to: Date) {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  return !isBefore(parsed, from) && !isAfter(parsed, to)
}

function previousRange(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime()
  const previousTo = new Date(from.getTime() - 1)
  const previousFrom = new Date(previousTo.getTime() - duration)
  return { from: previousFrom, to: previousTo }
}

function countPeriod<T extends { created_at: string | null }>(items: T[], from: Date, to: Date): ReportsCountRecord {
  const current = items.filter((item) => isInRange(item.created_at, from, to)).length
  const previousWindow = previousRange(from, to)
  const previous = items.filter((item) => isInRange(item.created_at, previousWindow.from, previousWindow.to)).length
  return { current, previous }
}

function buildMonthlySeries<T extends { created_at: string | null }>(items: T[], from: Date, to: Date) {
  const buckets: Array<{ key: string; label: string; value: number }> = []
  let cursor = startOfMonth(from)
  const end = endOfMonth(to)

  while (!isAfter(cursor, end)) {
    const key = format(cursor, 'yyyy-MM')
    buckets.push({ key, label: format(cursor, 'MMM yy'), value: 0 })
    cursor = startOfMonth(addDays(endOfMonth(cursor), 1))
  }

  for (const item of items) {
    if (!isInRange(item.created_at, from, to)) continue
    const key = format(new Date(item.created_at as string), 'yyyy-MM')
    const bucket = buckets.find((entry) => entry.key === key)
    if (bucket) bucket.value += 1
  }

  return buckets.map(({ label, value }) => ({ label, value }))
}

function computeReports(rawBundle: ReportsRawBundle, from: Date, to: Date): ReportsComputedBundle {
  const totals = {
    users: countPeriod(rawBundle.users, from, to),
    developers: countPeriod(rawBundle.developers, from, to),
    projects: countPeriod(rawBundle.projects, from, to),
    listings: countPeriod(rawBundle.listings, from, to),
    leads: countPeriod(rawBundle.leads, from, to),
    inquiries: countPeriod(rawBundle.inquiries, from, to),
  }

  const userGrowth = buildMonthlySeries(rawBundle.users, from, to)
  const developersGrowth = buildMonthlySeries(rawBundle.developers, from, to)
  const projectsGrowth = buildMonthlySeries(rawBundle.projects, from, to)
  const listingsGrowth = buildMonthlySeries(rawBundle.listings, from, to)
  const inquiryByMonth = buildMonthlySeries(rawBundle.inquiries, from, to)

  const filteredLeads = rawBundle.leads.filter((lead) => isInRange(lead.created_at, from, to))
  const filteredInquiries = rawBundle.inquiries.filter((inquiry) => isInRange(inquiry.created_at, from, to))
  const filteredListings = rawBundle.listings.filter((listing) => isInRange(listing.created_at, from, to))

  const funnelOrder = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost']
  const leadsFunnel = funnelOrder.map((status) => ({ status, value: filteredLeads.filter((lead) => (lead.status ?? 'new') === status).length }))

  const projectMap = new Map(rawBundle.projectsLookup.map((project) => [project.id, project.name]))
  const listingMap = new Map(rawBundle.listingsLookup.map((listing) => [listing.id, listing.title]))

  const inquiryByProjectMap = new Map<string, number>()
  const inquiryByListingMap = new Map<string, number>()
  for (const inquiry of filteredInquiries) {
    const projectLabel = inquiry.project_id ? projectMap.get(inquiry.project_id) ?? 'Unknown project' : 'Unassigned project'
    inquiryByProjectMap.set(projectLabel, (inquiryByProjectMap.get(projectLabel) ?? 0) + 1)
    const listingLabel = inquiry.listing_id ? listingMap.get(inquiry.listing_id) ?? 'Unknown listing' : 'Unassigned listing'
    inquiryByListingMap.set(listingLabel, (inquiryByListingMap.get(listingLabel) ?? 0) + 1)
  }

  const topProjects = rawBundle.projectsLookup.map((project) => {
    const listingsCount = filteredListings.filter((listing) => listing.project_id === project.id).length
    const inquiriesCount = filteredInquiries.filter((inquiry) => inquiry.project_id === project.id).length
    const leadsCount = filteredLeads.filter((lead) => lead.project_id === project.id).length
    const unitsCount = rawBundle.projectUnits.filter((unit) => unit.project_id === project.id).length
    const closedDeals = filteredLeads.filter((lead) => lead.project_id === project.id && lead.status === 'closed_won').length
    const conversionRate = leadsCount > 0 ? Number(((closedDeals / leadsCount) * 100).toFixed(1)) : 0
    return { project_id: project.id, project_name: project.name, units_count: unitsCount, listings_count: listingsCount, inquiries_count: inquiriesCount, leads_count: leadsCount, conversion_rate: conversionRate }
  }).sort((left, right) => (right.inquiries_count + right.leads_count) - (left.inquiries_count + left.leads_count)).slice(0, 8)

  const topAgents = rawBundle.usersLookup.map((user) => {
    const leads = filteredLeads.filter((lead) => lead.assigned_to === user.id)
    const leadsCount = leads.length
    const closedDeals = leads.filter((lead) => lead.status === 'closed_won').length
    const conversionRate = leadsCount > 0 ? Number(((closedDeals / leadsCount) * 100).toFixed(1)) : 0
    return { user_id: user.id, agent_name: user.full_name, leads_count: leadsCount, closed_deals: closedDeals, conversion_rate: conversionRate }
  }).filter((agent) => agent.leads_count > 0).sort((left, right) => right.leads_count - left.leads_count).slice(0, 8)

  const activityLogs = rawBundle.activityLogs.filter((entry) => isInRange(entry.created_at, from, to)).slice(0, 20)

  return {
    totals,
    userGrowth,
    developersGrowth,
    projectsGrowth,
    listingsGrowth,
    leadsFunnel,
    inquiryByMonth,
    inquiryByProject: Array.from(inquiryByProjectMap.entries()).map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value).slice(0, 6),
    inquiryByListing: Array.from(inquiryByListingMap.entries()).map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value).slice(0, 6),
    topProjects,
    topAgents,
    activityLogs,
  }
}

function exportCsv(bundle: ReportsComputedBundle) {
  const lines = [
    ['Metric', 'Current', 'Previous'],
    ['Total Users', bundle.totals.users.current, bundle.totals.users.previous],
    ['Total Developers', bundle.totals.developers.current, bundle.totals.developers.previous],
    ['Total Projects', bundle.totals.projects.current, bundle.totals.projects.previous],
    ['Total Listings', bundle.totals.listings.current, bundle.totals.listings.previous],
    ['Total Leads', bundle.totals.leads.current, bundle.totals.leads.previous],
    ['Total Inquiries', bundle.totals.inquiries.current, bundle.totals.inquiries.previous],
    [],
    ['Top Projects'],
    ['Project', 'Listings', 'Inquiries', 'Leads', 'Conversion'],
    ...bundle.topProjects.map((row) => [row.project_name, row.listings_count, row.inquiries_count, row.leads_count, `${row.conversion_rate}%`]),
    [],
    ['Top Agents'],
    ['Agent', 'Leads', 'Closed Deals', 'Conversion Rate'],
    ...bundle.topAgents.map((row) => [row.agent_name, row.leads_count, row.closed_deals, `${row.conversion_rate}%`]),
  ]

  const csv = lines.map((row) => Array.isArray(row) ? row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',') : '').join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `reports-${Date.now()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ReportsDashboardClient({ rawBundle }: { rawBundle: ReportsRawBundle }) {
  const { toast } = useToast()
  const [preset, setPreset] = useState<ReportsPreset>('30d')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()

  const range = useMemo(() => getRangeDates(preset, customRange), [preset, customRange])
  const computed = useMemo(() => computeReports(rawBundle, range.from, range.to), [rawBundle, range])

  const kpiCards = useMemo(() => [
    { title: 'Total Users', value: computed.totals.users.current, delta: calculateDelta(computed.totals.users), trend: computed.userGrowth.slice(-6) },
    { title: 'Total Developers', value: computed.totals.developers.current, delta: calculateDelta(computed.totals.developers), trend: computed.developersGrowth.slice(-6) },
    { title: 'Total Projects', value: computed.totals.projects.current, delta: calculateDelta(computed.totals.projects), trend: computed.projectsGrowth.slice(-6) },
    { title: 'Total Listings', value: computed.totals.listings.current, delta: calculateDelta(computed.totals.listings), trend: computed.listingsGrowth.slice(-6) },
    { title: 'Total Leads', value: computed.totals.leads.current, delta: calculateDelta(computed.totals.leads), trend: computed.leadsFunnel.slice(0, 6).map((entry, index) => ({ label: `${index + 1}`, value: entry.value })) },
    { title: 'Total Inquiries', value: computed.totals.inquiries.current, delta: calculateDelta(computed.totals.inquiries), trend: computed.inquiryByMonth.slice(-6) },
  ], [computed])

  function handlePresetChange(value: ReportsPreset) {
    setPreset(value)
    toast({ title: 'Report updated', description: value === 'custom' ? 'Choose a custom date range.' : 'Date range applied.' })
  }

  function handleExport() {
    exportCsv(computed)
    toast({ title: 'Export successful', description: 'The current analytics snapshot was exported to CSV.' })
  }

  const closedDeals = computed.leadsFunnel.find((entry) => entry.status === 'closed_won')?.value ?? 0
  const lostLeads = computed.leadsFunnel.find((entry) => entry.status === 'closed_lost')?.value ?? 0
  const totalLeads = computed.totals.leads.current
  const conversionRate = totalLeads > 0 ? Number(((closedDeals / totalLeads) * 100).toFixed(1)) : 0

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Platform-wide analytics for users, developers, projects, listings, leads, inquiries, and system activity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={preset} onValueChange={(value: ReportsPreset) => handlePresetChange(value)}>
            <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <CalendarIcon size={15} />
                {format(range.from, 'MMM d, yyyy')} - {format(range.to, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-xl border-slate-200 p-0" align="end">
              <Calendar mode="range" selected={customRange} onSelect={(nextRange) => { setCustomRange(nextRange); setPreset('custom'); if (nextRange?.from) toast({ title: 'Date range applied', description: 'Custom range updated.' }) }} numberOfMonths={2} />
            </PopoverContent>
          </Popover>

          <Button variant="outline" className="rounded-xl" onClick={handleExport}><Download size={15} />Export CSV</Button>
        </div>
      </div>

      <AnalyticsCards cards={kpiCards} />
      <UserGrowthChart data={computed.userGrowth} />
      <ProjectsGrowthChart projects={computed.projectsGrowth} listings={computed.listingsGrowth} />
      <LeadsFunnelChart data={computed.leadsFunnel} closedDeals={closedDeals} lostLeads={lostLeads} conversionRate={conversionRate} />
      <InquiriesChart byMonth={computed.inquiryByMonth} byProject={computed.inquiryByProject} byListing={computed.inquiryByListing} />
      <div className="grid gap-6 xl:grid-cols-2">
        <TopProjectsTable data={computed.topProjects} />
        <TopAgentsTable data={computed.topAgents} />
      </div>
      <ActivityLogTable data={computed.activityLogs} />
    </div>
  )
}