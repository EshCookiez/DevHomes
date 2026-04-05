import { redirect } from 'next/navigation'
import { getPendingFranchiseAgents, getFranchiseLeads, getSecretaryDashboardSummary } from '@/app/dashboard/secretary/actions'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import SecretaryDashboardClient from './SecretaryDashboardClient'

export default async function SecretaryDashboardPage() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'franchise_secretary') {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  const [pendingAgents, leads, summary] = await Promise.all([
    getPendingFranchiseAgents(),
    getFranchiseLeads(),
    getSecretaryDashboardSummary(),
  ])

  return <SecretaryDashboardClient pendingAgents={pendingAgents} leads={leads} summary={summary} />
}
