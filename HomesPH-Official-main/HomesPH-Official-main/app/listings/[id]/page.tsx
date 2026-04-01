import { notFound } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import InquiryForm from '@/components/listings/InquiryForm'
import { getSiteSettings } from '@/lib/site-settings'
import { MOCK_LISTINGS, MOCK_PROJECTS } from '@/lib/mock-data'
import { getListingById } from '@/lib/property-search'

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : null

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const settings = await getSiteSettings()
  
  let listingData = await getListingById(Number(id))
  
  if (!listingData) {
    listingData = MOCK_LISTINGS.find(l => l.id === Number(id)) as any
  }

  if (!listingData) notFound()
  const listing = listingData!

  const sortedGallery = [...(listing.property_listing_galleries ?? [])].sort((a: any, b: any) => a.display_order - b.display_order)
  const project = listing.projects?.id ? MOCK_PROJECTS.find(p => p.id === listing.projects?.id) : null
  const amenities = project ? (project.project_amenities ?? []).map((pa: any) => pa.amenities).filter(Boolean) : []
  const unit = listing.project_units
  const isRent = listing.listing_type === 'rent'

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: Main Content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero image */}
            <div className="h-72 sm:h-96 bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {sortedGallery.length > 0
                ? <img src={sortedGallery[0].image_url} alt={listing.title} className="h-full w-full object-cover" />
                : <div className="h-full flex items-center justify-center text-sm text-gray-400">No image available</div>}
            </div>

            {/* Gallery thumbnails */}
            {sortedGallery.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {sortedGallery.slice(1).map((g: any, i) => (
                  <div key={i} className="h-20 rounded-xl overflow-hidden bg-gray-100">
                    <img src={g.image_url} alt={g.title ?? listing.title} className="h-full w-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                ))}
              </div>
            )}

            {/* Title + Price Block */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${isRent ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                  {isRent ? 'For Rent' : 'For Sale'}
                </span>
                {listing.is_featured && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">⭐ Featured</span>
                )}
                {listing.negotiable && (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Negotiable</span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900">{listing.title}</h1>
              <p className="text-2xl font-bold text-[#1428ae] mt-2">
                {fmt(listing.price) ?? 'Price on request'}
                {isRent && <span className="text-sm font-normal text-gray-400"> /month</span>}
              </p>

              {listing.description && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">{listing.description}</p>
              )}

              {/* Unit specifications */}
              {unit && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-5">
                  {unit.floor_area_sqm != null && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-900 text-sm">{unit.floor_area_sqm} sqm</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Floor Area</p>
                    </div>
                  )}
                  {unit.lot_area_sqm != null && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-900 text-sm">{unit.lot_area_sqm} sqm</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Lot Area</p>
                    </div>
                  )}
                  {unit.bedrooms != null && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-900 text-sm">{unit.bedrooms === 0 ? 'Studio' : unit.bedrooms}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Bedroom{unit.bedrooms !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {unit.bathrooms != null && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-900 text-sm">{unit.bathrooms}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Bathroom{unit.bathrooms !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {unit.has_parking != null && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-900 text-sm">{unit.has_parking ? 'Yes' : 'No'}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Parking</p>
                    </div>
                  )}
                  {unit.is_furnished && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-gray-100 text-sm">{unit.is_furnished}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Furnished</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project Details */}
            {project && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-gray-900">Part of a Project</h2>
                <Link href={`/projects/${project.slug}`}
                  className="flex items-center gap-4 bg-[#1428ae]/5 rounded-xl p-4 hover:bg-[#1428ae]/10 transition-colors">
                  {project.main_image_url && (
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                      <img src={project.main_image_url} alt={project.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#1428ae]">{project.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{[project.city_municipality, project.province].filter(Boolean).join(', ')}</p>
                    <p className="text-xs font-medium text-amber-600 mt-0.5">View full project details →</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Project Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a: any) => (
                    <span key={a.id} className="px-3 py-1.5 rounded-full bg-[#1428ae]/8 text-[#1428ae] text-xs font-medium border border-[#1428ae]/10">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Location</h2>
              <p className="text-sm text-gray-600">
                {[listing.projects?.barangay, listing.projects?.city_municipality, listing.projects?.province, listing.projects?.region].filter(Boolean).join(', ')}
              </p>
              {/* Map placeholder */}
              <div className="mt-4 h-40 bg-gradient-to-br from-[#1428ae]/10 to-[#1428ae]/5 rounded-xl flex items-center justify-center">
                <p className="text-xs text-gray-400">Map view coming soon</p>
              </div>
            </div>
          </div>

          {/* ── Right: Sticky Inquiry Form ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Inquire about this property</h2>
              <p className="text-xs text-gray-400 mb-4">Our team will get back to you within 24 hours.</p>
              <InquiryForm listingId={listing.id} listingTitle={listing.title} />

              {/* Price summary */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Asking Price</span>
                  <span className="font-bold text-gray-900">{fmt(listing.price) ?? 'TBD'}{isRent ? '/mo' : ''}</span>
                </div>
                {listing.negotiable && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">Price is negotiable</p>
                )}
              </div>

              {/* Quick links */}
              <div className="mt-4 space-y-2">
                <Link href="/mortgage"
                  className="flex items-center justify-between w-full text-xs text-[#1428ae] border border-[#1428ae]/20 rounded-lg px-3 py-2 hover:bg-[#1428ae]/5 transition-colors">
                  <span>Calculate mortgage</span>
                  <span>→</span>
                </Link>
                <Link href="/legal"
                  className="flex items-center justify-between w-full text-xs text-[#1428ae] border border-[#1428ae]/20 rounded-lg px-3 py-2 hover:bg-[#1428ae]/5 transition-colors">
                  <span>View legal guide</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
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
