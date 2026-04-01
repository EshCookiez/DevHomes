import HomeFooter from '@/components/home/HomeFooter'
import HomeHeader from '@/components/home/HomeHeader'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getSiteSettings } from '@/lib/site-settings'

const INTEGRATIONS = [
  'A dynamic property marketplace',
  "A dedicated tourism section celebrating the Philippines’ 7,641 islands",
  'Timely regional news updates',
  'A curated restaurant directory to highlight thriving local communities',
]

const MARKET_PROMISE = [
  'Secure – supported by legal expertise and verified listings',
  'Transparent – guided by ethical practices',
  'Data-driven – powered by nationwide reporting and market intelligence',
]

export default async function OurCompanyPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <HomeHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      <main className="space-y-20 px-4 pb-20">
        <section className="relative overflow-hidden rounded-[48px] border border-slate-100 bg-gradient-to-br from-white via-[#f0f4ff] to-white px-6 py-16 shadow-[0_45px_120px_rgba(20,40,174,0.25)] md:px-12">
          <div className="absolute inset-0 opacity-60" aria-hidden>
            <svg className="absolute -top-12 left-10 h-40 w-40 text-[#f7b500]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="100" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-10 right-20 h-48 w-48 text-[#1428ae]/40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" rx="40" fill="currentColor" />
            </svg>
          </div>
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10">
            <p className="text-xs font-semibold uppercase tracking-[0.6em] text-[#f7b500]">Our mission</p>
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-3xl font-semibold leading-tight text-[#1428ae] md:text-4xl">
                HOME.ph is built on one simple idea: every Filipino deserves a better, safer, and more transparent way to find and invest in property.
              </h1>
              <p className="text-lg text-slate-700 md:text-xl">
                We are a newly launched multimedia property platform with a bold goal — to revolutionize the Philippine real estate industry.
                Our aim is to become one of the country’s most trusted property portals by delivering real value for buyers, sellers, franchises,
                developers, and investors.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-12">
          <div className="space-y-4 rounded-[32px] border border-[#1428ae]/20 bg-white p-8 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-[#f7b500]">Built on Experience and Scale</p>
                <h2 className="text-3xl font-semibold text-[#1428ae]">A legacy of people and presence</h2>
              </div>
              <span className="rounded-full border border-[#1428ae] px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-[#1428ae]">20+ years</span>
            </div>
            <p className="text-base text-slate-600">
              HOME.ph is backed by a management team with more than two decades of Philippine real estate experience. We currently work with over 10,000 real estate practitioners nationwide and operate through 100+ branches that serve as convenient drop-off centers for property owners.
            </p>
            <p className="text-base text-slate-600">
              This strong physical presence bridges the gap between digital listings and real-world service. It ensures that technology is supported by people — real experts who understand local markets.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-[32px] border border-slate-200 bg-[#fdf6e7] p-8 shadow-[0_25px_70px_rgba(247,181,0,0.18)]">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#f7b500]">More Than a Listing Site</p>
              <h3 className="text-2xl font-semibold text-[#1428ae]">An integrated lifestyle platform</h3>
              <p className="text-sm text-slate-700">
                HOME.ph is not just a classifieds platform. We are building a complete ecosystem that supports the entire property journey, connecting property with lifestyle, travel, and local business to craft a richer experience.
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                {INTEGRATIONS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#1428ae]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-[32px] border border-[#1428ae]/30 bg-white p-8 shadow-[0_25px_70px_rgba(20,40,174,0.15)]">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#1428ae]">Legal Protection and Trusted Guidance</p>
              <h3 className="text-2xl font-semibold text-slate-900">Legal Homes</h3>
              <p className="text-sm text-slate-600">
                Through Legal Homes, our in-house legal advisory platform, users gain access to expert insights and podcasts from lawyers representing every region in the country.
                This adds a strong layer of protection and credibility — giving buyers and investors confidence that transactions are guided by professional advice and ethical standards.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-[#f7b500]">Unmatched Local Intelligence</p>
            <h3 className="text-3xl font-semibold text-[#1428ae]">Ground truth built for scale</h3>
            <p className="text-base text-slate-600">
              To deliver accurate and up-to-date information, HOME.ph has deployed 300 trained field reporters across cities nationwide. This on-the-ground network provides verified data, community insights, and real-time updates — something no traditional property portal offers at this scale.
              Combined with our 100+ branches, we are building what we believe is the most accessible and reliable property platform in the country.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[48px] border border-slate-200 bg-gradient-to-br from-white via-[#e6edff] to-white p-10 shadow-[0_35px_80px_rgba(20,40,174,0.2)]">
            <div className="pointer-events-none absolute -top-6 right-10 h-24 w-24 rotate-45 rounded-full bg-[#f7b500]/70 blur-[60px]" aria-hidden />
            <div className="pointer-events-none absolute bottom-6 left-10 h-32 w-32 rounded-full bg-[#1428ae]/40 blur-[80px]" aria-hidden />
            <div className="relative z-10 space-y-6 text-white">
              <p className="text-sm uppercase tracking-[0.5em] text-[#1428ae]">A Secure, Transparent, Data-Driven Marketplace</p>
              <p className="text-lg text-slate-700 md:text-xl">In an industry where trust is everything, HOME.ph is committed to raising standards.</p>
              <ul className="grid gap-4 text-sm text-slate-800 md:grid-cols-3">
                {MARKET_PROMISE.map((item) => (
                  <li key={item} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/60 p-4">
                    <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Commitment</span>
                    <span className="text-base font-semibold text-[#1428ae]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-600">
                For mainstream homebuyers, HOME.ph offers clarity and confidence. For developers, CEOs, and institutional investors, it offers scale, reach, and actionable insight.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl space-y-4 text-center">
          <div className="relative">
            <div className="pointer-events-none absolute -top-6 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-[#f7b500]/50 blur-[50px]" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400">Our promise</p>
          </div>
          <h2 className="text-3xl font-semibold text-[#1428ae] md:text-4xl">
            We are not just listing properties. We are building the future of real estate in the Philippines — one that connects communities, protects stakeholders, and creates lasting value across all 7,641 islands.
          </h2>
          <p className="text-sm text-slate-500">HOME.ph — Where every property story begins.</p>
        </section>
      </main>

      <HomeFooter
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        logoUrl={settings.logoUrl}
      />
    </div>
  )
}
