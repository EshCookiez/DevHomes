'use client'

import { Building2, FolderOpen, MapPin, Plus, ShieldCheck, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { getActionPermissionLabel, type DashboardActionPermissions } from '@/lib/dashboard-permissions'
import type { ProjectListRecord } from '@/lib/projects-types'

export default function RoleProjectsModuleClient({
  title,
  description,
  projects,
  actions,
}: {
  title: string
  description: string
  projects: ProjectListRecord[]
  actions: DashboardActionPermissions
}) {
  const locationCount = new Set(projects.map((project) => `${project.city_municipality ?? ''}|${project.province ?? ''}`).filter(Boolean)).size
  const activeCount = projects.filter((project) => (project.status ?? '').toLowerCase() === 'active').length
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
          Create Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Visible Projects" value={projects.length} icon={FolderOpen} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Active" value={activeCount} icon={TrendingUp} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
        <KpiCard title="Markets" value={locationCount} icon={MapPin} iconColor="text-amber-700" iconBg="bg-amber-50" />
        <KpiCard title="Developers" value={new Set(projects.map((project) => project.developer_name).filter(Boolean)).size} icon={Building2} iconColor="text-slate-700" iconBg="bg-slate-100" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Can View" value={actions.view ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard title="Can Create" value={actions.create ? 'Yes' : 'No'} icon={Plus} iconColor="text-emerald-700" iconBg="bg-emerald-50" />
        <KpiCard title="Can Edit" value={actions.edit ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-amber-700" iconBg="bg-amber-50" />
        <KpiCard title="Can Delete" value={actions.delete ? 'Yes' : 'No'} icon={ShieldCheck} iconColor="text-slate-700" iconBg="bg-slate-100" />
      </div>

      <DataTable
        title="Projects"
        data={projects.map((project) => ({
          name: project.name,
          developer: project.developer_name ?? 'Unassigned',
          location: [project.city_municipality, project.province].filter(Boolean).join(', ') || 'Unassigned',
          price: project.price_range_min ? `${project.currency ?? 'PHP'} ${Number(project.price_range_min).toLocaleString()}` : 'Price on request',
          status: project.status ?? 'Draft',
        }))}
        columns={[
          { key: 'name', label: 'Project' },
          { key: 'developer', label: 'Developer' },
          { key: 'location', label: 'Location', sortable: false },
          { key: 'price', label: 'Starting Price', sortable: false },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
        ]}
      />
    </div>
  )
}