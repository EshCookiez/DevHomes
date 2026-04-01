import AmenitiesTable from '@/components/content/amenities-table'
import { getAmenities } from '@/lib/content-admin'

export default async function DashboardAmenitiesPage() {
  const amenities = await getAmenities()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Amenities Manager</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the amenity taxonomy used across projects and property listings.</p>
      </div>
      <AmenitiesTable initialAmenities={amenities} />
    </div>
  )
}