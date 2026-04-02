import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { getPublicProjects } from '@/lib/projects-public'
import AdBanner from '@/components/ui/AdBanner'
import { MapPin, BedDouble, Bath, Heart, Share2, Mail, Phone, MessageCircle, ChevronLeft, ChevronRight, LayoutList, Map, Bell, SearchX } from 'lucide-react'
import UnifiedListingCard from '@/components/listings/UnifiedListingCard'
import SearchFilter from '@/components/projects/SearchFilter'
import SortDropdown from '@/components/projects/SortDropdown'
import ProjectMapView from '@/components/projects/ProjectMapView'
import ViewToggle from '@/components/projects/ViewToggle'
import PropertyHeader from '@/components/listings/PropertyHeader'
import ListingSidebar from '@/components/listings/ListingSidebar'
import React from 'react'

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : null
const fmtRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request'
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max) ?? 'Price on request'
}

export default async function ProjectsPage(
  props: { searchParams?: Promise<{ q?: string; location?: string; status?: string; type?: string; beds?: string; baths?: string; priceMin?: string; priceMax?: string; areaMin?: string; areaMax?: string; keywords?: string; agent?: string; tourTypes?: string; contract?: string; view?: string; sort?: string }> }
) {
  const sp = (await props.searchParams) ?? {}
  const settings = await getSiteSettings()

  const allProjects = await getPublicProjects()

  let projects = [...allProjects]

  if (sp.q) {
    const query = sp.q.toLowerCase().trim()
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.city_municipality?.toLowerCase().includes(query) ||
      p.province?.toLowerCase().includes(query) ||
      p.project_type?.toLowerCase().includes(query) ||
      p.developers_profiles?.developer_name.toLowerCase().includes(query) ||
      p.project_amenities?.some(pa => pa.amenities?.name.toLowerCase().includes(query))
    )
  }

  // Keywords Filtering
  if (sp.keywords) {
    const kw = sp.keywords.toLowerCase().trim()
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.city_municipality?.toLowerCase().includes(kw) ||
      p.province?.toLowerCase().includes(kw) ||
      p.project_amenities?.some(pa => pa.amenities?.name.toLowerCase().includes(kw))
    )
  }

  // Agent (Developer) Filtering
  if (sp.agent) {
    const ag = sp.agent.toLowerCase().trim()
    projects = projects.filter(p =>
      p.developers_profiles?.developer_name.toLowerCase().includes(ag)
    )
  }

  // Tour Types Filtering
  if (sp.tourTypes) {
    const tours = sp.tourTypes.split(',')
    projects = projects.filter(p => {
      if (tours.includes('Video Tours') && p.video_tour_url) return true
      if (tours.includes('360° Tours') && p.video_tour_url) return true // Placeholder
      return false
    })
  }

  if (sp.location) {
    const loc = sp.location.toLowerCase()
    projects = projects.filter(p =>
      p.province?.toLowerCase().includes(loc) ||
      p.city_municipality?.toLowerCase().includes(loc)
    )
  }
  if (sp.status) projects = projects.filter(p => p.status === sp.status)

  // Property Type Filtering
  if (sp.type) {
    const selectedTypes = sp.type.toLowerCase().split(',')
    projects = projects.filter(p => 
      p.project_type && selectedTypes.some(t => p.project_type!.toLowerCase().includes(t))
    )
  }

  // Beds Filtering
  if (sp.beds) {
    const selectedBeds = sp.beds.split(',')
    projects = projects.filter(p =>
      p.project_units?.some(u => {
        const beds = u.bedrooms || 0
        return selectedBeds.some(opt => {
          if (opt === 'Studio') return beds === 0
          if (opt === '6+') return beds >= 6
          const num = parseInt(opt)
          return beds === num
        })
      })
    )
  }

  // Baths Filtering
  if (sp.baths) {
    const selectedBaths = sp.baths.split(',')
    projects = projects.filter(p =>
      p.project_units?.some(u => {
        const baths = u.bathrooms || 0
        return selectedBaths.some(opt => {
          if (opt === '6+') return baths >= 6
          const num = parseInt(opt)
          return baths === num
        })
      })
    )
  }

  // Price Filtering
  if (sp.priceMin) {
    const min = parseInt(sp.priceMin)
    projects = projects.filter(p => (p.price_range_min || 0) >= min)
  }
  if (sp.priceMax) {
    const max = parseInt(sp.priceMax)
    projects = projects.filter(p => (p.price_range_min || 0) <= max)
  }

  // Area Filtering
  if (sp.areaMin || sp.areaMax) {
    const amin = sp.areaMin ? parseInt(sp.areaMin) : 0
    const amax = sp.areaMax ? parseInt(sp.areaMax) : Infinity
    projects = projects.filter(p =>
      p.project_units?.some(u => (u.floor_area_sqm || 0) >= amin && (u.floor_area_sqm || 0) <= amax)
    )
  }

  // Sorting Logic
  if (sp.sort === 'price-low') {
    projects.sort((a, b) => (a.price_range_min || 0) - (b.price_range_min || 0))
  } else if (sp.sort === 'price-high') {
    projects.sort((a, b) => (b.price_range_min || 0) - (a.price_range_min || 0))
  } else if (sp.sort === 'newest') {
    projects.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }

  // Calculate top 3 locations for the filter bar
  const locationStats = allProjects.reduce((acc, p) => {
    const loc = p.city_municipality || p.province
    if (loc) acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Helper for generating query strings
  const getHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(sp).forEach(([k, v]) => { if (v) params.set(k, v) })
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined) params.delete(k)
      else params.set(k, v)
    })
    return `?${params.toString()}`
  }

  const getSortLabel = (s?: string) => {
    if (s === 'price-low') return 'Price: Low to High'
    if (s === 'price-high') return 'Price: High to Low'
    return 'Popular'
  }

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <div className="bg-white border-b border-gray-100 py-6 w-full relative z-20 overflow-visible min-h-fit">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px]">
          <SearchFilter />
        </div>
      </div>

      <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px] py-8">
        {(sp.view === 'map' || (Array.isArray(sp.view) && sp.view.includes('map'))) ? (
          <ProjectMapView
            projects={projects}
            searchParams={Object.fromEntries(Object.entries(sp).filter(([_, v]) => v !== undefined)) as Record<string, string>}
          />
        ) : (
          /* ── Main Content Area (Standard List View) ── */
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {/* ── Property Header Section ── */}
              <div className="w-full max-w-[1326px]" style={{ marginBottom: '20px' }}>
                <PropertyHeader
                  breadcrumbPrefix="For Sale:"
                  breadcrumbLinkHref="/projects"
                  title="Projects for sale in Philippines"
                  topLocations={topLocations.map(([loc, count]) => ({
                    name: loc,
                    count,
                    href: getHref({ location: loc })
                  }))}
                  viewAllHref={getHref({ location: undefined })}
                  selectedLocation={sp.location}
                />
              </div>


              {/* ── Projects List ── */}
              <style dangerouslySetInnerHTML={{ __html: `
                .listing-card-interactive {
                  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
                  cursor: pointer;
                  text-decoration: none;
                  color: inherit;
                }
                .listing-card-interactive:hover {
                  transform: translateY(-8px);
                  box-shadow: 0px 20px 40px rgba(0, 33, 67, 0.12);
                  z-index: 50 !important;
                }
              `}} />
              <div className="flex flex-col" style={{ gap: '20px' }}>
                {projects.map(p => {
                  const unitGroups = p.project_units && p.project_units.length > 0
                    ? Array.from(new Set(p.project_units.map(u => u.unit_type))).map(typeName => {
                        const count = p.project_units?.filter(u => u.unit_type === typeName).length || 0
                        const isPlural = count > 1
                        const displayType = isPlural && !typeName.toLowerCase().includes('bedroom') && !typeName.toLowerCase().includes('studio') ? `${typeName}s` : typeName
                        return { count, typeName: displayType }
                      })
                    : []

                  return (
                    <UnifiedListingCard
                      key={p.id}
                      variant="projects"
                      href={`/projects/${p.slug}`}
                      imageUrl={p.main_image_url ?? `https://picsum.photos/seed/${p.slug}/900/600`}
                      developerLogoUrl={p.developers_profiles?.logo_url ?? undefined}
                      developerName={p.developers_profiles?.developer_name}
                      location={`${p.city_municipality}, ${p.province}, Philippines`}
                      projectName={p.name}
                      projectType={p.project_type ?? ''}
                      availableUnits={unitGroups}
                      className="listing-card-interactive"
                    />
                  )
                })}
              </div>

              {projects.length === 0 && (
                <div className="bg-white rounded-[20px] border border-[#D3D3D3] p-20 flex flex-col items-center text-center shadow-sm max-w-[995px] mx-auto lg:mx-0">
                  <div className="w-24 h-24 bg-[#F4F4F9] rounded-full flex items-center justify-center mb-8">
                    <SearchX size={48} className="text-[#8187B0]" />
                  </div>
                  <h3 className="text-[28px] font-normal text-[#002143] mb-3 font-outfit">Oops! No properties found</h3>
                  <p className="text-[18px] font-light text-[#002143]/60 mb-10 max-w-md font-outfit">
                    We couldn't find any projects matching your current filters. Try adjusting your search criteria or clearing all filters.
                  </p>
                  <Link 
                    href="/projects" 
                    className="h-[55px] px-10 flex items-center justify-center bg-[#1428AE] text-white rounded-[10px] font-medium text-[18px] hover:bg-[#001392] transition-all shadow-md hover:shadow-lg font-outfit"
                  >
                    Clear All Filters
                  </Link>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <ListingSidebar />
          </div>
        )}
      </main>

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
