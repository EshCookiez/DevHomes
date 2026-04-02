'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchFilter from '@/components/projects/SearchFilter'
import {
  Heart,
  Share2,
  MapPin,
  Camera,
  ChevronRight,
  Bed,
  Bath,
  Maximize,
  Star,
} from 'lucide-react'

function AmenityIcon({ name, icon }: { name: string; icon: string | null }) {
  if (icon) {
    return (
      <div
        aria-label={name}
        style={{
          width: 25,
          height: 20,
          backgroundColor: '#002143',
          WebkitMaskImage: `url(${icon})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          WebkitMaskPosition: 'center',
          maskImage: `url(${icon})`,
          maskRepeat: 'no-repeat',
          maskSize: 'contain',
          maskPosition: 'center',
        }}
      />
    )
  }
  return (
    <svg width="25" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="#002143" strokeWidth="1.5"/>
      <path d="M7 10H13M10 7V13" stroke="#002143" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function highlightTitle(title: string) {
  const quoted = title.match(/"([^"]+)"|\u201C([^\u201D]+)\u201D|«([^»]+)»/)
  if (quoted) {
    const match = quoted[0]
    const idx = title.indexOf(match)
    return (
      <>
        {title.slice(0, idx)}
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{match}</strong>
        {title.slice(idx + match.length)}
      </>
    )
  }
  const properNoun = title.match(/(?:[A-Z][a-zA-Z]{1,}\s){1,}[A-Z][a-zA-Z]{1,}/g)
  if (properNoun) {
    const best = properNoun.sort((a, b) => b.length - a.length)[0]
    const idx = title.indexOf(best)
    return (
      <>
        {title.slice(0, idx)}
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{best}</strong>
        {title.slice(idx + best.length)}
      </>
    )
  }
  const words = title.split(' ')
  if (words.length > 3) {
    const head = words.slice(0, 3).join(' ')
    const rest = words.slice(3).join(' ')
    return (
      <>
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{head}</strong>
        {' '}{rest}
      </>
    )
  }
  return <strong style={{ fontWeight: 600, color: '#1428AE' }}>{title}</strong>
}

const fmt = (n?: number | null, currency = 'PHP') =>
  n ? `${currency} ${Number(n).toLocaleString()}` : null

const fmtDate = (d?: string | null) => {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  })
}

interface ListingDetailClientProps {
  listing: any
  recommended: any[]
  news: any[]
}

export default function ListingDetailClient({
  listing,
  recommended,
  news,
}: ListingDetailClientProps) {
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [hoveredNewsIdx, setHoveredNewsIdx] = useState<number | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    keepInformed: true,
  })
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const gallery = [...(listing.property_listing_galleries ?? [])].sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
  )
  const unit = listing.project_units
  const project = listing.projects
  const agent = listing.agent
  const developer = listing.developers_profiles
  const amenities: { name: string; icon: string | null }[] = listing.project_amenities ?? []
  const isRent = listing.listing_type === 'rent'
  const location = [project?.name, project?.city_municipality, 'Philippines']
    .filter(Boolean)
    .join(', ')
  const cityName = project?.city_municipality ?? 'Manila'
  const refNo = `Homes.ph - HPH...${new Date(listing.created_at ?? '').getFullYear()}-${listing.id}`

  const heroImage = gallery[0]?.image_url ?? project?.main_image_url ?? null
  const sideImages = gallery.slice(1, 4)

  const descText = listing.description ?? ''

  return (
    <main className="bg-white">
      {/* ── Search Filter Bar ── */}
      <div className="bg-white border-b border-gray-100 py-6 w-full relative z-20 overflow-visible min-h-fit">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[296px] 2xl:pr-[297px]">
          <SearchFilter />
        </div>
      </div>

      {/* ── Breadcrumb + Gallery – gradient background (Rectangle 11179) ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(244, 170, 29, 0.15) 0%, rgba(255, 255, 255, 0.15) 100%)' }}>
      {/* ── Breadcrumb ── */}
      <div className="border-b border-[#D3D3D3]" />
      <div className="max-w-[1328px] mx-auto px-4 py-[30px]">
        <div className="flex items-center gap-1.5 text-[16px] font-light text-[#002143] flex-wrap">
          <span>For {isRent ? 'Rent' : 'Sale'}:</span>
          <ChevronRight size={12} className="text-[#002143]" />
          <Link href="/projects" className="text-[#001392] hover:underline">
            Philippine Projects
          </Link>
          <ChevronRight size={12} className="text-[#002143]" />
          <Link
            href={developer?.developer_name ? `/developers/${developer.developer_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '/developers'}
            className="text-[#001392] hover:underline"
          >
            {developer?.developer_name ?? 'Filipinohomes'}
          </Link>
          <ChevronRight size={12} className="text-[#002143]" />
          <Link href={project?.slug ? `/projects/${project.slug}` : '/projects'} className="text-[#001392] hover:underline">{project?.name ?? listing.title}</Link>
          <ChevronRight size={12} className="text-[#002143]" />
          <span className="text-[#002143]">{listing.title}</span>
        </div>
      </div>

      {/* ── Image Gallery ── */}
      <div className="max-w-[1328px] mx-auto px-4 pb-8">
        <div className="flex gap-[15px]" style={{ height: 549 }}>
          {/* Main Image – 862px wide × 549px tall */}
          <div className="relative flex-1 rounded-[10px] overflow-hidden bg-[#D9D9D9]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
            {/* Map button – bottom-left */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-[#002143] text-white text-[18px] font-normal rounded-[10px] px-4 py-2 cursor-pointer">
              <MapPin size={20} />
              <span>Map</span>
            </div>
            {/* Heart + Share overlay – top-right */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button className="w-[28px] h-[28px] flex items-center justify-center">
                <Heart size={24} className="text-white" />
              </button>
              <button className="w-[28px] h-[28px] flex items-center justify-center">
                <Share2 size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Side column – 450px wide, 3 images stacked vertically */}
          <div className="w-[450px] flex flex-col gap-[15px] shrink-0 max-lg:hidden">
            {/* Top image – 242px tall */}
            <div className="h-[242px] rounded-[10px] overflow-hidden bg-[#D9D9D9]">
              {sideImages[0] ? (
                <img
                  src={sideImages[0].image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : project?.main_image_url ? (
                <img
                  src={project.main_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            {/* Middle image – 138px tall */}
            <div className="h-[138px] rounded-[10px] overflow-hidden bg-[#D9D9D9]">
              {sideImages[1] ? (
                <img
                  src={sideImages[1].image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            {/* Bottom image – 138px tall, with photo count badge */}
            <div className="relative h-[138px] rounded-[10px] overflow-hidden bg-[#D9D9D9]">
              {sideImages[2] ? (
                <img
                  src={sideImages[2].image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" />
              )}
              {/* Photo count badge – bottom-right of last side image */}
              {gallery.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-[rgba(0,33,67,0.5)] text-white text-[18px] font-normal rounded-[10px] px-3 py-1.5">
                  <Camera size={20} />
                  <span>{gallery.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>{/* end gradient wrapper */}

      {/* ── Content Area ── */}
      <div className="max-w-[1328px] mx-auto px-4 mt-8">
        <div className="flex gap-8 max-lg:flex-col">
          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0">
            {/* Price + Save/Share */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h2 className="text-[50px] font-medium text-[#002143] leading-[50px]">
                {fmt(listing.price, listing.currency ?? 'PHP') ?? 'Price on request'}
              </h2>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-[#DFE3FF] text-[#1428AE] rounded-[10px] px-5 h-10 text-[18px] font-normal">
                  <Heart size={20} />
                  Save
                </button>
                <button className="flex items-center gap-2 bg-[#DFE3FF] text-[#1428AE] rounded-[10px] px-5 h-10 text-[18px] font-normal">
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>

            {/* Location */}
            <p className="text-[20px] font-medium text-[#002143] mt-3">{location}</p>

            {/* Specs row */}
            <div className="flex items-center gap-3 mt-2 text-[18px] font-light text-[#002143] flex-wrap">
              <span>{unit?.unit_type ?? 'Apartment'}</span>
              <span className="w-px h-[22px] bg-[#D3D3D3]" />
              {unit?.bedrooms != null && (
                <>
                  <span className="flex items-center gap-1">
                    <Bed size={23} className="text-[#002143]" />
                    {unit.bedrooms}
                  </span>
                </>
              )}
              {unit?.bathrooms != null && (
                <>
                  <span className="flex items-center gap-1">
                    <Bath size={23} className="text-[#002143]" />
                    {unit.bathrooms}
                  </span>
                </>
              )}
              <span className="w-px h-[22px] bg-[#D3D3D3]" />
              <span>
                Area: {unit?.floor_area_sqm ?? unit?.lot_area_sqm ?? '—'} sqm
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-0 mt-4 text-[30px] font-normal text-[#1428AE]">
              {listing.title && (
                <span>{listing.title}</span>
              )}
              {unit?.is_furnished && (
                <>
                  <span className="w-[2px] h-[33px] bg-[#1428AE] mx-5" />
                  <span>{unit.is_furnished === 'Furnished' ? 'High Finishing' : unit.is_furnished}</span>
                </>
              )}
              {project?.city_municipality && (
                <>
                  <span className="w-[2px] h-[33px] bg-[#1428AE] mx-5" />
                  <span>Prime Location</span>
                </>
              )}
            </div>

            {/* Description */}
            {descText && (
              <div className="mt-8">
                <p
                  className={`text-[22px] font-light text-[#002143] leading-[35px] ${!showFullDesc ? 'line-clamp-4' : ''}`}
                >
                  {descText}
                </p>
                {descText.length > 300 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="mt-3 text-[22px] font-medium text-[#002143] hover:underline"
                  >
                    {showFullDesc ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* ── Property Information ── */}
            <h3 className="text-[35px] font-medium text-[#002143] mt-12">
              Property Information
            </h3>

            {/* Info Grid */}
            <div className="mt-6 border-t border-[#D3D3D3]">
              {/* Row 1 */}
              <div className="grid grid-cols-2 border-b border-[#D3D3D3]">
                <div className="grid grid-cols-[140px_1fr] py-3">
                  <span className="text-[15px] font-light text-[#002143]">Type</span>
                  <span className="text-[15px] font-medium text-[#002143]">
                    {unit?.unit_type ?? 'Apartment'}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] py-3 border-l border-[#D3D3D3] pl-6">
                  <span className="text-[15px] font-light text-[#002143]">Furnishing</span>
                  <span className="text-[15px] font-medium text-[#002143]">
                    {unit?.is_furnished ?? 'Unfurnished'}
                  </span>
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-2 border-b border-[#D3D3D3]">
                <div className="grid grid-cols-[140px_1fr] py-3">
                  <span className="text-[15px] font-light text-[#002143]">Purpose</span>
                  <span className="text-[15px] font-medium text-[#002143]">
                    For {isRent ? 'Rent' : 'Sale'}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] py-3 border-l border-[#D3D3D3] pl-6">
                  <span className="text-[15px] font-light text-[#002143]">Added on</span>
                  <span className="text-[15px] font-medium text-[#002143]">
                    {fmtDate(listing.created_at) ?? '—'}
                  </span>
                </div>
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 border-b border-[#D3D3D3]">
                <div className="grid grid-cols-[140px_1fr] py-3">
                  <span className="text-[15px] font-light text-[#002143]">Reference no.</span>
                  <span className="text-[15px] font-medium text-[#002143]">{refNo}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] py-3 border-l border-[#D3D3D3] pl-6">
                  <span className="text-[15px] font-light text-[#002143]">Rating</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        className="text-[#1428AE] fill-[#1428AE]"
                      />
                    ))}
                    <Star size={16} className="text-[#DFE3FF] fill-[#DFE3FF]" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Features / Amenities ── */}
            {amenities.length > 0 && (
              <>
                <h3 className="text-[25px] font-medium text-[#002143] mt-10">
                  Features/ Amenities
                </h3>
                <div className="flex flex-nowrap gap-4 mt-6">
                  {amenities.slice(0, 5).map((amenity, i) => (
                    <div
                      key={i}
                      className="w-[126px] h-[126px] shrink-0 bg-[#EDF4FC] rounded-[5px] flex flex-col items-center pt-[27px]"
                    >
                      <div className="flex items-center justify-center" style={{ width: 25, height: 20 }}>
                        <AmenityIcon name={amenity.name} icon={amenity.icon} />
                      </div>
                      <span className="text-[15px] font-normal text-[#002143] text-center px-2 mt-[15px]" style={{ lineHeight: '20px' }}>
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                  {amenities.length > 5 && (
                    <button
                      onClick={() => setShowAllAmenities(true)}
                      className="w-[126px] h-[126px] shrink-0 border border-[#D3D3D3] rounded-[5px] flex items-center justify-center hover:border-[#1428AE] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-medium text-[#1428AE] text-center px-2 leading-[20px]">
                        + {amenities.length - 5} more amenities
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Recommended for you ── */}
            {recommended.length > 0 && (
              <>
                <h3 className="text-[25px] font-medium text-[#002143] mt-14">
                  Recommended for you
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                  {recommended.map((rec: any) => {
                    const recGallery = rec.property_listing_galleries ?? []
                    const recUnit = rec.project_units
                    const recProject = rec.projects
                    const recImg =
                      recGallery[0]?.image_url ??
                      recProject?.main_image_url ??
                      null
                    return (
                      <Link
                        href={`/listings/${rec.id}`}
                        key={rec.id}
                        className="block group"
                      >
                        <div className="h-[175px] rounded-[10px] overflow-hidden bg-[#D9D9D9]">
                          {recImg ? (
                            <img
                              src={recImg}
                              alt={rec.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        <p className="text-[25px] font-medium text-[#002143] mt-3 leading-[25px]">
                          {fmt(rec.price, rec.currency ?? 'PHP') ?? 'Price TBD'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[15px] font-light text-[#002143]">
                          {recUnit?.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bed size={20} /> {recUnit.bedrooms}
                            </span>
                          )}
                          {recUnit?.bathrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bath size={20} /> {recUnit.bathrooms}
                            </span>
                          )}
                          {(recUnit?.floor_area_sqm ?? recUnit?.lot_area_sqm) && (
                            <span className="flex items-center gap-1">
                              <Maximize size={20} />{' '}
                              {recUnit?.floor_area_sqm ?? recUnit?.lot_area_sqm} sqm
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] font-light text-[#002143] mt-1 truncate">
                          {[recProject?.name, recProject?.city_municipality, 'Philippines']
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className="text-[13px] font-light text-[#7D868F] mt-0.5">
                          {rec.developers_profiles?.developer_name ?? 'Filipinohomes'}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── ADS space ── */}
            <div className="mt-10 hidden lg:block relative">
              <div className="w-full overflow-hidden rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[#E8E8E8] bg-[#F4F4F9]" style={{ height: '217px' }}>
                <iframe
                  src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=970x250"
                  width={970}
                  height={250}
                  frameBorder={0}
                  scrolling="no"
                  style={{ border: 'none', overflow: 'hidden', display: 'block', transformOrigin: 'left top', transform: 'scale(0.869, 0.868)' }}
                />
              </div>
              <span className="absolute bottom-2 right-3 text-[11px] font-medium text-[#7F7F7F] bg-white/80 px-2 py-0.5 rounded-full border border-[#D0D0D0]">
                Advertisement
              </span>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="w-[435px] shrink-0 max-lg:w-full">
            {/* Agent Card */}
            <div className="border border-[#D3D3D3] rounded-[10px] p-[25px]">
              <div className="flex items-start gap-4">
                {/* Profile pic */}
                <div className="w-[131px] h-[131px] rounded-full overflow-hidden bg-[#D9D9D9] shrink-0 border-[3px] border-[#BBBBBB]">
                  {agent?.profile_image_url ? (
                    <img
                      src={agent.profile_image_url}
                      alt={agent.full_name ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#D9D9D9]" />
                  )}
                </div>
                <div className="pt-[34px]">
                  <h4 className="text-[22px] font-semibold text-[#002143] leading-[22px]">
                    {agent?.full_name ?? 'Property Agent'}
                  </h4>
                  <div className="mt-[15px]">
                    <span className="inline-flex items-center gap-2 bg-[#E5F5FD] text-[#019BC9] text-[15px] font-normal rounded-[8px] px-4 h-[36px] w-[190px]">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 2C6.58 2 3 5.58 3 10C3 14.42 6.58 18 11 18H12V20C16.97 17.94 20 14 20 10C20 5.58 16.42 2 12 2H11Z" fill="#00BAF3"/>
                      </svg>
                      Responsive Broker
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact buttons */}
              <div className="flex gap-[15px] mt-6">
                <button
                  type="button"
                  onClick={() => { setEmailSent(false); setShowEmailModal(true) }}
                  className="flex items-center justify-center gap-2 bg-[#DFE3FF] text-[#1428AE] rounded-[10px] w-[110px] h-[50px] text-[18px] font-normal cursor-pointer"
                >
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="#1428AE">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  className="flex items-center justify-center gap-2 bg-[#DFE3FF] text-[#1428AE] rounded-[10px] w-[98px] h-[50px] text-[18px] font-normal cursor-pointer"
                >
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="#1428AE">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  Call
                </button>
                <a
                  href={agent?.phone ? `https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-[10px] bg-[#E1FFDF] text-[#00A629] rounded-[10px] w-[153px] h-[50px] text-[18px] font-normal cursor-pointer"
                >
                  <svg width="23" height="23" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path fill="#2CB742" d="M0,58l4.988-14.963C2.457,38.78,1,33.812,1,28.5C1,12.76,13.76,0,29.5,0S58,12.76,58,28.5S45.24,57,29.5,57c-4.789,0-9.299-1.187-13.26-3.273L0,58z"/>
                      <path fill="#FFFFFF" d="M47.683,37.985c-1.316-2.487-6.169-5.331-6.169-5.331c-1.098-0.626-2.423-0.696-3.049,0.42c0,0-1.577,1.891-1.978,2.163c-1.832,1.241-3.529,1.193-5.242-0.52l-3.981-3.981l-3.981-3.981c-1.713-1.713-1.761-3.41-0.52-5.242c0.272-0.401,2.163-1.978,2.163-1.978c1.116-0.627,1.046-1.951,0.42-3.049c0,0-2.844-4.853-5.331-6.169c-1.058-0.56-2.357-0.364-3.203,0.482l-1.758,1.758c-5.577,5.577-2.831,11.873,2.746,17.45l5.097,5.097l5.097,5.097c5.577,5.577,11.873,8.323,17.45,2.746l1.758-1.758C48.048,40.341,48.243,39.042,47.683,37.985z"/>
                    </g>
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-[#D9D9D9] mt-7" />

              {/* Developer logo */}
              {developer?.logo_url && (
                <div className="flex items-center justify-between mt-2">
                  <div className="h-[62px] w-[141px] rounded-[5px] overflow-hidden">
                    <img
                      src={developer.logo_url}
                      alt={developer.developer_name ?? ''}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Link
                    href="/search"
                    className="flex items-center gap-1 text-[16px] font-light text-[#001392] hover:underline"
                  >
                    View All Properties
                    <ChevronRight size={18} className="text-[#001392]" />
                  </Link>
                </div>
              )}
            </div>

            {/* ── Place card ── */}
            <div className="border border-[#D3D3D3] rounded-[10px] p-4 mt-5">
              <div className="flex gap-4">
                <div className="w-[100px] h-[100px] rounded-[10px] overflow-hidden bg-[#D9D9D9] shrink-0">
                  {project?.main_image_url ? (
                    <img
                      src={project.main_image_url}
                      alt={cityName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div>
                  <h5 className="text-[20px] font-semibold text-[#002143]">
                    {cityName}
                  </h5>
                  <p className="text-[18px] font-light text-[#002143] leading-[22px] mt-2">
                    See the community attractions and lifestyle
                  </p>
                </div>
              </div>
            </div>

            {/* ── Latest Updates ── */}
            {news.length > 0 && (
              <div className="mt-5">
                <h4 className="text-[20px] font-medium leading-[20px] text-[#002143]">
                  Latest Updates
                </h4>
                <div className="mt-[15px]">
                  {news.slice(0, 5).map((article: any, idx: number) => {
                    const isHovered = hoveredNewsIdx === idx
                    return (
                      <div key={article.id ?? idx}>
                        {idx > 0 && <div className="h-px bg-[#D0D0D0] my-5" />}
                        <a
                          href={article.slug ? `/news/${article.slug}` : '#'}
                          onMouseEnter={() => setHoveredNewsIdx(idx)}
                          onMouseLeave={() => setHoveredNewsIdx(null)}
                          style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-start',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
                            opacity: hoveredNewsIdx !== null && !isHovered ? 0.5 : 1,
                          }}
                        >
                          <div style={{
                            width: '128px',
                            height: '79px',
                            borderRadius: '5px',
                            background: '#D9D9D9',
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                            transition: 'box-shadow 0.3s ease',
                          }}>
                            {article.image || article.featured_image_url || article.image_url ? (
                              <img
                                src={article.image || article.featured_image_url || article.image_url}
                                alt=""
                                style={{
                                  width: '128px',
                                  height: '79px',
                                  objectFit: 'cover',
                                  transition: 'transform 0.5s ease',
                                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                                }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%' }} />
                            )}
                          </div>
                          <p style={{
                            fontFamily: "'Outfit'",
                            fontWeight: 300,
                            fontSize: '15px',
                            lineHeight: '20px',
                            color: isHovered ? '#1428AE' : '#002143',
                            transition: 'color 0.3s ease',
                            width: '292px',
                            height: '79px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {highlightTitle(article.title)}
                          </p>
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Useful Links ── */}
            <div className="mt-5">
              <div className="bg-[#F4F4F9] rounded-[5px] px-4 py-2">
                <span className="text-[18px] font-normal text-[#002143]">
                  Useful Links
                </span>
              </div>
              <div className="mt-3 space-y-4 pl-1">
                {unit?.bedrooms != null && (
                  <Link
                    href={`/search?bedrooms=${unit.bedrooms}&listing_type=${listing.listing_type}&location=${cityName}`}
                    className="block text-[15px] font-light text-[#002143] hover:underline"
                  >
                    {unit.bedrooms} Bedroom Properties for {isRent ? 'rent' : 'sale'} in{' '}
                    {cityName}
                  </Link>
                )}
                <Link
                  href={`/search?propertyType=${unit?.unit_type ?? 'Apartment'}&listing_type=${listing.listing_type}&location=${cityName}`}
                  className="block text-[15px] font-light text-[#002143] hover:underline"
                >
                  {unit?.unit_type ?? 'Apartments'} for {isRent ? 'rent' : 'sale'} in{' '}
                  {cityName}
                </Link>
              </div>
            </div>

            {/* ── Near <Project> ── */}
            {project?.name && (
              <div className="mt-5">
                <div className="bg-[#F4F4F9] rounded-[5px] px-4 py-2">
                  <span className="text-[18px] font-normal text-[#002143]">
                    Near {project.name}
                  </span>
                </div>
                <div className="mt-3 space-y-4 pl-1">
                  {recommended.slice(0, 4).map((rec: any) => (
                    <Link
                      key={rec.id}
                      href={`/listings/${rec.id}`}
                      className="block text-[15px] font-light text-[#002143] hover:underline"
                    >
                      {rec.title}
                    </Link>
                  ))}
                  <Link
                    href="/search"
                    className="block text-[15px] font-medium text-[#1428AE] hover:underline"
                  >
                    View More
                  </Link>
                </div>
              </div>
            )}

            {/* ── Other nearby area ── */}
            <div className="mt-5">
              <div className="bg-[#F4F4F9] rounded-[5px] px-4 py-2">
                <span className="text-[18px] font-normal text-[#002143]">
                  Other nearby area properties
                </span>
              </div>
              <div className="mt-3 space-y-4 pl-1">
                <Link
                  href={`/search?location=${cityName}`}
                  className="block text-[15px] font-light text-[#002143] hover:underline"
                >
                  {cityName} Properties
                </Link>
                {project?.province && (
                  <Link
                    href={`/search?location=${project.province}`}
                    className="block text-[15px] font-light text-[#002143] hover:underline"
                  >
                    {project.province} Properties
                  </Link>
                )}
              </div>
            </div>

            {/* ── Advertisement ── */}
            <div className="mt-8 mx-auto overflow-hidden" style={{ width: '350px', height: '701px', background: '#D9D9D9', borderRadius: '5px' }}>
              <iframe
                src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=300x600"
                width={300}
                height={600}
                frameBorder={0}
                scrolling="no"
                style={{ border: 'none', overflow: 'hidden', display: 'block', transformOrigin: 'left top', transform: 'scale(1.1667, 1.1683)' }}
              />
            </div>
            <p className="text-center text-[15px] font-light text-[#7F7F7F] mt-2">
              Advertisement
            </p>
          </div>
        </div>
      </div>

      {/* spacer before footer */}
      <div className="h-20" />

      {/* ── Call Modal ── */}
      {showCallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,33,67,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCallModal(false)}
        >
          {/* Frame 2147223339 — 490×550, border-radius 20 */}
          <div
            className="relative bg-white overflow-hidden"
            style={{ width: 490, height: 550, borderRadius: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close — left:436, top:30 */}
            <button
              type="button"
              onClick={() => setShowCallModal(false)}
              className="absolute flex items-center justify-center"
              style={{ width: 24, height: 24, left: 436, top: 30 }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#49698A" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* "Contact Us" — left:30, top:30, font-size:22, font-weight:500 */}
            <h2
              className="absolute font-outfit text-[#002143]"
              style={{ left: 30, top: 30, fontSize: 22, fontWeight: 500, lineHeight: '22px' }}
            >
              Contact Us
            </h2>

            {/* Developer name "Filipinohomes" — left:30, top:77, font-size:20, font-weight:300 */}
            <p
              className="absolute font-outfit text-[#002143]"
              style={{ left: 30, top: 77, fontSize: 20, fontWeight: 300, lineHeight: '20px' }}
            >
              {developer?.developer_name ?? 'Filipinohomes'}
            </p>

            {/* Phone icon circle — left:30, top:122, w:40, h:40, bg:#DFE3FF */}
            <div
              className="absolute rounded-full bg-[#DFE3FF] flex items-center justify-center"
              style={{ left: 30, top: 122, width: 40, height: 40 }}
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="#1428AE">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </div>

            {/* Phone number — left:85, top:130, font-size:25, font-weight:400, color:#1428AE */}
            <a
              href={agent?.phone ? `tel:${agent.phone}` : '#'}
              className="absolute font-outfit text-[#1428AE] hover:underline"
              style={{ left: 85, top: 130, fontSize: 25, fontWeight: 400, lineHeight: '25px' }}
            >
              {agent?.phone ?? '+63 977 815 0888'}
            </a>

            {/* Divider 1 — left:30, top:187, width:430, height:1 */}
            <div className="absolute bg-[#D3D3D3]" style={{ left: 30, top: 187, width: 430, height: 1 }} />

            {/* "Agent:" label — left:30, top:213, font-size:18, font-weight:300, color:#8997A6 */}
            <span
              className="absolute font-outfit text-[#8997A6]"
              style={{ left: 30, top: 213, fontSize: 18, fontWeight: 300, lineHeight: '18px' }}
            >
              Agent:
            </span>

            {/* Agent name — left:93, top:213, font-size:18, font-weight:300, color:#002143 */}
            <span
              className="absolute font-outfit text-[#002143]"
              style={{ left: 93, top: 213, fontSize: 18, fontWeight: 300, lineHeight: '18px' }}
            >
              {agent?.full_name ?? agent?.name ?? 'Anthony Leuterio'}
            </span>

            {/* Divider 2 — left:30, top:256, width:430, height:1 */}
            <div className="absolute bg-[#D3D3D3]" style={{ left: 30, top: 256, width: 430, height: 1 }} />

            {/* Quote reference — left:30, top:282, width:426, font-size:18, font-weight:300, color:#002143 */}
            <p
              className="absolute font-outfit text-[#002143]"
              style={{ left: 30, top: 282, width: 426, fontSize: 18, fontWeight: 300, lineHeight: '25px' }}
            >
              Please quote property reference {listing.reference_no ?? 'Homes.ph'} when calling us.
            </p>

            {/* Divider 3 — left:30, top:357, width:430, height:1 */}
            <div className="absolute bg-[#D3D3D3]" style={{ left: 30, top: 357, width: 430, height: 1 }} />

            {/* Notification prompt — left:30, top:383, width:430, font-size:17, font-weight:300, color:#8997A6 */}
            <p
              className="absolute font-outfit text-[#8997A6]"
              style={{ left: 30, top: 383, width: 430, fontSize: 17, fontWeight: 300, lineHeight: '25px' }}
            >
              Do you want more options? Finding the right property for you is easier with notifications.
            </p>

            {/* "Notify Me" button — left:30, top:458, width:210, height:55, bg:#1428AE, radius:10 */}
            <button
              type="button"
              onClick={() => setShowCallModal(false)}
              className="absolute bg-[#1428AE] rounded-[10px] hover:bg-[#0f1f8a] transition-colors"
              style={{ left: 30, top: 458, width: 210, height: 55 }}
            >
              <span
                className="absolute font-outfit text-white"
                style={{ left: 61, top: 18, fontSize: 20, fontWeight: 500, lineHeight: '20px' }}
              >
                Notify Me
              </span>
            </button>

            {/* "Maybe Later" button — left:250, top:458, width:210, height:55, border:#1428AE, radius:10 */}
            <button
              type="button"
              onClick={() => setShowCallModal(false)}
              className="absolute rounded-[10px] border border-[#1428AE] hover:bg-[#f0f3ff] transition-colors"
              style={{ left: 250, top: 458, width: 210, height: 55 }}
            >
              <span
                className="absolute font-outfit text-[#1428AE]"
                style={{ left: 48, top: 18, fontSize: 20, fontWeight: 500, lineHeight: '20px' }}
              >
                Maybe Later
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── All Amenities Modal ── */}
      {showAllAmenities && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,33,67,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAllAmenities(false)}
        >
          {/* Frame 2147223339 — 730×557, border-radius:20 */}
          <div
            className="relative bg-white font-outfit overflow-hidden"
            style={{ width: 730, height: 557, borderRadius: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Title "Amenities" — left:calc(50%-112px/2)=309, top:30, 25px/500, #002143 */}
            <h2
              className="absolute font-outfit text-[#002143]"
              style={{ width: 112, left: 309, top: 30, fontSize: 25, fontWeight: 500, lineHeight: '25px' }}
            >
              Amenities
            </h2>

            {/* Close — left:676, top:30, 24×24, stroke:#49698A */}
            <button
              type="button"
              onClick={() => setShowAllAmenities(false)}
              className="absolute flex items-center justify-center"
              style={{ left: 676, top: 30, width: 24, height: 24 }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#49698A" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Horizontal divider — top:77, full width, #D3D3D3 */}
            <div className="absolute left-0 right-0" style={{ top: 77, height: 1, background: '#D3D3D3' }} />

            {/* Scrollable content — top:78, left:30 padding, right:44 (30 content + 14 scrollbar), bottom:30
                Scrollbar: track #F4F4F9 15px, thumb #49698A 11px, border-radius:10 (Rectangle 11280) */}
            <style>{`
              .amenities-modal-scroll::-webkit-scrollbar { width: 15px; }
              .amenities-modal-scroll::-webkit-scrollbar-track { background: #F4F4F9; border-radius: 10px; }
              .amenities-modal-scroll::-webkit-scrollbar-thumb { background: #49698A; border-radius: 10px; min-height: 55px; }
              .amenities-modal-scroll { scrollbar-width: thin; scrollbar-color: #49698A #F4F4F9; }
            `}</style>
            <div
              className="absolute amenities-modal-scroll"
              style={{ top: 78, left: 0, right: 0, bottom: 0, overflowY: 'auto', paddingLeft: 30, paddingRight: 44, paddingBottom: 30 }}
            >
              {/* Section label — "Features" at modal top:85 = scroll-top:7, 22px/400, #49698A */}
              <p
                className="font-outfit"
                style={{ fontSize: 22, fontWeight: 400, lineHeight: '22px', color: '#49698A', marginTop: 7, marginBottom: 20 }}
              >
                All Amenities
              </p>

              {/* Cards — 120×120, bg:#EDF4FC, radius:5, gap:15
                  Icon: 25×20, paddingTop:24 from card top
                  Text: 15px/400, #002143, line-height:20px, marginTop:12 */}
              <div className="flex flex-wrap" style={{ gap: 15 }}>
                {amenities.map((amenity, i) => (
                  <div
                    key={i}
                    className="bg-[#EDF4FC] rounded-[5px] flex flex-col items-center shrink-0"
                    style={{ width: 120, height: 120, paddingTop: 24 }}
                  >
                    <div className="flex items-center justify-center" style={{ width: 25, height: 20 }}>
                      <AmenityIcon name={amenity.name} icon={amenity.icon} />
                    </div>
                    <span
                      className="font-outfit text-[#002143] text-center px-2"
                      style={{ fontSize: 15, fontWeight: 400, lineHeight: '20px', marginTop: 12 }}
                    >
                      {amenity.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,33,67,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowEmailModal(false)}
        >
          {/* Frame 2147223339 — 490×550, border-radius 20 */}
          <div
            className="relative bg-white overflow-hidden"
            style={{ width: 490, height: 550, borderRadius: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close — left:436, top:30, 24×24 */}
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="absolute flex items-center justify-center"
              style={{ width: 24, height: 24, left: 436, top: 30 }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#49698A" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* "Email agent for more information" — left:30, top:30, 329×22, font-size:22, font-weight:500 */}
            <h2
              className="absolute font-outfit text-[#002143]"
              style={{ left: 30, top: 30, width: 329, fontSize: 22, fontWeight: 500, lineHeight: '22px' }}
            >
              Email agent for more information
            </h2>

            {emailSent ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="#1428AE" strokeWidth="1.5"/>
                  <path d="M7 12l3.5 3.5L17 9" stroke="#1428AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-[20px] font-medium text-[#002143] text-center font-outfit">Your email has been sent!</p>
                <p className="text-[15px] font-light text-[#002143] text-center font-outfit">The agent will get back to you shortly.</p>
              </div>
            ) : (
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  setEmailSending(true)
                  await new Promise(r => setTimeout(r, 800))
                  setEmailSending(false)
                  setEmailSent(true)
                }}
              >
                {/* Name field — Rectangle 11282: left:30, top:82, 430×60, border-radius:15 */}
                <div className="absolute" style={{ left: 30, top: 82, width: 430, height: 60 }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={emailForm.name}
                    onChange={e => setEmailForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-full border border-[#D3D3D3] rounded-[15px] font-outfit text-[18px] font-light text-[#002143] placeholder-[#AAB2BB] outline-none focus:border-[#1428AE]"
                    style={{ paddingLeft: 18, paddingRight: 30 }}
                  />
                  {/* * — left:184 relative to modal = left:154 relative to field */}
                  <span
                    className="absolute font-outfit text-[#1428AE] pointer-events-none"
                    style={{ left: 154, top: 21, fontSize: 18, fontWeight: 300, lineHeight: '18px' }}
                  >*</span>
                </div>

                {/* Email field — Rectangle 11283: left:30, top:162, 430×60, border-radius:15 */}
                <div className="absolute" style={{ left: 30, top: 162, width: 430, height: 60 }}>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={emailForm.email}
                    onChange={e => setEmailForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-full border border-[#D3D3D3] rounded-[15px] font-outfit text-[18px] font-light text-[#002143] placeholder-[#AAB2BB] outline-none focus:border-[#1428AE]"
                    style={{ paddingLeft: 18, paddingRight: 30 }}
                  />
                  {/* * — left:184 relative to modal = left:154 relative to field */}
                  <span
                    className="absolute font-outfit text-[#1428AE] pointer-events-none"
                    style={{ left: 154, top: 21, fontSize: 18, fontWeight: 300, lineHeight: '18px' }}
                  >*</span>
                </div>

                {/* Phone field — Rectangle 11284: left:30, top:242, 430×60, border-radius:15 */}
                <div className="absolute" style={{ left: 30, top: 242, width: 430, height: 60 }}>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={emailForm.phone}
                    onChange={e => setEmailForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full h-full border border-[#D3D3D3] rounded-[15px] font-outfit text-[18px] font-light text-[#002143] placeholder-[#AAB2BB] outline-none focus:border-[#1428AE]"
                    style={{ paddingLeft: 82 }}
                  />
                  {/* Flag — left:48, top:260 → relative to field: left:18, top:18 */}
                  <span className="absolute pointer-events-none" style={{ left: 18, top: 18 }}>
                    <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2.22" y="7.56" width="27.56" height="7.44" fill="#1E50A0"/>
                      <rect x="2.22" y="16" width="27.56" height="7.44" fill="#D22F27"/>
                      <polygon points="2.22,7.56 16,16 2.22,24.44" fill="white"/>
                      <circle cx="8" cy="16" r="2" fill="#F1B31C"/>
                    </svg>
                  </span>
                  {/* +63 — left:77, top:263 → relative to field: left:47, top:21 */}
                  <span
                    className="absolute font-outfit text-[#002143] pointer-events-none"
                    style={{ left: 47, top: 21, fontSize: 18, fontWeight: 300, lineHeight: '18px' }}
                  >+63</span>
                </div>

                {/* Message — Rectangle 11285: left:30, top:322, 430×75, border-radius:15 */}
                <div className="absolute" style={{ left: 30, top: 322, width: 430, height: 75 }}>
                  <textarea
                    value={emailForm.message || `I would like to inquire about your property ${listing.reference_no ?? ''}.`}
                    onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full h-full border border-[#D3D3D3] rounded-[15px] font-outfit text-[18px] font-light text-[#002143] outline-none focus:border-[#1428AE] resize-none"
                    style={{ paddingLeft: 18, paddingTop: 13, paddingRight: 18 }}
                  />
                </div>

                {/* Checkbox — left:30, top:412, 25×25 */}
                <button
                  type="button"
                  onClick={() => setEmailForm(f => ({ ...f, keepInformed: !f.keepInformed }))}
                  className="absolute flex items-center justify-center rounded-[4px]"
                  style={{
                    left: 30, top: 412, width: 25, height: 25,
                    background: emailForm.keepInformed ? '#1428AE' : 'white',
                    border: emailForm.keepInformed ? 'none' : '1.5px solid #D3D3D3'
                  }}
                  aria-label="Keep me informed"
                >
                  {emailForm.keepInformed && (
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5l4 4L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                {/* "Keep me informed…" — left:63, top:417, 288×15, font-size:15, font-weight:300 */}
                <span
                  className="absolute font-outfit text-[#002143]"
                  style={{ left: 63, top: 417, width: 288, fontSize: 15, fontWeight: 300, lineHeight: '15px' }}
                >
                  Keep me informed about similar properties.
                </span>

                {/* Send Email button — Rectangle 11076: left:30, top:465, 430×55, bg:#1428AE, radius:10 */}
                <button
                  type="submit"
                  disabled={emailSending}
                  className="absolute bg-[#1428AE] rounded-[10px] hover:bg-[#0f1f8a] transition-colors disabled:opacity-70"
                  style={{ left: 30, top: 465, width: 430, height: 55 }}
                >
                  {/* Email icon — left:178, top:480 → relative to button: left:148, top:15 */}
                  <svg
                    className="absolute"
                    style={{ left: 148, top: 15 }}
                    width="25" height="25" viewBox="0 0 24 24" fill="white"
                  >
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  {/* "Send Email" text — left:213, top:483 → relative: left:183, top:18 */}
                  <span
                    className="absolute font-outfit text-white"
                    style={{ left: 183, top: 18, fontSize: 20, fontWeight: 500, lineHeight: '20px' }}
                  >
                    {emailSending ? 'Sending…' : 'Send Email'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
