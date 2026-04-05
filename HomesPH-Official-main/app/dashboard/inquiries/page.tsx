import InquiriesManagementClient from '@/components/inquiries/inquiries-management-client'
import { getInquiries, getInquiryAgents, getInquiryListings, getInquiryProjects, requireInquiriesAccess } from '@/lib/inquiries-admin'

export default async function DashboardInquiriesPage() {
  await requireInquiriesAccess()

  const [inquiries, projects, listings, agents] = await Promise.all([
    getInquiries(),
    getInquiryProjects(),
    getInquiryListings(),
    getInquiryAgents(),
  ])

  return <InquiriesManagementClient initialInquiries={inquiries} projects={projects} listings={listings} agents={agents} />
}
