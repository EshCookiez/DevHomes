import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type {
  LeadAnalyticsBundle,
  LeadAnalyticsPoint,
  LeadInput,
  LeadPipelinePoint,
  LeadProjectOptionRecord,
  LeadRecord,
  LeadStatus,
  LeadTimelineItem,
  LeadUserOptionRecord,
} from '@/lib/leads-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'franchise', 'salesperson', 'agent', 'developer'])
const LEAD_STATUSES = new Set<LeadStatus>(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'])
const AGENT_ROLES = new Set(['super_admin', 'admin', 'franchise', 'salesperson', 'agent'])

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildDisplayName(row: { full_name: string | null; fname?: string | null; lname?: string | null; email?: string | null }) {
  return row.full_name?.trim() || [row.fname, row.lname].filter(Boolean).join(' ').trim() || row.email || 'Unknown user'
}

function sanitizeLeadInput(input: LeadInput) {
  if (!LEAD_STATUSES.has(input.status)) {
    throw new Error('Invalid lead status.')
  }

  return {
    user_profile_id: trimToNull(input.user_profile_id),
    project_id: parseOptionalNumber(input.project_id),
    assigned_to: trimToNull(input.assigned_to),
    source: trimToNull(input.source),
    lead_score: parseOptionalNumber(input.lead_score),
    notes: trimToNull(input.notes),
    status: input.status,
    last_contacted_at: trimToNull(input.last_contacted_at),
  }
}

async function getSupportMaps() {
  const admin = createAdminSupabaseClient()
  const [projectsResult, usersResult] = await Promise.all([
    admin.from('projects').select('id,name').order('name', { ascending: true }),
    admin.from('user_profiles').select('id,full_name,fname,lname,role').order('full_name', { ascending: true }),
  ])

  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (usersResult.error) throw new Error(usersResult.error.message)

  const projects = (projectsResult.data ?? []) as Array<{ id: number; name: string }>
  const users = (usersResult.data ?? []) as Array<{ id: string; full_name: string | null; fname: string | null; lname: string | null; role: string | null }>

  return {
    projects: projects.map((project) => ({ id: project.id, name: project.name })) as LeadProjectOptionRecord[],
    users: users.map((user) => ({ id: user.id, full_name: buildDisplayName(user), role: user.role })) as LeadUserOptionRecord[],
  }
}

async function getDeveloperOwnedProjectIds(profileId: string) {
  const admin = createAdminSupabaseClient()
  const { data: developerProfiles, error: developerProfilesError } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', profileId)

  if (developerProfilesError) throw new Error(developerProfilesError.message)

  const developerIds = (developerProfiles ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
  if (!developerIds.length) return []

  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select('id')
    .in('developer_id', developerIds)

  if (projectsError) throw new Error(projectsError.message)
  return (projects ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
}

async function getScopedLeadRows(user: Awaited<ReturnType<typeof requireLeadsAccess>>) {
  const admin = createAdminSupabaseClient()
  let query = admin.from('leads').select('*').order('created_at', { ascending: false })

  if (['franchise', 'salesperson', 'agent'].includes(user.role)) {
    query = query.eq('assigned_to', user.profileId)
  }

  if (user.role === 'developer') {
    const projectIds = await getDeveloperOwnedProjectIds(user.profileId)
    if (!projectIds.length) return []
    query = query.in('project_id', projectIds)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

function mapLeadRow(
  lead: any,
  projectMap: Map<number, string>,
  userMap: Map<string, string>,
): LeadRecord {
  return {
    id: lead.id,
    user_profile_id: lead.user_profile_id,
    assigned_to: lead.assigned_to,
    project_id: lead.project_id,
    source: lead.source,
    lead_score: lead.lead_score,
    status: (lead.status ?? 'new') as LeadStatus,
    notes: lead.notes,
    last_contacted_at: lead.last_contacted_at,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    lead_name: lead.user_profile_id ? userMap.get(lead.user_profile_id) ?? null : null,
    assigned_agent: lead.assigned_to ? userMap.get(lead.assigned_to) ?? null : null,
    project_name: lead.project_id ? projectMap.get(lead.project_id) ?? null : null,
  }
}

function buildLeadTimeline(lead: LeadRecord): LeadTimelineItem[] {
  return [
    {
      id: `${lead.id}-created`,
      label: 'Lead created',
      description: `${lead.lead_name || 'Lead'} entered the pipeline${lead.project_name ? ` for ${lead.project_name}` : ''}.`,
      occurred_at: lead.created_at,
    },
    {
      id: `${lead.id}-contact`,
      label: 'Last contacted',
      description: lead.last_contacted_at ? 'Sales outreach was logged for this lead.' : 'No contact activity recorded yet.',
      occurred_at: lead.last_contacted_at,
    },
    {
      id: `${lead.id}-updated`,
      label: 'Latest update',
      description: `Lead currently marked as ${lead.status.replace(/_/g, ' ')}.`,
      occurred_at: lead.updated_at,
    },
  ].filter((item) => item.occurred_at || item.label === 'Latest update')
}

function buildLeadAnalytics(leads: LeadRecord[]): LeadAnalyticsBundle {
  const totalLeads = leads.length
  const qualifiedLeads = leads.filter((lead) => ['qualified', 'proposal_sent', 'negotiation', 'closed_won'].includes(lead.status)).length
  const closedDeals = leads.filter((lead) => lead.status === 'closed_won').length
  const conversionRate = totalLeads > 0 ? Number(((closedDeals / totalLeads) * 100).toFixed(1)) : 0

  const monthlyMap = new Map<string, number>()
  const sourceMap = new Map<string, number>()
  const pipelineMap = new Map<LeadStatus, number>()

  for (const status of ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'] as LeadStatus[]) {
    pipelineMap.set(status, 0)
  }

  for (const lead of leads) {
    const date = lead.created_at ? new Date(lead.created_at) : null
    const monthKey = date && !Number.isNaN(date.getTime()) ? date.toLocaleString('en-US', { month: 'short' }) : 'Unknown'
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1)

    const source = lead.source?.trim() || 'Unknown'
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1)

    pipelineMap.set(lead.status, (pipelineMap.get(lead.status) ?? 0) + 1)
  }

  const leadsByMonth: LeadAnalyticsPoint[] = Array.from(monthlyMap.entries()).map(([label, count]) => ({ label, count }))
  const sources: LeadAnalyticsPoint[] = Array.from(sourceMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
  const pipeline: LeadPipelinePoint[] = Array.from(pipelineMap.entries()).map(([status, count]) => ({ status, count }))

  return { totalLeads, qualifiedLeads, closedDeals, conversionRate, leadsByMonth, pipeline, sources }
}

export async function requireLeadsAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getLeadUsers(): Promise<LeadUserOptionRecord[]> {
  await requireLeadsAccess()
  return (await getSupportMaps()).users
}

export async function getLeadAgents(): Promise<LeadUserOptionRecord[]> {
  const currentUser = await requireLeadsAccess()
  const users = (await getSupportMaps()).users.filter((user) => AGENT_ROLES.has(user.role ?? ''))

  if (['franchise', 'salesperson', 'agent'].includes(currentUser.role)) {
    return users.filter((user) => user.id === currentUser.profileId)
  }

  if (currentUser.role === 'developer') {
    return []
  }

  return users
}

export async function getLeadProjects(): Promise<LeadProjectOptionRecord[]> {
  await requireLeadsAccess()
  return (await getSupportMaps()).projects
}

export async function getLeads(): Promise<LeadRecord[]> {
  const currentUser = await requireLeadsAccess()
  const [leads, support] = await Promise.all([
    getScopedLeadRows(currentUser),
    getSupportMaps(),
  ])

  const projectMap = new Map(support.projects.map((project) => [project.id, project.name]))
  const userMap = new Map(support.users.map((user) => [user.id, user.full_name]))

  return (leads ?? []).map((lead) => mapLeadRow(lead, projectMap, userMap))
}

export async function getLeadAnalytics() {
  const leads = await getLeads()
  return buildLeadAnalytics(leads)
}

export async function getLeadTimeline(id: number) {
  await requireLeadsAccess()
  const leads = await getLeads()
  const lead = leads.find((entry) => entry.id === id)
  if (!lead) return []
  return buildLeadTimeline(lead)
}

async function getLeadByIdInternal(id: number) {
  const leads = await getLeads()
  return leads.find((lead) => lead.id === id) ?? null
}

async function requireScopedLead(id: number) {
  const lead = await getLeadByIdInternal(id)
  if (!lead) {
    throw new Error('Lead not found.')
  }
  return lead
}

export async function createLead(input: LeadInput) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }

  const admin = createAdminSupabaseClient()
  const payload = sanitizeLeadInput(input)
  const finalPayload = ['franchise', 'salesperson', 'agent'].includes(currentUser.role)
    ? { ...payload, assigned_to: currentUser.profileId }
    : payload

  if (!finalPayload.user_profile_id) {
    throw new Error('Lead user is required.')
  }

  const { data, error } = await admin.from('leads').insert(finalPayload).select('id').single<{ id: number }>()
  if (error || !data) throw new Error(error?.message ?? 'Unable to create lead.')

  const lead = await getLeadByIdInternal(data.id)
  if (!lead) throw new Error('Lead not found after creation.')
  return lead
}

export async function updateLead(id: number, input: LeadInput) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }

  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const payload = sanitizeLeadInput(input)
  const finalPayload = ['franchise', 'salesperson', 'agent'].includes(currentUser.role)
    ? { ...payload, assigned_to: currentUser.profileId }
    : payload
  const { error } = await admin.from('leads').update(finalPayload).eq('id', id)
  if (error) throw new Error(error.message)

  const lead = await getLeadByIdInternal(id)
  if (!lead) throw new Error('Lead not found.')
  return lead
}

export async function updateLeadStatus(id: number, status: LeadStatus) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }
  if (!LEAD_STATUSES.has(status)) throw new Error('Invalid lead status.')

  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  const lead = await getLeadByIdInternal(id)
  if (!lead) throw new Error('Lead not found.')
  return lead
}

export async function assignLeadAgent(id: number, assignedTo: string) {
  const currentUser = await requireLeadsAccess()
  if (!['super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Only admin roles can reassign leads.')
  }

  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('leads').update({ assigned_to: trimToNull(assignedTo), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  const lead = await getLeadByIdInternal(id)
  if (!lead) throw new Error('Lead not found.')
  return lead
}

export async function updateLeadNote(id: number, notes: string) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }

  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('leads').update({ notes: trimToNull(notes), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  const lead = await getLeadByIdInternal(id)
  if (!lead) throw new Error('Lead not found.')
  return lead
}

export async function deleteLead(id: number) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }

  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('leads').delete().eq('id', id)
  if (error) throw new Error(error.message)
}