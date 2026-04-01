import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import { MOCK_DEVELOPERS, MOCK_PROJECTS } from '@/lib/mock-data'
import AdBanner from '@/components/ui/AdBanner'

export default async function DevelopersPage() {
  const settings = await getSiteSettings()
  const projectCounts: Record<number, number> = {}
  for (const p of MOCK_PROJECTS) {
    if (p.developer_id) projectCounts[p.developer_id] = (projectCounts[p.developer_id] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      {/* ── Hero ── */}
      <section className="bg-[#0c1f4a] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Trusted Partners</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Leading Real Estate Developers
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto">
            Discover the most trusted property developers in the Philippines — building homes, communities, and legacies across the archipelago.
          </p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="bg-[#1428ae] py-5">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/20 text-center">
          {[
            { value: `${MOCK_DEVELOPERS.length}+`, label: 'Partner Developers' },
            { value: '99K+', label: 'Total Units Built' },
            { value: '25+', label: 'Provinces Served' },
          ].map(s => (
            <div key={s.label} className="px-4">
              <p className="text-xl sm:text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Developers</h2>
                <p className="text-sm text-gray-500 mt-0.5">{MOCK_DEVELOPERS.length} registered developers on HomesPH</p>
              </div>
            </div>

            {/* ── Developers Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_DEVELOPERS.map(dev => (
            <Link key={dev.id} href={`/developers/${dev.id}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#1428ae]/20 transition-all duration-300 overflow-hidden flex flex-col">
              {/* Cover */}
              <div className="h-32 bg-gradient-to-br from-[#1428ae]/10 to-[#1428ae]/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/devbg/800/300')] bg-cover bg-center opacity-10" />
                <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                  <img src={dev.logo_url ?? undefined} alt={dev.developer_name} className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1428ae] transition-colors">{dev.developer_name}</h3>
                <p className="text-xs text-amber-600 font-medium mt-0.5 mb-2">{dev.industry}</p>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">{dev.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-[#1428ae]">{dev.stats.projects}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Projects</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1428ae]">{dev.stats.units >= 1000 ? `${(dev.stats.units/1000).toFixed(1)}K` : dev.stats.units}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Units</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1428ae]">{dev.stats.provinces}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Provinces</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Est. {dev.founded}</span>
                  <span className="text-xs font-semibold text-[#1428ae] group-hover:text-amber-500 transition-colors">View Profile →</span>
                </div>
              </div>
              </Link>
            ))}
          </div>
          </div>
          
          {/* ── Sidebar Ads ── */}
          <div className="hidden lg:flex flex-col gap-6 w-[300px] shrink-0">
            <div className="sticky top-24 space-y-6">
              <AdBanner sizes={['300x250']} />
              <AdBanner sizes={['160x600']} />
            </div>
          </div>
        </div>

        {/* ── Ask About a Developer ── */}
        <div className="mt-16 bg-[#1428ae] rounded-2xl px-8 py-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Don't See Your Developer?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            We're constantly expanding our network of trusted developers. If you'd like to know more about a specific developer not listed here, reach out to us.
          </p>
          <Link href="/our-company"
            className="inline-block bg-amber-400 text-[#1428ae] font-bold text-sm px-6 py-3 rounded-xl hover:bg-amber-300 transition-colors">
            Contact HomesPH
          </Link>
        </div>

        {/* ── Why Work with Registered Developers ── */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Buy from HomesPH-Listed Developers?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🏛️', title: 'DHSUD Registered', body: 'All developers are verified with the Department of Human Settlements and Urban Development.' },
              { icon: '🔎', title: 'Due Diligence Done', body: 'We verify licenses, track records, and project completion history before listing any developer.' },
              { icon: '📄', title: 'Clean Titles', body: 'Projects from our listed developers come with clean CCTs or TCTs, mortgage disclosures, and legal transparency.' },
              { icon: '🤝', title: 'After-Sales Support', body: 'Our developers maintain active after-sales teams to assist buyers post-purchase.' },
              { icon: '💰', title: 'Financing Access', body: 'Get access to in-house financing, bank loans, and Pag-IBIG options through our developer partners.' },
              { icon: '🌟', title: 'Quality Construction', body: 'Only developers with proven build quality and positive buyer feedback are featured on HomesPH.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
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

