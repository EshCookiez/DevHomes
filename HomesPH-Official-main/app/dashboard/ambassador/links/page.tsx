import { getVanityCodes } from '@/components/dashboard/ambassador/actions'
import LinksDashboardClient from '@/components/dashboard/ambassador/LinksClient'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AmbassadorLinksPage() {
  const user = await getCurrentDashboardUser()
  
  if (!user) {
    redirect('/login')
  }

  const { codes, recruitmentStats } = await getVanityCodes()

  return (
    <LinksDashboardClient 
      initialCodes={codes || []}
      ambassadorId={user.profileId}
      recruitmentStats={recruitmentStats}
    />
  )
}
