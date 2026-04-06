import { getVanityCodes } from '@/components/dashboard/affiliate/actions'
import LinksDashboardClient from '@/components/dashboard/affiliate/LinksClient'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AffiliateLinksPage() {
  const user = await getCurrentDashboardUser()
  
  if (!user) {
    redirect('/login')
  }

  const { codes, recruitmentStats } = await getVanityCodes()

  return (
    <LinksDashboardClient 
      initialCodes={codes || []}
      affiliateId={user.profileId}
      recruitmentStats={recruitmentStats}
    />
  )
}
