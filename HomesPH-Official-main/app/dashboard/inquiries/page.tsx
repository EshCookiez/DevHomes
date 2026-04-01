import InquiriesManagementClient from '@/components/inquiries/inquiries-management-client'
import { getInquiries, getInquiryListings, getInquiryProjects, requireInquiriesAccess } from '@/lib/inquiries-admin'

export default async function DashboardInquiriesPage() {
  await requireInquiriesAccess()

  const [inquiries, projects, listings] = await Promise.all([
    getInquiries(),
    getInquiryProjects(),
    getInquiryListings(),
  ])

  return <InquiriesManagementClient initialInquiries={inquiries} projects={projects} listings={listings} />
}