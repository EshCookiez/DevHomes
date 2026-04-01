import { redirect } from 'next/navigation'
import ProfileSettingsClient from '@/components/profile/profile-settings-client'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getCurrentProfileBundle } from '@/lib/profile'

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ profileRequired?: string; skip?: string }>
}) {
  const [user, bundle, params] = await Promise.all([
    getCurrentDashboardUser(),
    getCurrentProfileBundle(),
    searchParams,
  ])

  if (!user || !bundle) {
    redirect('/login')
  }

  return (
    <ProfileSettingsClient
      user={user}
      initialBundle={bundle}
      profileRequired={params.profileRequired === '1'}
    />
  )
}
