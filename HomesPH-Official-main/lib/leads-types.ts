export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const

export type LeadStatus = typeof LEAD_STATUSES[number]

export interface LeadUserOptionRecord {
  id: string
  full_name: string
  role: string | null
}

export interface LeadProjectOptionRecord {
  id: number
  name: string
}

export interface LeadRecord {
  id: number
  user_profile_id: string | null
  assigned_to: string | null
  project_id: number | null
  source: string | null
  lead_score: number | null
  status: LeadStatus
  notes: string | null
  last_contacted_at: string | null
  created_at: string | null
  updated_at: string | null
  lead_name: string | null
  assigned_agent: string | null
  project_name: string | null
}

export interface LeadInput {
  user_profile_id: string
  project_id: string
  assigned_to: string
  source: string
  lead_score: string
  notes: string
  status: LeadStatus
  last_contacted_at: string
}

export interface LeadTimelineItem {
  id: string
  label: string
  description: string
  occurred_at: string | null
}

export interface LeadAnalyticsPoint {
  label: string
  count: number
}

export interface LeadPipelinePoint {
  status: LeadStatus
  count: number
}

export interface LeadAnalyticsBundle {
  totalLeads: number
  qualifiedLeads: number
  closedDeals: number
  conversionRate: number
  leadsByMonth: LeadAnalyticsPoint[]
  pipeline: LeadPipelinePoint[]
  sources: LeadAnalyticsPoint[]
}