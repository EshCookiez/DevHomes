import { notFound } from 'next/navigation'
import DeveloperProfile from '@/components/developers/developer-profile'
import { getDeveloperById } from '@/lib/developers-admin'

export default async function DashboardDeveloperDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const developerId = Number(id)

  if (!Number.isFinite(developerId) || developerId <= 0) {
    notFound()
  }

  const bundle = await getDeveloperById(developerId)

  if (!bundle) {
    notFound()
  }

  return <DeveloperProfile initialBundle={bundle} initialTab={query.tab} />
}