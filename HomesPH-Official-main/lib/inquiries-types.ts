export const INQUIRY_STATUSES = ['unread', 'read', 'replied', 'closed'] as const

export type InquiryStatus = typeof INQUIRY_STATUSES[number]

export interface InquiryProjectOptionRecord {
  id: number
  name: string
}

export interface InquiryListingOptionRecord {
  id: number
  project_id: number | null
  title: string
}

export interface InquiryAgentOptionRecord {
  id: string
  name: string
  office_name?: string | null
}

export interface InquiryRecord {
  id: number
  sender_profile_id: string | null
  listing_id: number | null
  project_id: number | null
  subject: string | null
  message: string
  status: InquiryStatus
  created_at: string | null
  parent_company_id: number | null
  routing_company_id: number | null
  current_company_id: number | null
  assigned_to: string | null
  assigned_by_profile_id: string | null
  assigned_at: string | null
  assignment_expires_at: string | null
  last_returned_at: string | null
  queue_level: 'main_queue' | 'suboffice_queue' | 'agent'
  sender_name: string | null
  listing_title: string | null
  project_name: string | null
  assigned_agent: string | null
  assigned_by_name: string | null
  current_office_name: string | null
  routing_office_name: string | null
  is_expired: boolean
}

export interface InquiryReplyInput {
  message: string
}
