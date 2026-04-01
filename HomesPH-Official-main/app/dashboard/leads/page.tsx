import LeadsManagementClient from '@/components/leads/leads-management-client'
import { getLeadAgents, getLeadAnalytics, getLeadProjects, getLeads, getLeadUsers, requireLeadsAccess } from '@/lib/leads-admin'

export default async function DashboardLeadsPage() {
  await requireLeadsAccess()

  const [leads, analytics, users, agents, projects] = await Promise.all([
    getLeads(),
    getLeadAnalytics(),
    getLeadUsers(),
    getLeadAgents(),
    getLeadProjects(),
  ])

  return <LeadsManagementClient initialLeads={leads} analytics={analytics} users={users} agents={agents} projects={projects} />
}