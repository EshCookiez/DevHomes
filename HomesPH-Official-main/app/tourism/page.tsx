import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getSiteSettings } from '@/lib/site-settings'
import { MOCK_LOCATIONS } from '@/lib/mock-data'
import { getArticles as getArticlesFromAPI } from '@/lib/hybrid-articles'

interface TourismArticle {
  id: string | number
  title: string
  slug: string
  summary?: string
  excerpt?: string
  description?: string
  category?: string
  image_url?: string
  image?: string
  location?: string
  published_at: string
  tags?: string[]
}

async function getTourismArticles(): Promise<TourismArticle[]> {
  try {
    const result = await getArticlesFromAPI({
      category_slug: 'tourism',
      per_page: 50,
      page: 1,
    })
    return result.data.data.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      excerpt: article.summary,
      description: article.description,
      category: article.category,
      image_url: article.image,
      image: article.image,
      location: article.location || article.city_name || '',
      published_at: article.published_at,
      tags: article.topics ?? [],
    }))
  } catch (error) {
    console.error('[Tourism] Failed to fetch tourism articles:', error)
    return []
  }
}

export default async function TourismPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const { location } = await searchParams
  const settings = await getSiteSettings()
  const articles = await getTourismArticles()

  const filtered = articles.filter(a => {
    const matchLoc = !location ? true : (a.location ?? '').toLowerCase().includes(location.toLowerCase())
    return matchLoc
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
      <section className="relative bg-[#0c1f4a] overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/tourismhero/1400/500')] bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Lifestyle & Travel</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">Explore the Philippines</h1>
          <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">
            From pristine beaches and heritage sites to urban playgrounds — discover the best destinations across the Philippine archipelago.
          </p>
        </div>
      </section>

      {/* ── Quick Stats ── */}
      <div className="bg-[#1428ae] py-5">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/20 text-center">
          {[
            { value: '7,641', label: 'Islands' },
            { value: '82', label: 'Provinces' },
            { value: '2', label: 'UNESCO Sites' },
          ].map(s => (
            <div key={s.label} className="px-4">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            {MOCK_LOCATIONS.slice(0, 5).map(loc => (
              <Link key={loc.slug}
                href={`/tourism?location=${loc.slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  location === loc.slug ? 'bg-amber-400 text-[#1428ae] border-amber-400' : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300'
                }`}
              >
                {loc.title}
              </Link>
            ))}
            {location && <Link href="/tourism" className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">Clear ×</Link>}
          </div>
        </div>

        {/* ── Articles Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <Link key={article.id} href={`/news/${article.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-[#1428ae]/20 transition-all">
                <div className="h-52 overflow-hidden bg-gray-100 relative">
                  {(article.image_url || article.image) && (
                    <img src={article.image_url || article.image} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {article.category && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full text-white bg-blue-500">
                      {article.category}
                    </span>
                  )}
                  {article.location && (
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-[10px] font-medium flex items-center gap-1">
                        <span>📍</span> {article.location}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#1428ae] transition-colors line-clamp-2">{article.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{article.summary || article.description || ''}</p>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {article.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🌴</div>
            <p className="font-semibold text-gray-600">Currently No Article Found</p>
            <Link href="/tourism" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#1428ae] text-white text-sm font-semibold">
              View All
            </Link>
          </div>
        )}

        {/* ── Island Groups ── */}
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Explore by Island Group</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: 'Luzon', icon: '🏙️',
                highlights: ['Bonifacio Global City', 'La Union Surf Beaches', 'Pampanga Food Trail', 'Banaue Rice Terraces', 'Tagaytay Lake Views'],
                color: 'from-blue-600 to-[#1428ae]',
                image: 'https://picsum.photos/seed/luzon/600/400',
              },
              {
                name: 'Visayas', icon: '🏖️',
                highlights: ['Cebu Kawasan Falls', 'Bohol Chocolate Hills', 'Iloilo Heritage Churches', 'Bacolod City of Smiles', 'Panglao White Beaches'],
                color: 'from-teal-500 to-blue-600',
                image: 'https://picsum.photos/seed/visayas/600/400',
              },
              {
                name: 'Mindanao', icon: '🌿',
                highlights: ['Mount Apo Summit', 'Davao Eagle Reserve', 'Cagayan de Oro Rafting', 'GenSan Tuna Festival', 'Lake Sebu Zipline'],
                color: 'from-green-600 to-teal-600',
                image: 'https://picsum.photos/seed/mindanao/600/400',
              },
            ].map(group => (
              <div key={group.name} className="relative rounded-2xl overflow-hidden h-60 group cursor-pointer">
                <img src={group.image} alt={group.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-t ${group.color} opacity-70`} />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <div className="text-3xl mb-1">{group.icon}</div>
                  <h3 className="text-xl font-extrabold text-white">{group.name}</h3>
                  <ul className="mt-2 space-y-0.5">
                    {group.highlights.slice(0, 3).map(h => (
                      <li key={h} className="text-white/80 text-xs">• {h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Real Estate + Tourism Connection ── */}
        <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Invest Where You Love</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Live Near Your Favorite Destination</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                The Philippines' most beautiful places often overlap with its most exciting real estate markets.
                Whether you're drawn to the beaches of Cebu, the peaks of Davao, or the urban energy of BGC — 
                there's a property investment waiting for you.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/projects" className="px-4 py-2.5 rounded-xl bg-[#1428ae] text-white text-sm font-semibold hover:bg-amber-500 hover:text-[#1428ae] transition-colors">
                  Browse Projects
                </Link>
                <Link href="/buy" className="px-4 py-2.5 rounded-xl border border-[#1428ae]/20 text-[#1428ae] text-sm font-semibold hover:bg-[#1428ae]/5 transition-colors">
                  Buy Property
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_LOCATIONS.slice(0, 4).map(loc => (
                <Link key={loc.slug} href={`/${loc.slug}`}
                  className="block bg-gray-50 rounded-xl p-4 hover:bg-[#1428ae]/5 hover:border-[#1428ae]/20 border border-transparent transition-all">
                  <p className="font-bold text-sm text-gray-900">{loc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{loc.description}</p>
                  <p className="text-xs text-[#1428ae] font-medium mt-2">Explore →</p>
                </Link>
              ))}
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
