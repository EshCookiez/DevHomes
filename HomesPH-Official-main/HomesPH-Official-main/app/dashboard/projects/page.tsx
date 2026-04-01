import { Building2, FolderOpen, MapPin, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import ProjectsTable from '@/components/projects/projects-table'
import { canPerformDashboardAction } from '@/lib/dashboard-permissions'
import { getDeveloperOptions, getProjects, requireProjectsAccess } from '@/lib/projects-admin'

export default async function DashboardProjectsPage() {
  const user = await requireProjectsAccess()

  const [projects, developers] = await Promise.all([
    getProjects(),
    getDeveloperOptions(),
  ])
  const canCreate = canPerformDashboardAction(user.roleSegment, 'projects', 'create', user.dashboardPermissions)
  const canEdit = canPerformDashboardAction(user.roleSegment, 'projects', 'edit', user.dashboardPermissions)
  const canDelete = canPerformDashboardAction(user.roleSegment, 'projects', 'delete', user.dashboardPermissions)
  const canManage = canPerformDashboardAction(user.roleSegment, 'projects', 'manage', user.dashboardPermissions)

  const featuredCount = projects.filter((project) => project.main_image_url).length
  const locations = new Set(projects.map((project) => [project.city_municipality, project.province].filter(Boolean).join(', ')).filter(Boolean)).size

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Projects Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage project overviews, pricing, developer assignments, units, galleries, documents, and FAQs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Projects" value={projects.length} icon={FolderOpen} tone="blue" />
        <MetricCard title="Developers" value={developers.length} icon={Building2} tone="emerald" />
        <MetricCard title="Locations" value={locations} icon={MapPin} tone="amber" />
        <MetricCard title="With Main Media" value={featuredCount} icon={Sparkles} tone="slate" />
      </div>

      <ProjectsTable initialProjects={projects} developers={developers} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canManage={canManage} />
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: typeof FolderOpen; tone: 'blue' | 'emerald' | 'amber' | 'slate' }) {
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