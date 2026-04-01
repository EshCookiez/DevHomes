'use client'

import DashboardChart from '@/components/dashboard/DashboardChart'
import { Card, CardContent } from '@/components/ui/card'
import type { ListingAnalyticsPoint, ListingRecord } from '@/lib/listings-types'

export default function ListingAnalyticsPanel({ listing, analyticsSeries }: { listing: ListingRecord; analyticsSeries: ListingAnalyticsPoint[] }) {
  const views = listing.views_count ?? 0
  const inquiries = listing.inquiries_count ?? 0
  const conversionRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0.0'

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Views Count" value={views.toLocaleString()} tone="blue" />
        <MetricCard title="Inquiries Count" value={inquiries.toLocaleString()} tone="emerald" />
        <MetricCard title="Conversion Rate" value={`${conversionRate}%`} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardChart title="Views Over Time" subtitle="Derived from current aggregate totals" type="area" data={analyticsSeries} dataKey="views" xKey="label" color="#2563eb" />
        <DashboardChart title="Inquiries Over Time" subtitle="Derived from current aggregate totals" type="bar" data={analyticsSeries} dataKey="inquiries" xKey="label" color="#059669" />
      </div>

      <Card className="border-amber-200 bg-amber-50 shadow-sm"><CardContent className="px-5 py-4 text-sm text-amber-900">Historical event tables were not part of the provided schema, so these charts are derived from the current views and inquiries totals instead of true time-series tracking.</CardContent></Card>
    </div>
  )
}

function MetricCard({ title, value, tone }: { title: string; value: string; tone: 'blue' | 'emerald' | 'amber' }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="px-5 py-5">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{title}</span>
        <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      </CardContent>
    </Card>
  )
}