import { redirect } from 'next/navigation'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getCurrentProfileBundle } from '@/lib/profile'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper'

export const metadata = {
  title: 'Account Setup | HomesPH',
}

export default async function OnboardingPage() {
  const [user, bundle] = await Promise.all([
    getCurrentDashboardUser(),
    getCurrentProfileBundle(),
  ])

  if (!user || !bundle) redirect('/login')

  // If the profile is already complete, send them straight to their dashboard
  if (user.profileComplete) redirect(`/dashboard/${user.roleSegment}`)

  return <OnboardingStepper user={user} initialBundle={bundle} />
}
