import HomeFooter from '@/components/home/HomeFooter'
import HomeHeader from '@/components/home/HomeHeader'
import LocationGrid from '@/components/home/LocationGrid'
import NationwideShowcase from '@/components/home/NationwideShowcase'
import { getSiteLocations } from '@/lib/db-queries'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { SELECTED_LOCATION_COOKIE } from '@/lib/selected-location'
import { getSiteSettings } from '@/lib/site-settings'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()
  const locationCookie = cookieStore.get(SELECTED_LOCATION_COOKIE)?.value

  if (locationCookie) {
    redirect(`/${locationCookie}`)
  }

  const [settings, locations] = await Promise.all([
    getSiteSettings(),
    getSiteLocations(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
        topBarLocationLabel="Manila, Philippines"
      />

      <LocationGrid locations={locations} />

      <NationwideShowcase />

      <HomeFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
      />
    </div>
  )
}
