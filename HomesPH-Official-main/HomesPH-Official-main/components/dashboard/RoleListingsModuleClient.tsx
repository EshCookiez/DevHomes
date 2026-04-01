'use client'

import { Eye, Home, MessageSquare, Plus, ShieldCheck, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { getActionPermissionLabel, type DashboardActionPermissions } from '@/lib/dashboard-permissions'
import type { ListingListRecord } from '@/lib/listings-types'

export default function RoleListingsModuleClient({
  title,
  description,
  listings,
  actions,
}: {
  title: string
  description: string
  listings: ListingListRecord[]
  actions: DashboardActionPermissions
}) {
  const permissionLabel = getActionPermissionLabel(actions)

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {permissionLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <Button type="button" disabled={!actions.create} className="gap-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] disabled:bg-slate-200 disabled:text-slate-500">
          <Plus size={15} />
          Create Listing
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Visible Listings" value={listings.length} icon={Home} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Featured" value={listings.filter((listing) => Boolean(listing.is_featured)).length} icon={Star} iconColor="text-amber-700" iconBg="bg-amber-50" />
        <KpiCard title="Views" value={listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)} icon={Eye} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
        <KpiCard title="Inquiries" value={listings.reduce((sum, listing) => sum + (listing.inquiries_count ?? 0), 0)} icon={MessageSquare} iconColor="text-slate-700" iconBg="bg-slate-100" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Can View" value={actions.view ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Can Create" value={actions.create ? 'Yes' : 'No'} icon={Plus} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
        <KpiCard title="Can Edit" value={actions.edit ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-amber-700" iconBg="bg-amber-50" />
        <KpiCard title="Can Delete" value={actions.delete ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-slate-700" iconBg="bg-slate-100" />
      </div>

      <DataTable
        title="Listings"
        data={listings.map((listing) => ({
          title: listing.title,
          project: listing.project_name ?? 'Unassigned',
          type: listing.listing_type ?? 'Unknown',
          price: listing.price ? `${listing.currency ?? 'PHP'} ${Number(listing.price).toLocaleString()}` : 'Price on request',
          status: listing.status ?? 'Draft',
        }))}
        columns={[
          { key: 'title', label: 'Listing' },
          { key: 'project', label: 'Project' },
          { key: 'type', label: 'Type' },
          { key: 'price', label: 'Price', sortable: false },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
        ]}
      />
    </div>
  )
}