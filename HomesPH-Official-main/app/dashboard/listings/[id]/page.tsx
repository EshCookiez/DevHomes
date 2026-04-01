import { notFound } from 'next/navigation'
import ListingEditPage from '@/components/listings/listing-edit-page'
import { getListingById } from '@/lib/listings-admin'

export default async function DashboardListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const listingId = Number(id)

  if (!Number.isFinite(listingId) || listingId <= 0) {
    notFound()
  }

  const listing = await getListingById(listingId)
  if (!listing) {
    notFound()
  }

  return <ListingEditPage initialBundle={listing} initialTab={query.tab} />
}