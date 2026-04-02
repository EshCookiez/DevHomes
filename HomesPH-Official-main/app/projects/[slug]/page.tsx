import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import InquiryForm from '@/components/listings/InquiryForm'
import { MOCK_PROJECTS } from '@/lib/mock-data'
import ListingSidebar from '@/components/listings/ListingSidebar'
import SearchFilter from '@/components/projects/SearchFilter'
import ProjectListingsSection from '@/components/projects/ProjectListingsSection'
import { MapPin, Star, Check, ChevronRight, Coins, Layout, Info, Heart, Share2, ChevronDown, LayoutList, Map as MapIcon, Phone, Mail, Bell, MessageSquareMore, ListFilter } from 'lucide-react'
import React from 'react'
import { getProjectBySlug, getListingsByProjectId } from '@/lib/db-queries'
import AdBanner from '@/components/ui/AdBanner'

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : null
const fmtRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request'
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max) ?? 'Price on request'
}

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ view?: string }>
}) {
  const { slug } = await params
  const { view } = await searchParams
  const isMapView = view === 'map'
  const settings = await getSiteSettings()

  let project = await getProjectBySlug(slug)

  // Fallback to mock data if not found in db
  if (!project) {
    project = MOCK_PROJECTS.find(p => p.slug === slug)
  }

  if (!project) notFound()

  const projectListings = await getListingsByProjectId(project.id)

  const saleListings = projectListings.filter(l => l.listing_type === 'sale')
  const rentListings = projectListings.filter(l => l.listing_type === 'rent')
  const sortedGallery = [...(project.project_galleries ?? [])].sort((a, b) => a.display_order - b.display_order)
  const amenities = (project.project_amenities ?? []).map((pa: any) => pa.amenities).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      {/* ── Search Bar Section ── */}
      <div className="bg-white border-b border-[#D3D3D3] py-6 w-full">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px]">
          <SearchFilter />
        </div>
      </div>

      <div className="relative overflow-hidden bg-white">
        <div
          className="absolute inset-x-0 top-0 h-[727px] pointer-events-none max-w-[1920px] mx-auto"
          style={{ background: 'linear-gradient(180deg, rgba(239, 241, 255, 0.8) 0%, #FFFFFF 100%)' }}
        />
        <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px] py-10 space-y-8 relative z-10 font-outfit">
          {!isMapView && (
            <>
              {/* ── Breadcrumbs ── */}
              <nav className="flex items-center gap-3 text-[16px] text-[#002143] font-light mb-8">
                <span className="shrink-0">For Sale:</span>
                <Link href="/projects" className="text-[#001392] hover:underline">Philippine Projects</Link>
                <ChevronRight size={14} className="text-[#002143]" />
                <Link
                  href={`/developers/${project.developers_profiles?.developer_name ? project.developers_profiles.developer_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : project.developers_profiles?.id}`}
                  className="text-[#001392] hover:underline"
                >
                  {project.developers_profiles?.developer_name}
                </Link>
                <ChevronRight size={14} className="text-[#002143]" />
                <span className="font-light">{project.name}</span>
              </nav>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* ── Left Content ── */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h1 className="text-[40px] font-normal text-[#002143] leading-none mb-1">{project.name}</h1>
                    <p className="text-[20px] font-light text-[#002143]">{project.project_type}s</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-[#1428AE] text-white text-[13px] px-4 py-1.5 rounded-[3px] min-w-[66px] text-center">Studio</span>
                    <span className="bg-[#0099C8] text-white text-[13px] px-4 py-1.5 rounded-[3px] min-w-[96px] text-center">1 Bathroom</span>
                    <span className="bg-[#00AB89] text-white text-[13px] px-4 py-1.5 rounded-[3px] min-w-[117px] text-center text-nowrap">
                      Area: {Math.max(...(project.project_units?.map((u: any) => u.floor_area_sqm) ?? [0]))} sqft
                    </span>
                    <div className="flex items-center gap-2 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#002143]" />
                      <span className="text-[13px] font-light text-[#002143]">By {project.developers_profiles?.developer_name}</span>
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="bg-white w-fit max-w-full min-h-[103px] rounded-[10px] border border-[#D3D3D3] p-5 md:pr-10 shadow-sm">
                    <div className="flex justify-start items-stretch gap-8 md:gap-12">
                      {/* Amenities */}
                      <div className="pr-2">
                        <h3 className="text-[15px] font-normal text-[#002143] mb-2.5">Amenities</h3>
                        <div className="grid grid-cols-[auto_auto] w-fit gap-x-12 gap-y-[9px]">
                          {amenities.slice(0, 4).map((a: any) => (
                            <div key={a.id} className="flex items-center gap-1.5 whitespace-nowrap">
                              <Check size={14} strokeWidth={3} className="text-[#1428AE] shrink-0" />
                              <span className="text-[10px] font-light text-[#002143]">{a.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Furnishing */}
                      <div className="border-l border-gray-200 pl-4 md:pl-6 flex flex-col justify-start">
                        <h3 className="text-[15px] font-normal text-[#002143] mb-2.5">Furnishing</h3>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Check size={14} strokeWidth={3} className="text-[#1428AE] shrink-0" />
                          <span className="text-[10px] font-light text-[#002143]">Fully Furnished</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="border-l border-gray-200 pl-4 md:pl-6 flex flex-col justify-start">
                        <h3 className="text-[15px] font-normal text-[#002143] mb-2.5">Rating</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3].map(i => <Star key={i} size={14} fill="#1428AE" className="text-[#1428AE]" strokeWidth={0} />)}
                          {[4, 5].map(i => <Star key={i} size={14} fill="#DFE3FF" className="text-[#DFE3FF]" strokeWidth={0} />)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4 mt-2">
                    <p className="text-[15px] font-light text-[#002143] w-[568px] leading-[25px] line-clamp-4">
                      {project.name} presents a contemporary residential development in the heart of {project.city_municipality}, Philippines,
                      offering thoughtfully designed apartments suited for modern urban living. Rising elegantly within the city skyline, the building features clean architectural lines, private balconies, and expansive windows that invite natural light and city views.
                    </p>
                    <button className="text-[15px] font-medium text-[#002143] hover:underline">Read more</button>
                  </div>
                </div>


                {/* ── Right Content: Image Grid ── */}
                <div className="lg:col-span-5 flex gap-4 lg:gap-[18px] justify-end">
                  {/* Large Main Image (Tall) */}
                  <div className="h-[432px] w-[334px] shrink-0 rounded-[20px] overflow-hidden bg-gray-200 shadow-sm lg:-ml-16 xl:-ml-24">
                    <img
                      src={sortedGallery[0]?.image_url ?? `https://picsum.photos/seed/${project.slug}main/800/600`}
                      alt="Main view"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Two small images stacked */}
                  <div className="flex flex-col gap-4 lg:gap-[18px] flex-1 max-w-[334px]">
                    <div className="h-[207px] rounded-[20px] overflow-hidden bg-gray-200 shadow-sm">
                      <img
                        src={sortedGallery[1]?.image_url ?? `https://picsum.photos/seed/${project.slug}1/800/600`}
                        alt="Gallery 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="h-[207px] rounded-[20px] overflow-hidden bg-gray-200 shadow-sm">
                      <img
                        src={sortedGallery[2]?.image_url ?? `https://picsum.photos/seed/${project.slug}2/800/600`}
                        alt="Gallery 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full">
                <div className="h-[65px] w-full border border-[#D3D3D3] rounded-[10px] px-4 xl:px-5 flex items-center justify-between group hover:border-[#1428AE] transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-10 h-10 rounded bg-[#DFE3FF] border border-[#1428AE] flex items-center justify-center shrink-0">
                      <Coins size={20} className="text-[#1428AE]" />
                    </div>
                    <span className="text-[16px] xl:text-[22px] font-normal text-[#002143] whitespace-nowrap">Payment Plan</span>
                  </div>
                  <ChevronRight size={20} className="text-[#D3D3D3] group-hover:text-[#1428AE] shrink-0" />
                </div>

                <div className="h-[65px] w-full border border-[#D3D3D3] rounded-[10px] px-4 xl:px-5 flex items-center justify-between group hover:border-[#1428AE] transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-10 h-10 rounded bg-[#DFE3FF] border border-[#1428AE] flex items-center justify-center shrink-0">
                      <Layout size={20} className="text-[#1428AE]" />
                    </div>
                    <span className="text-[16px] xl:text-[22px] font-normal text-[#002143] whitespace-nowrap">Unit Types</span>
                  </div>
                  <ChevronRight size={20} className="text-[#D3D3D3] group-hover:text-[#1428AE] shrink-0" />
                </div>

                <div className="h-[65px] w-full border border-[#D3D3D3] rounded-[10px] px-4 xl:px-5 flex items-center justify-between group hover:border-[#1428AE] transition-all cursor-pointer bg-white">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-10 h-10 rounded bg-[#DFE3FF] border border-[#1428AE] flex items-center justify-center shrink-0">
                      <Info size={20} className="text-[#1428AE]" />
                    </div>
                    <span className="text-[16px] xl:text-[22px] font-normal text-[#002143] whitespace-nowrap">About Project</span>
                  </div>
                  <ChevronRight size={20} className="text-[#D3D3D3] group-hover:text-[#1428AE] shrink-0" />
                </div>
              </div>

              <div className="w-full h-px bg-[#D3D3D3] mt-10" />
            </>
          )}

          {/* ── Detailed Listings & Sidebar Section ── */}
          {(saleListings.length > 0 || rentListings.length > 0) && (
            isMapView ? (
              <ProjectListingsSection
                project={project}
                projectListings={projectListings}
                saleListings={saleListings}
                rentListings={rentListings}
                initialView="map"
              />
            ) : (
              <section className="py-12 border-t border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* ── Left Column: Listings ── */}
                  <div className="lg:col-span-8 space-y-10">
                    <ProjectListingsSection
                      project={project}
                      projectListings={projectListings}
                      saleListings={saleListings}
                      rentListings={rentListings}
                      initialView="list"
                    />
                  </div>

                  {/* ── Right Column: Sidebar ── */}
                  <div className="lg:col-span-4 lg:ml-auto">
                    <ListingSidebar 
                      variant="project" 
                      projectData={{ 
                        name: project.name, 
                        city_municipality: project.city_municipality || 'Cebu City' 
                      }} 
                    />
                  </div>
                </div>
              </section>
            )
          )}
        </main>
      </div>

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
