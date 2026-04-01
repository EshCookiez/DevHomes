import { redirect } from 'next/navigation'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getSiteSettings } from '@/lib/site-settings'

export default async function ForgotPasswordPage() {
  const currentUser = await getCurrentDashboardUser()
  if (currentUser) {
    redirect(`/dashboard/${currentUser.roleSegment}`)
  }

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

      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-5 py-14">
        <ForgotPasswordForm />
      </main>

      <SiteFooter
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        logoUrl={settings.logoUrl}
        brandName={settings.siteTitle}
      />
    </div>
  )
}