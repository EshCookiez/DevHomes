'use client'

import { Bar, BarChart, CartesianGrid, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import type { ReportsFunnelPoint } from '@/lib/reports-types'

export default function LeadsFunnelChart({ data, closedDeals, lostLeads, conversionRate }: { data: ReportsFunnelPoint[]; closedDeals: number; lostLeads: number; conversionRate: number }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-slate-200 p-5 shadow-sm">
        <p className="mb-4 text-sm font-bold text-slate-900">Leads Conversion Funnel</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.map((entry) => ({ label: entry.status.replace(/_/g, ' '), value: entry.value }))} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid gap-4">
        <Metric title="Conversion Rate" value={`${conversionRate}%`} tone="bg-blue-50 text-blue-700" />
        <Metric title="Closed Deals" value={closedDeals.toLocaleString()} tone="bg-emerald-50 text-emerald-700" />
        <Metric title="Lost Leads" value={lostLeads.toLocaleString()} tone="bg-rose-50 text-rose-700" />
      </div>
    </div>
  )
}

function Metric({ title, value, tone }: { title: string; value: string; tone: string }) {
  return <Card className="border-slate-200 p-5 shadow-sm"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{title}</span><p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p></Card>
}