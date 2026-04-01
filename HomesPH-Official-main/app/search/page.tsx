import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { MOCK_LISTINGS, MOCK_PROJECTS, MOCK_LOCATIONS } from '@/lib/mock-data'
import AdBanner from '@/components/ui/AdBanner'

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : null

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; location?: string; min?: string; max?: string; beds?: string }>
}) {
  const sp = await searchParams
  const settings = await getSiteSettings()
  const { q, type, location, min, max, beds } = sp

  let projects = [...MOCK_PROJECTS]
  let listings = MOCK_LISTINGS.filter(l => l.status === 'published')

  if (q) {
    projects = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.city_municipality?.toLowerCase().includes(q.toLowerCase()))
    listings = listings.filter(l => l.title.toLowerCase().includes(q.toLowerCase()) || l.projects?.city_municipality?.toLowerCase().includes(q.toLowerCase()))
  }
  if (location) {
    projects = projects.filter(p => p.province?.toLowerCase().includes(location.toLowerCase()) || p.city_municipality?.toLowerCase().includes(location.toLowerCase()))
    listings = listings.filter(l => l.projects?.province?.toLowerCase().includes(location.toLowerCase()))
  }
  if (type && type !== 'all') listings = listings.filter(l => l.listing_type === type)
  if (min) listings = listings.filter(l => l.price >= Number(min))
  if (max) listings = listings.filter(l => l.price <= Number(max))
  if (beds) listings = listings.filter(l => (l.project_units?.bedrooms ?? 0) >= Number(beds))

  const hasResults = projects.length > 0 || listings.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* ── Page Title ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Search Results</p>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {q ? `Results for "${q}"` : 'Browse All Properties'}
          </h1>
          {hasResults && (
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {listings.length} listing{listings.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* ── Filter bar ── */}
        <form method="GET" action="/search" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              name="q" defaultValue={q}
              placeholder="Search projects, properties…"
              className="col-span-2 sm:col-span-3 lg:col-span-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30"
            />
            <select name="location" defaultValue={location ?? ''} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30">
              <option value="">All Locations</option>
              {MOCK_LOCATIONS.map(loc => (
                <option key={loc.slug} value={loc.slug}>{loc.title}</option>
              ))}
            </select>
            <select name="type" defaultValue={type ?? 'all'} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30">
              <option value="all">Buy &amp; Rent</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <select name="beds" defaultValue={beds ?? ''} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30">
              <option value="">Any bedrooms</option>
              <option value="1">1+ bed</option>
              <option value="2">2+ beds</option>
              <option value="3">3+ beds</option>
            </select>
            <div className="flex gap-1.5">
              <input name="min" defaultValue={min} placeholder="Min ₱" className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30" />
              <input name="max" defaultValue={max} placeholder="Max ₱" className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30" />
            </div>
          </div>
          <button type="submit" className="mt-4 w-full sm:w-auto px-8 rounded-xl bg-[#1428ae] text-white font-semibold text-sm py-2.5 hover:bg-amber-500 transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-12">
            {/* ── Projects Section ── */}
        {projects.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Projects <span className="text-gray-400 font-normal text-sm">({projects.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map(p => (
                <Link key={p.id} href={`/projects/${p.slug}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    {p.main_image_url
                      ? <img src={p.main_image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="h-full flex items-center justify-center text-sm text-gray-400">No image</div>}
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{p.status}</span>
                    <div className="font-semibold text-sm text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.developers_profiles?.developer_name}</div>
                    <div className="text-xs text-gray-500">{[p.city_municipality, p.province].filter(Boolean).join(', ')}</div>
                    {(p.price_range_min || p.price_range_max) && (
                      <div className="text-xs font-semibold text-[#1428ae]">
                        {[fmt(p.price_range_min), fmt(p.price_range_max)].filter(Boolean).join(' – ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Listings Section ── */}
        {listings.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Listings <span className="text-gray-400 font-normal text-sm">({listings.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(l => {
                const thumb = l.property_listing_galleries?.[0]?.image_url
                const unit = l.project_units
                const loc = [l.projects?.city_municipality, l.projects?.province].filter(Boolean).join(', ')
                const isRent = l.listing_type === 'rent'
                return (
                  <Link key={l.id} href={`/listings/${l.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      {thumb && <img src={thumb} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                      <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${isRent ? 'bg-blue-600' : 'bg-green-600'}`}>
                        {isRent ? 'For Rent' : 'For Sale'}
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="font-semibold text-sm text-gray-900 line-clamp-2">{l.title}</div>
                      {loc && <div className="text-xs text-gray-400">📍 {loc}</div>}
                      <div className="text-sm font-bold text-[#1428ae]">
                        {fmt(l.price) ?? 'Price on request'}{isRent ? '/mo' : ''}
                      </div>
                      {unit && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
                          {unit.bedrooms != null && <span>{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}</span>}
                          {unit.bathrooms != null && <span>{unit.bathrooms} bath</span>}
                          {unit.floor_area_sqm && <span>{unit.floor_area_sqm} sqm</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

            {/* ── Empty state ── */}
            {!hasResults && (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                <div className="text-6xl mb-6 opacity-60">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Try adjusting your search terms, changing the location, or removing some filters.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link href="/buy" className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">Browse For Sale</Link>
                  <Link href="/rent" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Browse For Rent</Link>
                  <Link href="/projects" className="px-5 py-2.5 bg-[#1428ae] text-white rounded-xl text-sm font-semibold hover:bg-amber-500 transition-colors">Browse Projects</Link>
                </div>
              </div>
            )}
          </div>
          
          {/* ── Sidebar Ads ── */}
          <div className="hidden lg:flex flex-col gap-6 w-[300px] shrink-0">
            <div className="sticky top-24 space-y-6">
              <AdBanner sizes={['300x250']} />
              <AdBanner sizes={['160x600']} />
            </div>
          </div>
        </div>
      </main>

      <AdBanner />

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
