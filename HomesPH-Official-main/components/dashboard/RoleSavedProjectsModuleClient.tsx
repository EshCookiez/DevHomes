'use client'

import { Building, FolderOpen, MapPin } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import type { SavedProjectRow } from '@/lib/role-dashboard-data'

export default function RoleSavedProjectsModuleClient({ title, description, items }: { title: string; description: string; items: SavedProjectRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Saved Projects" value={items.length} icon={FolderOpen} iconColor="text-amber-700" iconBg="bg-amber-50" />
        <KpiCard title="Developers Tracked" value={new Set(items.map((item) => item.developer_name).filter(Boolean)).size} icon={Building} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Markets Covered" value={new Set(items.map((item) => item.location)).size} icon={MapPin} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
      </div>

      <DataTable
        title="Saved Projects"
        data={items}
        columns={[
          { key: 'name', label: 'Project' },
          { key: 'developer_name', label: 'Developer', sortable: false, render: (value) => String(value ?? 'Unassigned developer') },
          { key: 'location', label: 'Location', sortable: false },
          { key: 'price_range_label', label: 'Price Range', sortable: false },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
        ]}
      />
    </div>
  )
}