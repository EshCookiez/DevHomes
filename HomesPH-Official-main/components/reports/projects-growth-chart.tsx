'use client'

import DashboardChart from '@/components/dashboard/DashboardChart'
import type { ReportsSeriesPoint } from '@/lib/reports-types'

export default function ProjectsGrowthChart({ projects, listings }: { projects: ReportsSeriesPoint[]; listings: ReportsSeriesPoint[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DashboardChart title="Projects Created Per Month" subtitle="New projects over time" type="bar" data={projects.map((entry) => ({ label: entry.label, value: entry.value }))} dataKey="value" xKey="label" color="#0f766e" />
      <DashboardChart title="Listings Created Per Month" subtitle="New property listings over time" type="bar" data={listings.map((entry) => ({ label: entry.label, value: entry.value }))} dataKey="value" xKey="label" color="#7c3aed" />
    </div>
  )
}