'use client'

import { Heart, Home, MapPin } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import type { SavedListingRow } from '@/lib/role-dashboard-data'

export default function RoleSavedListingsModuleClient({ title, description, items }: { title: string; description: string; items: SavedListingRow[] }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Saved Listings" value={items.length} icon={Heart} iconColor="text-rose-700" iconBg="bg-rose-50" />
        <KpiCard title="Active Projects" value={new Set(items.map((item) => item.project_name).filter(Boolean)).size} icon={Home} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Tracked Markets" value={new Set(items.map((item) => item.location)).size} icon={MapPin} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
      </div>

      <DataTable
        title="Saved Listings"
        data={items}
        columns={[
          { key: 'title', label: 'Listing' },
          { key: 'location', label: 'Location', sortable: false },
          { key: 'price_label', label: 'Price', sortable: false },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
        ]}
      />
    </div>
  )
}