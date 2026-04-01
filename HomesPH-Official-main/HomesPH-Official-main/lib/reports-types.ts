export type ReportsPreset = '7d' | '30d' | '6m' | '12m' | 'custom'

export interface ReportsCountRecord {
  current: number
  previous: number
}

export interface ReportsSeriesPoint {
  label: string
  value: number
}

export interface ReportsPiePoint {
  label: string
  value: number
}

export interface ReportsFunnelPoint {
  status: string
  value: number
}

export interface TopProjectRecord {
  project_id: number
  project_name: string
  units_count: number
  listings_count: number
  inquiries_count: number
  leads_count: number
  conversion_rate: number
}

export interface TopAgentRecord {
  user_id: string
  agent_name: string
  leads_count: number
  closed_deals: number
  conversion_rate: number
}

export interface ActivityLogRecord {
  id: number
  user_name: string | null
  action: string
  table_name: string
  record_id: string
  created_at: string | null
}

export interface ReportsRawBundle {
  users: Array<{ id: string; created_at: string | null }>
  developers: Array<{ id: number; created_at: string | null }>
  projects: Array<{ id: number; name: string; created_at: string | null }>
  projectUnits: Array<{ id: number; project_id: number | null; created_at: string | null }>
  listings: Array<{ id: number; project_id: number | null; created_at: string | null }>
  leads: Array<{ id: number; project_id: number | null; assigned_to: string | null; source: string | null; status: string | null; created_at: string | null }>
  inquiries: Array<{ id: number; project_id: number | null; listing_id: number | null; created_at: string | null }>
  projectsLookup: Array<{ id: number; name: string }>
  listingsLookup: Array<{ id: number; title: string }>
  usersLookup: Array<{ id: string; full_name: string }>
  activityLogs: ActivityLogRecord[]
}

export interface ReportsComputedBundle {
  totals: {
    users: ReportsCountRecord
    developers: ReportsCountRecord
    projects: ReportsCountRecord
    listings: ReportsCountRecord
    leads: ReportsCountRecord
    inquiries: ReportsCountRecord
  }
  userGrowth: ReportsSeriesPoint[]
  developersGrowth: ReportsSeriesPoint[]
  projectsGrowth: ReportsSeriesPoint[]
  listingsGrowth: ReportsSeriesPoint[]
  leadsFunnel: ReportsFunnelPoint[]
  inquiryByMonth: ReportsSeriesPoint[]
  inquiryByProject: ReportsPiePoint[]
  inquiryByListing: ReportsPiePoint[]
  topProjects: TopProjectRecord[]
  topAgents: TopAgentRecord[]
  activityLogs: ActivityLogRecord[]
}