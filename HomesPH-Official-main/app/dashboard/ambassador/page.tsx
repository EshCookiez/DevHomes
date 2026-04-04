import { getVanityCodes, getDashboardStats, getCampaignStats } from '@/components/dashboard/ambassador/actions'
import AmbassadorDashboardClient from './AmbassadorDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AmbassadorDashboardPage() {
  const { codes, recruitmentStats } = await getVanityCodes()
  const { chartData, activities } = await getDashboardStats()
  const { stats: campaignStats } = await getCampaignStats()

  return (
    <AmbassadorDashboardClient 
      initialCodes={codes || []}
      recruitmentStats={recruitmentStats}
      chartData={chartData || []}
      activities={activities || []}
      campaignStats={campaignStats || []}
    />
  )
}
