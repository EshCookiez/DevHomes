import { BarChart3, Building2, Home, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import ListingsTable from '@/components/listings/listings-table'
import { canPerformDashboardAction } from '@/lib/dashboard-permissions'
import {
  getListingDeveloperOptions,
  getListingProjectOptions,
  getListings,
  getListingUnitOptions,
  requireListingsAccess,
} from '@/lib/listings-admin'

export default async function DashboardListingsPage() {
  const user = await requireListingsAccess()

  const [listings, developers, projects, units] = await Promise.all([
    getListings(),
    getListingDeveloperOptions(),
    getListingProjectOptions(),
    getListingUnitOptions(),
  ])
  const canCreate = canPerformDashboardAction(user.roleSegment, 'listings', 'create', user.dashboardPermissions)
  const canEdit = canPerformDashboardAction(user.roleSegment, 'listings', 'edit', user.dashboardPermissions)
  const canDelete = canPerformDashboardAction(user.roleSegment, 'listings', 'delete', user.dashboardPermissions)
  const canManage = canPerformDashboardAction(user.roleSegment, 'listings', 'manage', user.dashboardPermissions)

  const publishedListings = listings.filter((listing) => listing.status === 'published').length
  const totalViews = listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)
  const featuredListings = listings.filter((listing) => listing.is_featured).length

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Property Listings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage listing inventory, gallery media, publication state, and commercial performance across projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Listings" value={listings.length} icon={Home} tone="blue" />
        <MetricCard title="Published" value={publishedListings} icon={Layers} tone="emerald" />
        <MetricCard title="Featured" value={featuredListings} icon={Building2} tone="amber" />
        <MetricCard title="Total Views" value={totalViews} icon={BarChart3} tone="slate" />
      </div>

      <ListingsTable initialListings={listings} developers={developers} projects={projects} units={units} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canManage={canManage} />
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: typeof Home; tone: 'blue' | 'emerald' | 'amber' | 'slate' }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone]

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 px-5 py-5">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon size={20} />
        </span>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}