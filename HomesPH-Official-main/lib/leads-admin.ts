import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  buildAgentAssignmentPayload,
  createFranchiseQueueResolver,
  ensureLeadQueueState,
  getAssignableFranchiseAgents,
  getFranchiseAssignmentSlaHours,
  getFranchiseQueueActorContext,
} from '@/lib/franchise-queue'
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

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'franchise', 'franchise_secretary', 'salesperson', 'agent', 'developer'])
const LEAD_STATUSES = new Set<LeadStatus>(['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'])
const ASSIGNABLE_APP_ROLES = new Set(['salesperson', 'agent'])

type LeadRow = {
  id: number
  user_profile_id: string | null
  assigned_to: string | null
  project_id: number | null
  source: string | null
  lead_score: number | null
  status: string | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string | null
  updated_at: string | null
  parent_company_id: number | null
  routing_company_id: number | null
  current_company_id: number | null
  assigned_by_profile_id: string | null
  assigned_at: string | null
  assignment_expires_at: string | null
  last_returned_at: string | null
  queue_level: string | null
}

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
  const [projectsResult, usersResult, companiesResult] = await Promise.all([
    admin.from('projects').select('id,name').order('name', { ascending: true }),
    admin.from('user_profiles').select('id,full_name,fname,lname,role').order('full_name', { ascending: true }),
    admin.from('company_profiles').select('id,company_name,parent_company_id').order('company_name', { ascending: true }),
  ])

  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (usersResult.error) throw new Error(usersResult.error.message)
  if (companiesResult.error) throw new Error(companiesResult.error.message)

  const projects = (projectsResult.data ?? []) as Array<{ id: number; name: string }>
  const users = (usersResult.data ?? []) as Array<{ id: string; full_name: string | null; fname: string | null; lname: string | null; role: string | null }>
  const companies = (companiesResult.data ?? []) as Array<{ id: number; company_name: string | null; parent_company_id: number | null }>

  return {
    projects: projects.map((project) => ({ id: project.id, name: project.name })) as LeadProjectOptionRecord[],
    users: users.map((user) => ({ id: user.id, full_name: buildDisplayName(user), role: user.role })) as LeadUserOptionRecord[],
    companies: companies.map((company) => ({
      id: company.id,
      name: company.parent_company_id ? company.company_name?.trim() || 'Suboffice' : 'Main Office',
    })),
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
  if (!developerIds.length) return [] as number[]

  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select('id')
    .in('developer_id', developerIds)

  if (projectsError) throw new Error(projectsError.message)
  return (projects ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
}

async function getLeadRowsRaw(user: Awaited<ReturnType<typeof requireLeadsAccess>>) {
  const admin = createAdminSupabaseClient()
  let query = admin.from('leads').select('*').order('created_at', { ascending: false })

  if (user.role === 'developer') {
    const projectIds = await getDeveloperOwnedProjectIds(user.profileId)
    if (!projectIds.length) return [] as LeadRow[]
    query = query.in('project_id', projectIds)
  }

  const { data, error } = await query.returns<LeadRow[]>()
  if (error) throw new Error(error.message)
  return data ?? []
}

async function getScopedLeadRows(user: Awaited<ReturnType<typeof requireLeadsAccess>>) {
  const admin = createAdminSupabaseClient()
  const actorContext = await getFranchiseQueueActorContext(user)
  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const rawRows = await getLeadRowsRaw(user)
  const normalizedRows = await Promise.all(rawRows.map((row) => ensureLeadQueueState(admin, row, resolver)))

  if (['super_admin', 'admin', 'developer'].includes(user.role)) {
    return normalizedRows
  }

  if (['salesperson', 'agent'].includes(user.role)) {
    return normalizedRows.filter((row) => row.assigned_to === user.profileId)
  }

  if (!actorContext?.organizationRole) {
    return [] as LeadRow[]
  }

  if (actorContext.organizationRole === 'owner' || actorContext.organizationRole === 'main_secretary') {
    return normalizedRows.filter((row) => row.parent_company_id === actorContext.parentCompanyId)
  }

  if (actorContext.organizationRole === 'suboffice_secretary') {
    return normalizedRows.filter((row) => row.routing_company_id === actorContext.companyId)
  }

  return normalizedRows.filter((row) => row.assigned_to === user.profileId)
}

function mapLeadRow(
  lead: LeadRow,
  projectMap: Map<number, string>,
  userMap: Map<string, string>,
  companyMap: Map<number, string>,
): LeadRecord {
  const currentQueueLevel =
    lead.queue_level === 'agent' ||
    lead.queue_level === 'suboffice_queue' ||
    lead.queue_level === 'main_queue'
      ? lead.queue_level
      : lead.assigned_to
        ? 'agent'
        : 'main_queue'

  const isExpired =
    currentQueueLevel === 'agent' &&
    Boolean(lead.assignment_expires_at) &&
    !Number.isNaN(new Date(lead.assignment_expires_at as string).getTime()) &&
    new Date(lead.assignment_expires_at as string).getTime() <= Date.now()

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
    parent_company_id: lead.parent_company_id,
    routing_company_id: lead.routing_company_id,
    current_company_id: lead.current_company_id,
    assigned_by_profile_id: lead.assigned_by_profile_id,
    assigned_at: lead.assigned_at,
    assignment_expires_at: lead.assignment_expires_at,
    last_returned_at: lead.last_returned_at,
    queue_level: currentQueueLevel,
    lead_name: lead.user_profile_id ? userMap.get(lead.user_profile_id) ?? null : null,
    assigned_agent: lead.assigned_to ? userMap.get(lead.assigned_to) ?? null : null,
    assigned_by_name: lead.assigned_by_profile_id ? userMap.get(lead.assigned_by_profile_id) ?? null : null,
    project_name: lead.project_id ? projectMap.get(lead.project_id) ?? null : null,
    current_office_name: lead.current_company_id ? companyMap.get(lead.current_company_id) ?? null : null,
    routing_office_name: lead.routing_company_id ? companyMap.get(lead.routing_company_id) ?? null : null,
    is_expired: isExpired,
  }
}

