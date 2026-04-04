import { notFound } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { getPublicDeveloperBySlug } from '@/lib/developers-public'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Search, ChevronDown } from 'lucide-react'
import UnifiedListingCard from '@/components/listings/UnifiedListingCard'

function EmailActionIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function PhoneActionIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.62 10.79a15.07 15.07 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.2 2.2Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function ShareActionIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="3" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const next = value?.trim()
    if (!next) continue
    if (seen.has(next)) continue
    seen.add(next)
    out.push(next)
  }
  return out
}

export default async function DeveloperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params
  const [settings, bundle, supabase] = await Promise.all([
    getSiteSettings(),
    getPublicDeveloperBySlug(slug),
    createServerSupabaseClient(),
  ])

  if (!bundle) notFound()

  const { developer: dev, addresses, projects: devProjects, contactInformation } = bundle

  const { data: listingsRows } = await supabase
    .from('property_listings')
    .select(`
      id,
      title,
      listing_type,
      price,
      status,
      created_at,
      projects (
        name,
        city_municipality,
        province,
        project_type,
        main_image_url
      ),
      project_units (
        bedrooms,
        bathrooms,
        floor_area_sqm
      ),
      property_listing_galleries (
        image_url,
        display_order
      )
    `)
    .eq('developer_id', dev.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(4)

  const activeListings = ((listingsRows ?? []) as any[]).map((row) => {
    const gallery = [...(row.property_listing_galleries ?? [])].sort(
      (left: any, right: any) => (left.display_order ?? 0) - (right.display_order ?? 0)
    )
    return {
      id: row.id,
      title: row.title,
      listingType: row.listing_type,
      price: row.price,
      project: row.projects,
      unit: row.project_units,
      image: gallery[0]?.image_url ?? row.projects?.main_image_url ?? null,
    }
  })

  const propertyTypes = uniqueStrings(devProjects.map((project) => project.project_type))
  const serviceAreas = uniqueStrings(
    devProjects.flatMap((project) => [project.city_municipality, project.province])
  )
  const saleCount = activeListings.filter((listing) => listing.listingType === 'sale').length
  const rentCount = activeListings.filter((listing) => listing.listingType === 'rent').length
  const listingCount = activeListings.length
  const primaryAddress = addresses[0]?.city ?? addresses[0]?.full_address ?? 'Manila, Philippines'

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="w-full">
        <section
          style={{
            background: 'linear-gradient(90deg, #B7B8D3 0%, #E7ECF5 100%)',
            borderBottom: '1px solid #D3D3D3',
            fontFamily: 'Outfit, sans-serif',
          }}
          className="min-h-[355px]"
        >
          <div className="mx-auto w-full max-w-[1920px] lg:relative lg:h-[355px]">
            <div className="flex flex-col gap-6 px-4 pt-10 pb-8 sm:flex-row sm:items-start sm:gap-[40px] lg:hidden">
              <div className="h-[220px] w-[220px] rounded-[10px] bg-white md:h-[275px] md:w-[275px]">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#D9D9D9]">
                  <img
                    src={dev.logo_url ?? undefined}
                    alt={dev.developer_name}
                    className="h-[140px] w-[140px] object-contain md:h-[178px] md:w-[178px]"
                  />
                </div>
              </div>

              <div className="space-y-[15px]">
                <div className="inline-flex h-[61px] items-center rounded-[10px] bg-white px-[15px]">
                  <h1 className="text-[30px] font-medium leading-[30px] text-[#002143]">
                    {dev.developer_name}
                  </h1>
                </div>

                <div className="inline-flex h-[30px] items-center rounded-[6px] bg-white px-[15px] text-[15px] font-normal leading-[15px] text-[#002143]">
                  Properties - {listingCount}
                </div>

                <div className="flex flex-wrap gap-[14px] pt-[20px]">
                  <button className="inline-flex h-[50px] w-[110px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                    <EmailActionIcon />
                    Email
                  </button>
                  <button className="inline-flex h-[50px] w-[98px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                    <PhoneActionIcon />
                    Call
                  </button>
                  <button className="inline-flex h-[50px] w-[236px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                    <ShareActionIcon />
                    Share Agency Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="relative hidden h-[355px] w-full lg:block">
              <div className="absolute left-[296px] top-[40px] h-[275px] w-[275px] rounded-[10px] bg-white">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#D9D9D9]">
                  <img
                    src={dev.logo_url ?? undefined}
                    alt={dev.developer_name}
                    className="h-[178px] w-[178px] object-contain"
                  />
                </div>
              </div>

              <div className="absolute left-[611px] top-[84px] inline-flex h-[61px] items-center rounded-[10px] bg-white px-[15px]">
                <h1 className="text-center text-[30px] font-medium leading-[30px] text-[#002143]">
                  {dev.developer_name}
                </h1>
              </div>

              <div className="absolute left-[611px] top-[160px] inline-flex h-[30px] items-center rounded-[6px] bg-white px-[15px] text-center text-[15px] font-normal leading-[15px] text-[#002143]">
                Properties - {listingCount}
              </div>

              <div className="absolute left-[611px] top-[220px] flex h-[50px] w-[473px] items-center gap-[14px]">
                <button className="inline-flex h-[50.27px] w-[109.58px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                  <EmailActionIcon />
                  Email
                </button>
                <button className="inline-flex h-[50.27px] w-[97.51px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                  <PhoneActionIcon />
                  Call
                </button>
                <button className="inline-flex h-[50px] w-[236px] items-center justify-center gap-2 rounded-[10px] bg-[#1428AE] text-[18px] font-normal leading-[18px] text-white">
                  <ShareActionIcon />
                  Share Agency Profile
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1328px] px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[945px_351px] lg:items-start">
            <div>
              <div className="grid gap-3 lg:grid-cols-[512px_197px_217px]">
                <div className="flex h-[55px] items-center rounded-[10px] border border-[#D3D3D3] px-4">
                  <Search size={18} className="text-[#002143]" />
                  <input
                    type="text"
                    placeholder="City, community or building"
                    className="ml-3 w-full border-none bg-transparent text-[20px] font-light text-[#002143] outline-none"
                  />
                </div>
                <button className="flex h-[55px] items-center justify-between rounded-[10px] border border-[#D3D3D3] px-4 text-[22px] font-light text-[#002143]">
                  Residential
                  <ChevronDown size={24} />
                </button>
                <button className="flex h-[55px] items-center justify-between rounded-[10px] border border-[#D3D3D3] px-4 text-[22px] font-light text-[#002143]">
                  Beds & Baths
                  <ChevronDown size={24} />
                </button>
              </div>

              <div className="mt-10">
                <h2 className="text-[30px] font-normal leading-[30px] text-[#1428AE]">Active Listings</h2>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[22px] font-light text-[#5E748B]">
                    Showing 1 - {activeListings.length} of {activeListings.length} Properties
                  </p>
                  <button className="flex h-[45px] items-center gap-2 rounded-[10px] border border-[#D3D3D3] px-4 text-[18px] font-light text-[#002143]">
                    Popular <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-7 space-y-5">
                {activeListings.map((listing) => {
                  const locationText = [
                    listing.project?.city_municipality,
                    listing.project?.province,
                    'Philippines',
                  ].filter(Boolean).join(', ')

                  const tags = [
                    listing.title,
                    'High Finishing',
                    'Prime Location',
                  ].filter(Boolean) as string[]

                  return (
                    <UnifiedListingCard
                      key={listing.id}
                      variant="buy-rent"
                      href={`/listings/${listing.id}`}
                      imageUrl={listing.image || 'https://via.placeholder.com/460x314'}
                      developerLogoUrl={dev.logo_url ?? undefined}
                      developerName={dev.developer_name}
                      location={locationText || 'Philippines'}
                      price={listing.price}
                      propertyType={listing.project?.project_type}
                      bedrooms={listing.unit?.bedrooms}
                      bathrooms={listing.unit?.bathrooms}
                      areaSqm={listing.unit?.floor_area_sqm}
                      listingTitle={listing.title}
                      tags={tags}
                      className="w-full max-w-[946px]"
                    />
                  )
                })}

                {activeListings.length === 0 ? (
                  <div className="rounded-[10px] border border-[#D3D3D3] bg-white p-10 text-center text-[#5E748B]">
                    No active listings for this developer yet.
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="pt-1">
              <h3 className="text-[30px] font-normal leading-[30px] text-[#002143]">About</h3>
              <div className="mt-5 space-y-5 text-[18px] leading-[25px] text-[#002143]">
                <div>
                  <p className="text-[20px] font-medium leading-[20px]">Property Types:</p>
                  <p className="mt-3 text-[18px] font-light leading-[18px]">
                    {propertyTypes.length > 0 ? propertyTypes.slice(0, 4).join(', ') : 'Apartments, Offices, Condominium'}
                  </p>
                </div>
                <div>
                  <p className="text-[20px] font-medium leading-[20px]">Service Area:</p>
                  <p className="mt-3 text-[18px] font-light leading-[18px]">
                    {serviceAreas.length > 0 ? serviceAreas.slice(0, 4).join(', ') : primaryAddress}
                  </p>
                </div>
                <div>
                  <p className="text-[20px] font-medium leading-[20px]">Properties:</p>
                  <p className="mt-3 text-[18px] font-light leading-[18px]">
                    For Sale ({saleCount}){rentCount > 0 ? `, For Rent (${rentCount})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[20px] font-medium leading-[20px]">Description:</p>
                  <p className="mt-3 text-[18px] font-light leading-[25px]">
                    {(dev.description ?? '').slice(0, 170)}{(dev.description ?? '').length > 170 ? '...' : ''}
                  </p>
                  {dev.description && dev.description.length > 170 ? (
                    <a href="#" className="mt-2 inline-block text-[18px] font-medium text-[#1428AE]">Read more</a>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>

        </section>
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
