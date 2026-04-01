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

export interface InquiryRecord {
  id: number
  sender_profile_id: string | null
  listing_id: number | null
  project_id: number | null
  subject: string | null
  message: string
  status: InquiryStatus
  created_at: string | null
  sender_name: string | null
  listing_title: string | null
  project_name: string | null
}

export interface InquiryReplyInput {
  message: string
}