function buildLeadTimeline(lead: LeadRecord): LeadTimelineItem[] {
  const items: LeadTimelineItem[] = [
    {
      id: `${lead.id}-created`,
      label: 'Lead created',
      description: `${lead.lead_name || 'Lead'} entered the pipeline${lead.project_name ? ` for ${lead.project_name}` : ''}.`,
      occurred_at: lead.created_at,
    },
    {
      id: `${lead.id}-assigned`,
      label: 'Current assignment',
      description:
        lead.queue_level === 'agent'
          ? `${lead.assigned_agent || 'Agent'} is currently assigned${lead.assignment_expires_at ? ` until ${lead.assignment_expires_at}` : ''}.`
          : `Lead is currently waiting in the ${lead.queue_level === 'suboffice_queue' ? 'suboffice queue' : 'main queue'}.`,
      occurred_at: lead.assigned_at ?? lead.updated_at,
    },
    {
      id: `${lead.id}-returned`,
      label: 'Returned to queue',
      description: 'The previous assignment expired and the lead returned to its queue.',
      occurred_at: lead.last_returned_at,
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
  ]

  return items.filter((item) => item.occurred_at || item.label === 'Latest update')
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
  const actorContext = await getFranchiseQueueActorContext(currentUser)

  if (['super_admin', 'admin'].includes(currentUser.role)) {
    return (await getSupportMaps()).users.filter((user) => ASSIGNABLE_APP_ROLES.has(user.role ?? ''))
  }

  if (currentUser.role === 'developer') {
    return []
  }

  if (actorContext?.canManageQueue) {
    const options = await getAssignableFranchiseAgents(actorContext)
    return options.map((option) => ({
      id: option.id,
      full_name: option.full_name,
      office_name: option.office_name ?? null,
      role: option.role,
    }))
  }

  return (await getSupportMaps()).users
    .filter((user) => ASSIGNABLE_APP_ROLES.has(user.role ?? ''))
    .filter((user) => user.id === currentUser.profileId)
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
  const companyMap = new Map(support.companies.map((company) => [company.id, company.name]))

  return leads.map((lead) => mapLeadRow(lead, projectMap, userMap, companyMap))
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

async function getLeadRowById(id: number) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('leads').select('*').eq('id', id).maybeSingle<LeadRow>()
  if (error) throw new Error(error.message)
  return data ?? null
}

async function requireScopedLead(id: number) {
  const lead = await getLeadByIdInternal(id)
  if (!lead) {
    throw new Error('Lead not found.')
  }
  return lead
}

function buildQueuedLeadDefaults(actorContext: NonNullable<Awaited<ReturnType<typeof getFranchiseQueueActorContext>>>) {
  const routingCompanyId =
    actorContext.organizationRole === 'suboffice_secretary'
      ? actorContext.companyId
      : actorContext.parentCompanyId ?? actorContext.companyId

  const parentCompanyId = actorContext.parentCompanyId ?? routingCompanyId
  const queueLevel = routingCompanyId && parentCompanyId && routingCompanyId !== parentCompanyId ? 'suboffice_queue' : 'main_queue'

  return {
    parent_company_id: parentCompanyId,
    routing_company_id: routingCompanyId,
    current_company_id: routingCompanyId,
    queue_level: queueLevel,
    assigned_by_profile_id: null,
    assigned_at: null,
    assignment_expires_at: null,
    last_returned_at: null,
  }
}

export async function createLead(input: LeadInput) {
  const currentUser = await requireLeadsAccess()
  if (currentUser.role === 'developer') {
    throw new Error('Your role can only view project leads.')
  }

  const admin = createAdminSupabaseClient()
  const payload = sanitizeLeadInput(input)
  const actorContext = await getFranchiseQueueActorContext(currentUser)
  const resolver = createFranchiseQueueResolver(admin, actorContext)

  if (!payload.user_profile_id) {
    throw new Error('Lead user is required.')
  }

  let finalPayload: Record<string, unknown> = { ...payload }

  if (actorContext?.canManageQueue) {
    const queueDefaults = buildQueuedLeadDefaults(actorContext)
    finalPayload = {
      ...finalPayload,
      assigned_to: null,
      ...queueDefaults,
    }

    if (payload.assigned_to) {
      const assignment = await buildAgentAssignmentPayload(actorContext, payload.assigned_to, resolver, {
        parentCompanyId: queueDefaults.parent_company_id,
        routingCompanyId: queueDefaults.routing_company_id,
      })
      finalPayload = { ...finalPayload, ...assignment }
    }
  } else if (['salesperson', 'agent'].includes(currentUser.role) && actorContext?.companyId) {
    const assignedAt = new Date().toISOString()
    const slaHours = await getFranchiseAssignmentSlaHours()
    const selfAssignment = {
      parent_company_id: actorContext.parentCompanyId ?? actorContext.companyId,
      routing_company_id: actorContext.companyId,
      current_company_id: actorContext.companyId,
      queue_level: 'agent',
      assigned_to: currentUser.profileId,
      assigned_by_profile_id: currentUser.profileId,
      assigned_at: assignedAt,
      assignment_expires_at: new Date(new Date(assignedAt).getTime() + slaHours * 60 * 60 * 1000).toISOString(),
      last_returned_at: null,
    }
    finalPayload = {
      ...finalPayload,
      ...selfAssignment,
    }
  } else if (['franchise', 'salesperson', 'agent'].includes(currentUser.role)) {
    finalPayload = { ...finalPayload, assigned_to: currentUser.profileId }
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
  const rawLead = await getLeadRowById(id)
  if (!rawLead) throw new Error('Lead not found.')

  const actorContext = await getFranchiseQueueActorContext(currentUser)
  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const normalizedLead = await ensureLeadQueueState(admin, rawLead, resolver)

  let finalPayload: Record<string, unknown> = {
    user_profile_id: payload.user_profile_id,
    project_id: payload.project_id,
    source: payload.source,
    lead_score: payload.lead_score,
    notes: payload.notes,
    status: payload.status,
    last_contacted_at: payload.last_contacted_at,
  }

  if (actorContext?.canManageQueue && payload.assigned_to && payload.assigned_to !== normalizedLead.assigned_to) {
    const assignment = await buildAgentAssignmentPayload(actorContext, payload.assigned_to, resolver, {
      parentCompanyId: normalizedLead.parent_company_id,
      routingCompanyId: normalizedLead.routing_company_id,
    })
    finalPayload = { ...finalPayload, ...assignment }
  } else {
    finalPayload = { ...finalPayload, assigned_to: normalizedLead.assigned_to }
  }

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
  await requireScopedLead(id)

  const admin = createAdminSupabaseClient()
  const rawLead = await getLeadRowById(id)
  if (!rawLead) throw new Error('Lead not found.')

  if (['super_admin', 'admin'].includes(currentUser.role)) {
    const { error } = await admin.from('leads').update({ assigned_to: trimToNull(assignedTo), updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
    const lead = await getLeadByIdInternal(id)
    if (!lead) throw new Error('Lead not found.')
    return lead
  }

  const actorContext = await getFranchiseQueueActorContext(currentUser)
  if (!actorContext?.canManageQueue) {
    throw new Error('Only franchise owner or secretary roles can reassign leads.')
  }

  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const normalizedLead = await ensureLeadQueueState(admin, rawLead, resolver)
  const assignment = await buildAgentAssignmentPayload(actorContext, assignedTo, resolver, {
    parentCompanyId: normalizedLead.parent_company_id,
    routingCompanyId: normalizedLead.routing_company_id,
  })

  const { error } = await admin.from('leads').update({ ...assignment, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  const lead = await getLeadByIdInternal(id)
  if (!lead) throw new Error('Lead not found.')
  return lead
}

export async function returnLeadToQueue(id: number) {
  const currentUser = await requireLeadsAccess()
  await requireScopedLead(id)

  if (!['super_admin', 'admin'].includes(currentUser.role)) {
    const actorContext = await getFranchiseQueueActorContext(currentUser)
    if (!actorContext?.canManageQueue) {
      throw new Error('Only franchise owner or secretary roles can return leads to queue.')
    }
  }

  const admin = createAdminSupabaseClient()
  const rawLead = await getLeadRowById(id)
  if (!rawLead) throw new Error('Lead not found.')

  const actorContext = await getFranchiseQueueActorContext(currentUser)
  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const normalizedLead = await ensureLeadQueueState(admin, rawLead, resolver)
  const returnedQueueLevel =
    normalizedLead.routing_company_id && normalizedLead.parent_company_id && normalizedLead.routing_company_id !== normalizedLead.parent_company_id
      ? 'suboffice_queue'
      : 'main_queue'

  const { error } = await admin
    .from('leads')
    .update({
      assigned_to: null,
      assigned_at: null,
      assignment_expires_at: null,
      current_company_id: normalizedLead.routing_company_id,
      queue_level: returnedQueueLevel,
      last_returned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

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
