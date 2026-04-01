import { redirect } from 'next/navigation'
import { buildNewsHref } from '@/lib/news-navigation'

export default async function LegacyLocationNewsPage({
  params,
}: {
  params: Promise<{ location: string }>
}) {
  const { location } = await params
  redirect(buildNewsHref(location))
}
