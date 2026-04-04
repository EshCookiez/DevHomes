import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import FranchiseRegisterForm from '@/components/auth/FranchiseRegisterForm'
import { Suspense } from 'react'

export default async function FranchiseRegisterPage() {
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

      <main className="flex-1 flex flex-col lg:flex-row shadow-inner">
        <div className="lg:hidden relative bg-[#0c1f4a] px-6 pt-10 pb-20 text-center overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 font-bold text-[10px] tracking-[0.28em] uppercase mb-3 text-white/50">
              Franchise Opportunity
            </p>
            <h2 className="text-white font-black text-2xl leading-tight">
              Open Your Branch Today
            </h2>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-[#0c1f4a] overflow-hidden">
          <div className="relative z-10 w-full flex flex-col justify-center p-14 xl:p-20">
            <p className="text-[#f59e0b] font-bold text-xs tracking-[0.25em] uppercase mb-5">
              Agency Franchise
            </p>
            <h2 className="text-5xl font-black leading-tight text-white mb-6">
              Be the Local<br />
              <span className="text-[#f59e0b]">Industry Leader</span>.
            </h2>
            <p className="text-gray-300 text-lg max-w-sm leading-relaxed">
              Take command of your territory. Start your own branch with our proven systems, brand power, and database infrastructure.
            </p>

            <div className="mt-12 space-y-6">
              {[
                "Exclusive Territorial Rights",
                "Full Back-office Infrastructure",
                "Ready-to-use Digital Ecosystem",
                "Marketing & Brand Support",
                "Access to High-value Project Portfolios"
              ].map((perk, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  </div>
                  <p className="text-gray-300 text-sm font-medium">{perk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-5 pb-12 pt-0 lg:py-14 bg-slate-100/50">
          <div className="w-full flex justify-center -mt-10 lg:mt-0">
            <Suspense fallback={<div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md h-96 flex items-center justify-center">Loading form...</div>}>
              <FranchiseRegisterForm />
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