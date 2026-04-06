import { getVanityCodes, getDashboardStats, getCampaignStats } from '@/components/dashboard/affiliate/actions'
import AffiliateDashboardClient from './AffiliateDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AffiliateDashboardPage() {
  const { codes, recruitmentStats } = await getVanityCodes()
  const { chartData, activities } = await getDashboardStats()
  const { stats: campaignStats } = await getCampaignStats()

  return (
    <AffiliateDashboardClient
      initialCodes={codes || []}
      recruitmentStats={recruitmentStats}
      chartData={chartData || []}
      activities={activities || []}
      campaignStats={campaignStats || []}
    />
  )
}
