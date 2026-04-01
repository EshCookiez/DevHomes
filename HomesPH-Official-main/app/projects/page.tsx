import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { getPublicProjects } from '@/lib/projects-public'
import AdBanner from '@/components/ui/AdBanner'
import { MapPin, BedDouble, Bath, Heart, Share2, Mail, Phone, MessageCircle, ChevronLeft, ChevronRight, LayoutList, Map, Bell, SearchX } from 'lucide-react'
import SearchFilter from '@/components/projects/SearchFilter'
import SortDropdown from '@/components/projects/SortDropdown'
import ProjectMapView from '@/components/projects/ProjectMapView'
import ViewToggle from '@/components/projects/ViewToggle'
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

      {/* ── Search Bar Section ── */}
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
              <div className="mb-10">
                <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-5 font-medium uppercase tracking-wider">
                  <span className="text-[#002143]">For Sale:</span>
                  <Link href="/projects" className="text-[#002143] hover:text-[#002143] transition-colors">Philippine Properties</Link>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <h1 className="text-[35px] text-[#002143] tracking-tight font-outfit font-normal">
                    Properties for sale in Philippines
                  </h1>

                  <div className="flex items-center gap-3 shrink-0">
                    <SortDropdown />

                    {/* View Toggle */}
                    <ViewToggle />
                  </div>
                </div>

                {/* Location Filters Bar */}
                <div className="bg-white rounded-[10px] border border-[#D3D3D3] px-5 flex flex-col md:flex-row items-center justify-between gap-4 h-auto md:h-[65px]">
                  <div className="flex flex-wrap items-center gap-x-12 gap-y-2 text-[18px] font-light text-[#1428ae] font-outfit">
                    {topLocations.map(([loc, count]) => (
                      <Link
                        key={loc}
                        href={getHref({ location: loc })}
                        className={`hover:underline ${sp.location === loc ? 'font-medium underline' : ''}`}
                      >
                        {loc} <span className="text-[#002143] ml-1.5">({count.toLocaleString()})</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={getHref({ location: undefined })}
                    className="text-[18px] font-medium text-[#1428ae] hover:underline uppercase tracking-widest shrink-0 font-outfit"
                  >
                    VIEW ALL LOCATIONS
                  </Link>
                </div>
              </div>


              {/* ── Projects List ── */}
              <div className="flex flex-col gap-6">
                {projects.map(p => {
                  const bedrooms = Math.max(...(p.project_units?.map(u => u.bedrooms ?? 0) ?? [0]))
                  const bathrooms = Math.max(...(p.project_units?.map(u => u.bathrooms ?? 0) ?? [0]))
                  const maxArea = Math.max(...(p.project_units?.map(u => u.floor_area_sqm ?? 0) ?? [0]))

                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden h-auto md:h-[316px] md:w-[995px] mx-auto lg:mx-0"
                    >
                      {/* Left Image Side */}
                      <div className="relative w-full md:w-[45%] h-64 md:h-full shrink-0 p-4">
                        <img
                          src={p.main_image_url ?? `https://picsum.photos/seed/${p.slug}/900/600`}
                          alt={p.name}
                          className="w-full h-full object-cover rounded-2xl"
                        />

                        {/* Dots at bottom */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                          <div className="w-2 h-2 rounded-full bg-white shadow-sm"></div>
                          <div className="w-2 h-2 rounded-full bg-white/50"></div>
                          <div className="w-2 h-2 rounded-full bg-white/50"></div>
                          <div className="w-2 h-2 rounded-full bg-white/50"></div>
                        </div>
                        {/* Favorite and Share icons at bottom right */}
                        <div className="absolute bottom-8 right-8 flex gap-4 text-white">
                          <Heart size={24} className="hover:text-red-500 transition-colors drop-shadow-lg cursor-pointer" />
                          <Share2 size={24} className="hover:text-blue-400 transition-colors drop-shadow-lg cursor-pointer" />
                        </div>
                      </div>

                      {/* Right Content Side */}
                      <div className="w-full md:w-[55%] p-8 flex flex-col relative">
                        {/* Dev Logo */}
                        <div className="absolute top-8 right-8 h-8 w-24">
                          <img
                            src={p.developers_profiles?.logo_url || "https://picsum.photos/seed/dev/200/50"}
                            className="h-full w-full object-contain object-right"
                            alt="developer logo"
                          />
                        </div>

                        {/* Name & Type */}
                        <div className="mb-6">
                          <h3 className="text-[#002143] text-[25px] font-medium leading-tight mb-1">{p.name}</h3>
                          <p className="text-[#002143] text-[15px] font-light">{p.project_type}</p>
                        </div>

                        {/* Available Units */}
                        <div className="mb-4">
                          <p className="text-[#002143] text-[15px] font-light mb-2 tracking-wide">Available Units:</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#1428AE] text-[15px] font-light">
                            {p.project_units && p.project_units.length > 0 ? (
                              Array.from(new Set(p.project_units.map(u => u.unit_type))).map((typeName, idx, arr) => {
                                const units = p.project_units?.filter(u => u.unit_type === typeName) || [];
                                const count = units.length;
                                const isPlural = count > 1;
                                const displayType = isPlural && !typeName.toLowerCase().includes('bedroom') && !typeName.toLowerCase().includes('studio') ? `${typeName}s` : typeName;

                                return (
                                  <React.Fragment key={typeName}>
                                    <span>{count} {displayType}</span>
                                    {idx < arr.length - 1 && <span className="text-gray-300">|</span>}
                                  </React.Fragment>
                                );
                              })
                            ) : (
                              <span className="text-gray-400 italic">No units listed</span>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-[#002143] text-[15px] mb-4 font-light">
                          <MapPin size={22} className="text-[#002143] shrink-0" />
                          <span>{p.city_municipality}, {p.province}, Philippines</span>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[10px] bg-[#DFE1FF] text-[#1428AE] font-regular text-[18px] hover:bg-[#D8E2FF] transition-colors">
                            <Mail size={18} /> Email
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[10px] bg-[#DFE3FF] text-[#1428AE] font-regular text-[18px] hover:bg-[#D8E2FF] transition-colors">
                            <Phone size={18} /> Call
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[10px] bg-[#E1FFDF] text-[#00A629] font-regular text-[18px] hover:bg-[#D8F0DA] transition-colors">
                            <MessageCircle size={18} /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </Link>
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

            {/* ── Sidebar Ads ── */}
            <div className="hidden lg:flex flex-col gap-6 w-[300px] shrink-0">
              <div className="sticky top-24 space-y-6">
                <AdBanner sizes={['300x250']} />

                {/* Property ALERT button */}
                <button className="w-[300px] h-[56px] border border-[#1428AE] rounded-[10px] flex items-center justify-center gap-3 text-[#1428AE] hover:bg-blue-50 transition-all group">
                  <Bell size={25} className="fill-[#1428AE] text-[#1428AE]" />
                  <span className="text-[15px] font-outfit font-normal">ALERT ME OF NEW PROPERTIES</span>
                </button>

                {/* Recommended searches */}
                <div>
                  <div className="w-full h-[35px] bg-[#F4F4F9] rounded-[5px] flex items-center px-4 mb-4">
                    <span className="text-[#002143] text-[18px] font-outfit font-normal">Recommended searches</span>
                  </div>
                  <div className="flex flex-col gap-3.5 px-4">
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">1 Bedroom Properties for rent in Quezon City</Link>
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">2 Bedroom Properties for rent in Quezon City</Link>
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">Apartments for rent in Quezon City</Link>
                    <Link href="#" className="text-[#1428AE] text-[16px] font-outfit font-medium hover:underline mt-2">View More</Link>
                  </div>
                </div>

                {/* Useful Links */}
                <div>
                  <div className="w-full h-[35px] bg-[#F4F4F9] rounded-[5px] flex items-center px-4 mb-4">
                    <span className="text-[#002143] text-[18px] font-outfit font-normal">Useful Links</span>
                  </div>
                  <div className="flex flex-col gap-3.5 px-4">
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">Apartments for rent in the Philippines</Link>
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">Apartment for sale in the Philippines</Link>
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">Hotel Apartment for rent in the Philippines</Link>
                    <Link href="#" className="text-[#002143] text-[15px] font-outfit font-light hover:underline">Villa Compound for sale in the Philippines</Link>
                  </div>
                </div>

                {/* Custom ADS Section */}
                <div className="flex flex-col items-center">
                  <AdBanner sizes={['300x600']} />
                </div>
              </div>
            </div>
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
