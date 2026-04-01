import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getSiteSettings } from '@/lib/site-settings'
import { MOCK_RESTAURANTS, MOCK_LOCATIONS } from '@/lib/mock-data'

const CUISINES = ['All', ...Array.from(new Set(MOCK_RESTAURANTS.map(r => r.cuisine)))]
const PRICE_RANGES = ['All', '₱', '₱₱', '₱₱₱', '₱₱₱₱']

export default async function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; price?: string; location?: string }>
}) {
  const { cuisine, price, location } = await searchParams
  const settings = await getSiteSettings()

  const filtered = MOCK_RESTAURANTS.filter(r => {
    const matchCuisine = !cuisine || cuisine === 'All' ? true : r.cuisine === cuisine
    const matchPrice = !price || price === 'All' ? true : r.price_range === price
    const matchLoc = !location ? true : r.location.toLowerCase().includes(location.toLowerCase())
    return matchCuisine && matchPrice && matchLoc
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      {/* ── Hero ── */}
      <section className="bg-[#0c1f4a] relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 opacity-15 bg-[url('https://picsum.photos/seed/restohero/1400/500')] bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Dining Guide</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Best Restaurants in the Philippines
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            From world-class fine dining to beloved street-food institutions — explore the best places to eat across every location we serve.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cuisine */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Cuisine</p>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map(c => (
                  <Link key={c}
                    href={c === 'All'
                      ? `/restaurants${price && price !== 'All' ? `?price=${price}` : ''}${location ? `${price && price !== 'All' ? '&' : '?'}location=${location}` : ''}`
                      : `/restaurants?cuisine=${encodeURIComponent(c)}${price && price !== 'All' ? `&price=${price}` : ''}${location ? `&location=${location}` : ''}`
                    }
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      (cuisine === c || (!cuisine && c === 'All'))
                        ? 'bg-[#1428ae] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-[#1428ae]/10 hover:text-[#1428ae]'
                    }`}
                  >{c}</Link>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Price Range</p>
              <div className="flex gap-1.5">
                {PRICE_RANGES.map(p => (
                  <Link key={p}
                    href={p === 'All'
                      ? `/restaurants${cuisine && cuisine !== 'All' ? `?cuisine=${cuisine}` : ''}${location ? `${cuisine && cuisine !== 'All' ? '&' : '?'}location=${location}` : ''}`
                      : `/restaurants?price=${encodeURIComponent(p)}${cuisine && cuisine !== 'All' ? `&cuisine=${cuisine}` : ''}${location ? `&location=${location}` : ''}`
                    }
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      (price === p || (!price && p === 'All'))
                        ? 'bg-amber-400 text-[#1428ae] border-amber-400'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                  >{p}</Link>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Location</p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_LOCATIONS.slice(0, 5).map(loc => (
                  <Link key={loc.slug}
                    href={`/restaurants?location=${loc.slug}${cuisine && cuisine !== 'All' ? `&cuisine=${cuisine}` : ''}${price && price !== 'All' ? `&price=${price}` : ''}`}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      location === loc.slug
                        ? 'bg-[#0c1f4a] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >{loc.title}</Link>
                ))}
                {location && (
                  <Link href="/restaurants" className="text-[10px] px-2.5 py-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100">Clear ×</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Results Count ── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">{filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* ── Restaurants Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(r => (
              <div key={r.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-[#1428ae]/20 transition-all">
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img src={r.image_url} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                    <span className="text-amber-500 text-xs">⭐</span>
                    <span className="text-xs font-bold text-gray-900">{r.rating}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{r.price_range}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#1428ae] transition-colors">{r.name}</h3>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">{r.cuisine}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">📍 {r.location}</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{r.description}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 font-medium">Hours</p>
                      <p className="text-gray-700 font-semibold mt-0.5">{r.hours}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Phone</p>
                      <a href={`tel:${r.phone}`} className="text-[#1428ae] font-semibold hover:underline mt-0.5 block">{r.phone}</a>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                    ))}
                  </div>

                  {/* Link to location page */}
                  <Link href={`/${r.location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-')}`}
                    className="block mt-3 text-center text-xs font-semibold text-[#1428ae] py-2 border border-[#1428ae]/20 rounded-lg hover:bg-[#1428ae] hover:text-white transition-colors">
                    Properties near {r.location.split(',')[0].trim()} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="font-semibold text-gray-600">No restaurants match your filters</p>
            <Link href="/restaurants" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#1428ae] text-white text-sm font-semibold">
              View All Restaurants
            </Link>
          </div>
        )}

        {/* ── Price Guide ── */}
        <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Price Range Guide</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { range: '₱', label: 'Budget', desc: 'Under ₱300/person. Street food, fast casual, local eateries.' },
              { range: '₱₱', label: 'Moderate', desc: '₱300–800/person. Casual restaurants and local favorites.' },
              { range: '₱₱₱', label: 'Upscale', desc: '₱800–2,000/person. Quality dining, curated menus.' },
              { range: '₱₱₱₱', label: 'Fine Dining', desc: '₱2,000+/person. Award-winning, experience-driven cuisine.' },
            ].map(p => (
              <div key={p.range} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xl font-bold text-amber-500">{p.range}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{p.label}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 bg-[#1428ae] rounded-2xl px-8 py-9 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Live Near the Best Food in the Philippines</h2>
          <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">Discover the properties closest to your favorite dining destinations.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/projects" className="px-5 py-2.5 rounded-xl bg-amber-400 text-[#1428ae] font-bold text-sm hover:bg-amber-300 transition-colors">Browse Projects</Link>
            <Link href="/tourism" className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors">Explore Tourism</Link>
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
