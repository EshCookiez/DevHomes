import type { Metadata } from 'next'

import LocationHero from '../../components/location/LocationHero'
import LocationDiscoverySection from '../../components/location/LocationDiscoverySection'
import LocationJourneySection from '../../components/location/LocationJourneySection'
import LocationNewsBusinessSection from '../../components/location/LocationNewsBusinessSection'
import SiteFooter from '../../components/layout/SiteFooter'
import { MOCK_PROJECTS } from '../../lib/mock-data'
import { getSiteSettings } from '../../lib/site-settings'
import { getArticles as getArticlesFromAPI } from '../../lib/hybrid-articles'

interface LocationPageParams {
  location?: string
}

interface LocationPageProps {
  params: LocationPageParams | Promise<LocationPageParams>
}

const formatLocationName = (value: string) =>
  decodeURIComponent(value)
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

const normalizeSlug = (value?: string) => {
  if (!value) return 'location'
  const cleaned = value.trim().toLowerCase()
  if (cleaned === 'undefined' || cleaned === 'null') return 'location'
  return cleaned
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const slug = normalizeSlug(resolvedParams.location)
  const name = formatLocationName(slug)

  return {
    title: `${name} Real Estate | HomesPH`,
    description: `Explore properties, homes, and investment opportunities in ${name}, Philippines.`,
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const resolvedParams = await params
  const locationSlug = normalizeSlug(resolvedParams.location)
  const locationName = formatLocationName(locationSlug)
  const settings = await getSiteSettings()

  const matchesLocation = (value?: string | null) =>
    value?.toLowerCase().includes(locationSlug.replace(/-/g, ' ')) ?? false

  const locationProjects = MOCK_PROJECTS.filter(
    (project) =>
      matchesLocation(project.province) ||
      matchesLocation(project.city_municipality) ||
      matchesLocation(project.barangay) ||
      matchesLocation(project.island_group)
  )

  const heroImage = locationProjects[0]?.main_image_url ?? null

  // Fetch real news articles for the carousel
  let newsArticles: Array<{
    id: number | string
    title: string
    slug?: string
    image_url?: string
    excerpt?: string
    category?: string
    author?: string
    published_at: string
    tags?: string[]
    city_slug?: string | null
  }> = []
  try {
    const result = await getArticlesFromAPI({
      per_page: 20,
      page: 1,
    })
    newsArticles = result.data.data.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      image_url: article.image,
      excerpt: article.summary ?? article.description,
      category: article.category,
      author: article.author,
      published_at: article.published_at,
      tags: article.topics ?? [],
      city_slug: article.city_slug || null,
    }))
  } catch (error) {
    console.error('[LocationPage] Failed to fetch news articles:', error)
  }

  const heroQuickLinks = [
    { label: 'Buy', href: `/${locationSlug}/buy` },
    { label: 'Rent', href: `/${locationSlug}/rent` },
    { label: 'Projects', href: `/${locationSlug}/projects` },
    { label: 'Developers', href: '/developers' },
  ]
  return (
    <div className="min-h-screen bg-white">
      <LocationHero
        brandName={settings.siteTitle}
        heroImage={heroImage}
        locationName={locationName}
        locationSlug={locationSlug}
        logoUrl={settings.logoUrl}
        quickLinks={heroQuickLinks}
      />

      <LocationDiscoverySection locationName={locationName} locationSlug={locationSlug} />
      <LocationJourneySection locationName={locationName} locationSlug={locationSlug} />
      <LocationNewsBusinessSection
        locationName={locationName}
        locationSlug={locationSlug}
        articles={newsArticles}
      />

      <SiteFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        brandName={settings.siteTitle}
        showQuickLinks={false}
      />
    </div>
  )
}
