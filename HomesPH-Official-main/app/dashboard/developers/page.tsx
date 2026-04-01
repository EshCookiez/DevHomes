import { Building2, FolderOpen, Globe2, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import DevelopersTable from '@/components/developers/developers-table'
import { getDevelopers, requireDevelopersAccess } from '@/lib/developers-admin'

export default async function DashboardDevelopersPage() {
  await requireDevelopersAccess()

  const developers = await getDevelopers()
  const activeDevelopers = developers.filter((developer) => developer.is_active).length
  const totalProjects = developers.reduce((sum, developer) => sum + developer.projectsCount, 0)
  const industries = new Set(developers.map((developer) => developer.industry).filter(Boolean)).size

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Developers Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage developer companies, team contacts, office locations, and linked project portfolios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Developers" value={developers.length} icon={Building2} tone="blue" />
        <MetricCard title="Active" value={activeDevelopers} icon={ShieldCheck} tone="emerald" />
        <MetricCard title="Projects" value={totalProjects} icon={FolderOpen} tone="amber" />
        <MetricCard title="Industries" value={industries} icon={Globe2} tone="slate" />
      </div>

      <DevelopersTable initialDevelopers={developers} />
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string
  value: number
  icon: typeof Building2
  tone: 'blue' | 'emerald' | 'amber' | 'slate'
}) {
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