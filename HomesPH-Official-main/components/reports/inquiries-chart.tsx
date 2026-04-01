'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import DashboardChart from '@/components/dashboard/DashboardChart'
import { Card } from '@/components/ui/card'
import type { ReportsPiePoint, ReportsSeriesPoint } from '@/lib/reports-types'

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0f766e']

export default function InquiriesChart({ byMonth, byProject, byListing }: { byMonth: ReportsSeriesPoint[]; byProject: ReportsPiePoint[]; byListing: ReportsPiePoint[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <DashboardChart title="Inquiries Per Month" subtitle="Monthly inbound inquiry volume" type="bar" data={byMonth.map((entry) => ({ label: entry.label, value: entry.value }))} dataKey="value" xKey="label" color="#2563eb" />
      <PiePanel title="Inquiries by Project" data={byProject} />
      <PiePanel title="Inquiries by Listing" data={byListing} />
    </div>
  )
}

function PiePanel({ title, data }: { title: string; data: ReportsPiePoint[] }) {
  return (
    <Card className="border-slate-200 p-5 shadow-sm">
      <p className="mb-4 text-sm font-bold text-slate-900">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data.map((entry) => ({ name: entry.label, value: entry.value }))} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92} paddingAngle={2}>
            {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}