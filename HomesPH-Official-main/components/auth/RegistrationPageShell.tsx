import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'

export default async function RegistrationPageShell({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        logoText={settings.siteTitle}
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="flex flex-1 flex-col bg-[#0c1f4a]/[0.02] lg:flex-row">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0c1f4a] via-[#0f2856] to-[#052539] lg:flex lg:w-[45%] xl:w-[40%]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-white/[0.04]" />
          <div className="pointer-events-none absolute -right-10 top-1/4 h-40 w-40 rounded-full border border-white/[0.07]" />

          <div className="relative z-10 flex w-full flex-col justify-center p-12 xl:p-20">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#f59e0b]">
              Real Estate Partner
            </p>
            <h2 className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">
              Empowering <br />
              The Next Generation <br />
              Of <span className="text-[#f59e0b]">Service</span>
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-blue-100/70">
              Join a network of professional real estate experts across the Philippines. List, manage, and close deals
              more efficiently with our advanced dashboard tools.
            </p>

            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Professional Tools</h4>
                  <p className="text-xs text-blue-200/50">Access advanced management features.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Large Network</h4>
                  <p className="text-xs text-blue-200/50">Connect with buyers and sellers nationwide.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-16">
          {children}
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
