import PropertyTypesTable from '@/components/content/property-types-table'
import { getPropertyTypes } from '@/lib/content-admin'

export default async function DashboardPropertyTypesPage() {
  const propertyTypes = await getPropertyTypes()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Property Types Manager</h1>
        <p className="mt-1 text-sm text-slate-500">Manage the property categories available to projects, listings, and platform filters.</p>
      </div>
      <PropertyTypesTable initialPropertyTypes={propertyTypes} />
    </div>
  )
}