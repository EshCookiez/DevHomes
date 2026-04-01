'use client'

import DashboardChart from '@/components/dashboard/DashboardChart'
import type { ReportsSeriesPoint } from '@/lib/reports-types'

export default function UserGrowthChart({ data }: { data: ReportsSeriesPoint[] }) {
  return <DashboardChart title="User Registrations Per Month" subtitle="Growth across the selected reporting window" type="area" data={data.map((entry) => ({ label: entry.label, value: entry.value }))} dataKey="value" xKey="label" color="#2563eb" />
}