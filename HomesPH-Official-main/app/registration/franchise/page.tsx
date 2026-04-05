import { Suspense } from 'react'
import FranchiseRegistrationWizard from '@/components/auth/FranchiseRegistrationWizard'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
import { getSiteSettings } from '@/lib/site-settings'

export default async function FranchiseRegisterPage() {
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

      <main className="flex flex-1 flex-col shadow-inner lg:flex-row">
        <div className="relative overflow-hidden bg-[#0c1f4a] px-6 pb-20 pt-10 text-center lg:hidden">
          <div className="relative z-10">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
              Franchise Opportunity
            </p>
            <h2 className="text-2xl font-black leading-tight text-white">Open Your Branch Today</h2>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-[#0c1f4a] lg:flex lg:w-[45%] xl:w-[40%]">
          <div className="relative z-10 flex w-full flex-col justify-center p-14 xl:p-20">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-[#f59e0b]">Agency Franchise</p>
            <h2 className="mb-6 text-5xl font-black leading-tight text-white">
              Be the Local
              <br />
              <span className="text-[#f59e0b]">Industry Leader</span>.
            </h2>
            <p className="max-w-sm text-lg leading-relaxed text-gray-300">
              Take command of your territory. Start your own branch with our proven systems, brand power, and database
              infrastructure.
            </p>

            <div className="mt-12 space-y-6">
              {[
                'Exclusive Territorial Rights',
                'Full Back-office Infrastructure',
                'Ready-to-use Digital Ecosystem',
                'Marketing & Brand Support',
                'Access to High-value Project Portfolios',
              ].map((perk) => (
                <div key={perk} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">{perk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-start justify-center bg-slate-100/50 px-5 pb-12 pt-0 lg:items-center lg:py-14">
          <div className="-mt-10 flex w-full justify-center lg:mt-0">
            <Suspense
              fallback={
                <div className="flex h-96 w-full max-w-md items-center justify-center rounded-2xl bg-white p-8 shadow-xl">
                  Loading form...
                </div>
              }
            >
              <FranchiseRegistrationWizard initialRole="franchise" />
            </Suspense>
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
