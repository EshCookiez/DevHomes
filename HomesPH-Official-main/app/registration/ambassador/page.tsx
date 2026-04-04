import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import AmbassadorRegisterForm from '@/components/auth/AmbassadorRegisterForm'

export default async function AmbassadorRegisterPage() {
  const settings = await getSiteSettings()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SiteHeader
        logoText={settings.siteTitle}
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="flex-1 flex flex-col lg:flex-row">

        {/* ── Mobile / Tablet brand strip (hidden on lg+) ─────── */}
        <div className="lg:hidden relative bg-gradient-to-br from-[#0c1f4a] via-[#0f2856] to-[#052539] px-6 pt-10 pb-20 text-center overflow-hidden select-none">
          <div className="pointer-events-none absolute -top-14 -right-14 w-52 h-52 rounded-full bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#f59e0b]/[0.07]" />
          <div className="pointer-events-none absolute top-8 left-8 w-16 h-16 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute bottom-10 right-12 w-10 h-10 rounded-full border border-[#f59e0b]/20" />
          <div className="relative z-10">
            <p className="text-[#f59e0b] font-bold text-[10px] tracking-[0.28em] uppercase mb-3">
              Become a Partner
            </p>
            <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight tracking-tight">
              Promote Properties
              <br />
              <span className="text-[#f59e0b]">Earn Commissions</span>
            </h2>
            <p className="text-blue-200/70 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
              Join our Ambassador Program and get rewarded for every successful client referral you make.
            </p>
          </div>
        </div>

        {/* ── Left: Brand panel (lg+) ──────────────────────────── */}
        <div className="hidden lg:flex lg:w-[60%] xl:w-[55%] relative bg-gradient-to-br from-[#0c1f4a] via-[#0f2856] to-[#052539] overflow-hidden select-none">
          <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-white/[0.04]" />
          <div className="pointer-events-none absolute top-1/3 -right-10 w-52 h-52 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-[#f59e0b]/[0.07]" />
          <div className="pointer-events-none absolute bottom-32 right-10 w-28 h-28 rounded-full border border-[#f59e0b]/20" />

          <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col justify-between p-14 xl:p-20">
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[#f59e0b] font-bold text-xs tracking-[0.25em] uppercase mb-5">
                Brand Ambassador
              </p>
              <h2 className="text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight text-white">
                Share. Refer.
                <br />
                <span className="text-[#f59e0b]">Earn Rewards</span>
                <br />
                Easily.
              </h2>
              <p className="mt-6 text-blue-200/80 text-base xl:text-lg max-w-sm leading-relaxed">
                Unlock exclusive marketing tools, custom referral codes, and earn competitive commissions just by referring buyers to premium developments.
              </p>
              <div className="flex items-center gap-6 mt-8">
                <div>
                  <p className="text-white font-black text-2xl leading-none">High</p>
                  <p className="text-blue-300/60 text-xs mt-1">Commission Rates</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white font-black text-2xl leading-none">100+</p>
                  <p className="text-blue-300/60 text-xs mt-1">Premium Projects</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-white font-black text-2xl leading-none">Free</p>
                  <p className="text-blue-300/60 text-xs mt-1">Marketing Tools</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-6">
              <svg className="text-[#f59e0b] mb-3" width="24" height="18" viewBox="0 0 24 18" fill="currentColor">
                <path d="M0 18V10.5C0 6.9 1.35 3.9 4.05 1.5 5.4.5 6.9 0 8.55 0L9.6 1.5C7.8 2.1 6.375 3.15 5.325 4.65 4.275 6.15 3.75 7.8 3.75 9.6H6.75V18H0zm13.5 0V10.5c0-3.6 1.35-6.6 4.05-9C18.9.5 20.4 0 22.05 0L23.1 1.5c-1.8.6-3.225 1.65-4.275 3.15-1.05 1.5-1.575 3.15-1.575 4.95h3V18H13.5z" />
              </svg>
              <p className="text-blue-100/90 text-sm leading-relaxed italic">
                "The ambassador program is so easy to use! My custom referral codes track everything for me, making it completely hassle-free."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-white text-xs font-black">
                  JD
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Jane Doe</p>
                  <p className="text-blue-300/60 text-xs">Official Ambassador</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form panel ── */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-5 pb-12 pt-0 lg:py-14 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="w-full flex justify-center -mt-10 lg:mt-0">
            <AmbassadorRegisterForm />
          </div>
        </div>

      </main>

      <SiteFooter
        brandName={settings.siteTitle}
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />
    </div>
  )
}
