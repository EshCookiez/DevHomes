import { notFound } from 'next/navigation'
import ProjectEditPage from '@/components/projects/project-edit-page'
import { getProjectById } from '@/lib/projects-admin'

export default async function DashboardProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const projectId = Number(id)

  if (!Number.isFinite(projectId) || projectId <= 0) {
    notFound()
  }

  const project = await getProjectById(projectId)

  if (!project) {
    notFound()
  }

  return <ProjectEditPage initialBundle={project} initialTab={query.tab} />
}