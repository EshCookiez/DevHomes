import { fetchOrgSettings } from './actions'
import OrganizationSettingsMap from '@/components/dashboard/OrganizationSettingsMap'

export const metadata = {
  title: 'Organization Settings | HomesPH Dashboard',
}

export default async function FranchiseSettingsPage() {
  const settings = await fetchOrgSettings()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <OrganizationSettingsMap
        companyId={settings?.companyId ?? ''}
        companyName={settings?.companyName ?? ''}
        licenseNumber={settings?.licenseNumber ?? ''}
        initialAddress={settings?.address ?? null}
        currentSecretaryId={settings?.currentSecretaryId ?? null}
        availableMembers={settings?.availableMembers ?? []}
      />
    </div>
  )
}
