import { notFound } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { getListingBySlug, getRecommendedListings } from '@/lib/property-search'
import { getArticles } from '@/lib/hybrid-articles'
import ListingDetailClient from '@/components/listings/ListingDetailClient'

export default async function RentListingBySlugPage({
  params,
}: {
  params: Promise<{ location: string; slug: string }>
}) {
  const { location, slug } = await params
  const settings = await getSiteSettings()

  const listingData = await getListingBySlug('rent', slug, location)
  if (!listingData) notFound()

  const listing = listingData as any

  const [recommended, newsResult] = await Promise.all([
    getRecommendedListings(listing.id, listing.projects?.id ?? null, 3),
    getArticles({ per_page: 5 }).catch(() => ({ data: [] as any[] })),
  ])

  const news = (newsResult as any)?.data?.data ?? []

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <ListingDetailClient
        listing={listing}
        recommended={recommended}
        news={news}
      />

      <SiteFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        brandName={settings.siteTitle}
      />
    </div>
  )
}
