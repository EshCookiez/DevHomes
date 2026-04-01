import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import InquiryForm from '@/components/listings/InquiryForm'
import { MOCK_PROJECTS, MOCK_LISTINGS } from '@/lib/mock-data'
import SearchFilter from '@/components/projects/SearchFilter'
import ProjectListingsSection from '@/components/projects/ProjectListingsSection'
import { MapPin, Star, Check, ChevronRight, Coins, Layout, Info, Heart, Share2, ChevronDown, LayoutList, Map as MapIcon, Phone, Mail, Bell, MessageSquareMore, ListFilter } from 'lucide-react'
import React from 'react'
import { getProjectBySlug } from '@/lib/db-queries'
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

  let projectListings = MOCK_LISTINGS.filter(l => l.project_id === project.id)

  // If no mock listings map to this real project ID, but the project has units, generate virtual listings from the units
  // so the developer can see their inventory visually immediately.
  if (projectListings.length === 0 && project.project_units?.length > 0) {
    projectListings = project.project_units.map((u: any) => ({
      id: u.id + 9000,
      project_id: project.id,
      title: `${project.name} - ${u.unit_name || u.unit_type}`,
      listing_type: 'sale',
      price: u.selling_price || project.price_range_min || 0,
      currency: project.currency || 'PHP',
      property_listing_galleries: [{ image_url: `https://picsum.photos/seed/unit${u.id}/600/400` }],
      project_units: {
        id: u.id,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        floor_area_sqm: u.floor_area_sqm
      }
    }))
  }

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
      <div className="bg-white border-b border-gray-100 py-6 w-full">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px]">
          <SearchFilter />
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[800px] pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(239, 241, 255, 0.8) 0%, #FFFFFF 100%)', zIndex: -1 }}
        />
        <main className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px] py-10 space-y-8 relative font-outfit">
          {!isMapView && (
            <>
              {/* ── Breadcrumbs ── */}
              <nav className="flex items-center gap-3 text-[16px] text-[#002143] font-light mb-8">
                <span className="shrink-0">For Sale:</span>
                <Link href="/projects" className="text-[#001392] hover:underline">Philippine Properties</Link>
                <ChevronRight size={14} className="text-[#002143]" />
                <Link href={`/developers/${project.developers_profiles?.id}`} className="text-[#001392] hover:underline">
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
                  <aside className="lg:col-span-4 space-y-8">
                    {/* Contact Us Card */}
                    <div className="bg-white rounded-[10px] border border-[#D3D3D3] p-6 text-center space-y-4 lg:w-[349px] lg:h-[208px] flex flex-col justify-center shadow-sm lg:ml-auto">
                      <div className="space-y-1">
                        <h4 className="text-[22px] font-bold text-[#002143] font-outfit">Contact Us</h4>
                        <p className="text-[18px] text-[#002143] text-light font-outfit">
                          Submit your interest or inquiry for {project.name}.
                        </p>
                      </div>
                      <button className="w-full bg-[#E5FFEB] text-[#008A2E] py-3.5 rounded-[12px] font-regular text-[18px] flex items-center justify-center gap-3 hover:bg-[#D4F7DB] transition-all group font-outfit">
                        <MessageSquareMore size={22} className="group-hover:scale-110 transition-transform" />
                        WhatsApp
                      </button>
                    </div>

                    {/* Property Alert Card */}
                    <button className="w-[349px] h-[56px] border-2 border-[#1428AE] text-[#1428AE] py-5 rounded-[10px] font-regular text-[16px] uppercase tracking-wider flex items-center justify-center gap-4 transition-all group lg:ml-auto">
                      <Bell size={24} className="group-hover:animate-bounce" />
                      Alert me of new properties
                    </button>

                    {/* Community Card */}
                    <div className="bg-white rounded-[10px] border border-[#D3D3D3] p-4 flex items-center gap-4 group cursor-pointer hover:shadow-sm transition-all lg:w-[349px] lg:h-[129px] overflow-hidden lg:ml-auto">
                      <div className="w-[99px] h-[99px] rounded-[10px] overflow-hidden bg-[#D9D9D9] shrink-0">
                        <img
                          src={`https://picsum.photos/seed/${project.city_municipality}/200/200`}
                          alt={project.city_municipality}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-[20px] font-semibold text-[#002143] font-outfit leading-tight">{project.city_municipality}</h4>
                        <p className="text-[18px] font-light text-[#002143] font-outfit leading-[22px] mt-1">
                          See the community attractions and lifestyle
                        </p>
                      </div>
                    </div>

                    {/* Recommended Links */}
                    <div className="lg:w-[349px] space-y-6 lg:ml-auto">
                      {/* Section 1: Recommended searches */}
                      <div className="space-y-4">
                        <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
                          <h4 className="text-[18px] font-normal text-[#002143] font-outfit">Recommended searches</h4>
                        </div>
                        <div className="px-4 space-y-[15px]">
                          {[
                            `1 Bedroom Properties for rent in ${project.city_municipality}`,
                            `2 Bedroom Properties for rent in ${project.city_municipality}`,
                            `Apartments for rent in ${project.city_municipality}`
                          ].map((link, idx) => (
                            <Link key={idx} href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all font-outfit leading-none">
                              {link}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Near Project */}
                      <div className="space-y-4">
                        <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
                          <h4 className="text-[18px] font-normal text-[#002143] font-outfit">Near {project.name}</h4>
                        </div>
                        <div className="px-4 space-y-[15px]">
                          {[
                            'De Rosa Residences Properties',
                            'Ters Gardenia Properties',
                            'Pete Heights Properties',
                            'NC Residences Properties'
                          ].map((link, idx) => (
                            <Link key={idx} href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all font-outfit leading-none">
                              {link}
                            </Link>
                          ))}
                          <button className="block text-[15px] font-medium text-[#1428AE] hover:underline transition-all font-outfit leading-none mt-2">
                            View More
                          </button>
                        </div>
                      </div>

                      {/* Section 3: Other nearby area properties */}
                      <div className="space-y-4">
                        <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
                          <h4 className="text-[18px] font-normal text-[#002143] font-outfit">Other nearby area properties</h4>
                        </div>
                        <div className="px-4 space-y-[15px]">
                          {[
                            'Blue Valley Properties',
                            'Quezon North Properties',
                            'Nest House Properties',
                            'Miltier 101 Propertiesw'
                          ].map((link, idx) => (
                            <Link key={idx} href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all font-outfit leading-none">
                              {link}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ads Banner */}
                    <div className="flex flex-col items-center">
                      <AdBanner sizes={['300x600']} />
                    </div>
                  </aside>
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
