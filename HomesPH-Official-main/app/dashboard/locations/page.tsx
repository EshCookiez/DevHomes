import LocationsTable from '@/components/content/locations-table'
import { getContentLocations } from '@/lib/content-admin'

export default async function DashboardLocationsPage() {
  const locations = await getContentLocations()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Locations Manager</h1>
        <p className="mt-1 text-sm text-slate-500">Manage platform locations, SEO metadata, active visibility, and branded logos for public city pages.</p>
      </div>
      <LocationsTable initialLocations={locations} />
    </div>
  )
}