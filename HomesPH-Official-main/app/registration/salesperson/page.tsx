import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import SalespersonRegisterForm from '@/components/auth/SalespersonRegisterForm'

export default async function SalespersonRegisterPage() {
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
        <div className="lg:hidden relative bg-gradient-to-br from-[#0c1f4a] via-[#1a3673] to-[#0c1f4a] px-6 pt-10 pb-20 text-center overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-300 font-bold text-[10px] tracking-[0.28em] uppercase mb-3">
              Join the Team
            </p>
            <h2 className="text-white font-black text-2xl leading-tight">
              Start Your Real Estate Career
            </h2>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-[#0c1f4a] via-[#1a3673] to-[#0c1f4a] overflow-hidden">
           <div className="relative z-10 w-full flex flex-col justify-center p-14 xl:p-20">
              <p className="text-blue-400 font-bold text-xs tracking-[0.25em] uppercase mb-5">
                Professional Salesperson
              </p>
              <h2 className="text-5xl font-black leading-tight text-white mb-6">
                Turn Leads into<br />
                <span className="text-blue-400 underline decoration-blue-600/30">Dream Homes</span>.
              </h2>
              <p className="text-blue-100/70 text-lg max-w-sm leading-relaxed">
                Join our network of elite sales professionals and get access to the best property inventory in the country.
              </p>
              
              <div className="mt-12 space-y-6">
                {[
                  "Access to Premium Property Listings",
                  "Automated Lead Management Tools",
                  "Real-time Commission Tracking",
                  "Support from Industry Experts"
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    </div>
                    <p className="text-blue-100/80 text-sm font-medium">{perk}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-5 pb-12 pt-0 lg:py-14 bg-slate-50">
          <div className="w-full flex justify-center -mt-10 lg:mt-0">
            <SalespersonRegisterForm />
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