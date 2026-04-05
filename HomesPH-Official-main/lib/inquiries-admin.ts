import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  buildAgentAssignmentPayload,
  createFranchiseQueueResolver,
  ensureInquiryQueueState,
  getAssignableFranchiseAgents,
  getFranchiseQueueActorContext,
} from '@/lib/franchise-queue'
import type {
  InquiryAgentOptionRecord,
  InquiryListingOptionRecord,
  InquiryProjectOptionRecord,
  InquiryRecord,
  InquiryStatus,
} from '@/lib/inquiries-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'franchise', 'franchise_secretary', 'salesperson', 'agent', 'buyer', 'developer'])
const INQUIRY_STATUSES = new Set<InquiryStatus>(['unread', 'read', 'replied', 'closed'])

type InquiryRow = {
  id: number
  sender_profile_id: string | null
  listing_id: number | null
  project_id: number | null
  subject: string | null
  message: string
  status: string | null
  created_at: string | null
  parent_company_id: number | null
  routing_company_id: number | null
  current_company_id: number | null
  assigned_to: string | null
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

function buildDisplayName(row: { full_name: string | null; fname?: string | null; lname?: string | null; email?: string | null }) {
  return row.full_name?.trim() || [row.fname, row.lname].filter(Boolean).join(' ').trim() || row.email || 'Unknown sender'
}

async function getSupportMaps() {
  const admin = createAdminSupabaseClient()
  const [projectsResult, listingsResult, usersResult, companiesResult] = await Promise.all([
    admin.from('projects').select('id,name').order('name', { ascending: true }),
    admin.from('property_listings').select('id,project_id,title').order('title', { ascending: true }),
    admin.from('user_profiles').select('id,full_name,fname,lname').order('full_name', { ascending: true }),
    admin.from('company_profiles').select('id,company_name,parent_company_id').order('company_name', { ascending: true }),
  ])

  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (listingsResult.error) throw new Error(listingsResult.error.message)
  if (usersResult.error) throw new Error(usersResult.error.message)
  if (companiesResult.error) throw new Error(companiesResult.error.message)

  const projects = (projectsResult.data ?? []) as Array<{ id: number; name: string }>
  const listings = (listingsResult.data ?? []) as Array<{ id: number; project_id: number | null; title: string }>
  const users = (usersResult.data ?? []) as Array<{ id: string; full_name: string | null; fname: string | null; lname: string | null }>
  const companies = (companiesResult.data ?? []) as Array<{ id: number; company_name: string | null; parent_company_id: number | null }>

  return {
    projects: projects.map((project) => ({ id: project.id, name: project.name })) as InquiryProjectOptionRecord[],
    listings: listings.map((listing) => ({ id: listing.id, project_id: listing.project_id, title: listing.title })) as InquiryListingOptionRecord[],
    users: users.map((user) => ({ id: user.id, name: buildDisplayName(user) })),
    companies: companies.map((company) => ({
      id: company.id,
      name: company.parent_company_id ? company.company_name?.trim() || 'Suboffice' : 'Main Office',
    })),
  }
}

async function getDeveloperOwnedScopes(profileId: string) {
  const admin = createAdminSupabaseClient()
  const { data: developerProfiles, error: developerProfilesError } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', profileId)

  if (developerProfilesError) throw new Error(developerProfilesError.message)

  const developerIds = (developerProfiles ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
  if (!developerIds.length) return { projectIds: [] as number[], listingIds: [] as number[] }

  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select('id')
    .in('developer_id', developerIds)

  if (projectsError) throw new Error(projectsError.message)

  const projectIds = (projects ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
  if (!projectIds.length) return { projectIds: [] as number[], listingIds: [] as number[] }

  const { data: listings, error: listingsError } = await admin
    .from('property_listings')
    .select('id')
    .in('project_id', projectIds)

  if (listingsError) throw new Error(listingsError.message)

  return {
    projectIds,
    listingIds: (listings ?? []).map((row) => Number(row.id)).filter(Number.isFinite),
  }
}

async function getInquiryRowsRaw(user: Awaited<ReturnType<typeof requireInquiriesAccess>>) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('inquiries').select('*').order('created_at', { ascending: false }).returns<InquiryRow[]>()
  if (error) throw new Error(error.message)

  const rows = data ?? []

  if (user.role !== 'developer') {
    return rows
  }

  const scope = await getDeveloperOwnedScopes(user.profileId)
  const projectSet = new Set(scope.projectIds)
  const listingSet = new Set(scope.listingIds)
  return rows.filter((row) => (row.project_id && projectSet.has(row.project_id)) || (row.listing_id && listingSet.has(row.listing_id)))
}

async function getScopedInquiryRows(user: Awaited<ReturnType<typeof requireInquiriesAccess>>) {
  const admin = createAdminSupabaseClient()
  const actorContext = await getFranchiseQueueActorContext(user)
  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const rawRows = await getInquiryRowsRaw(user)
  const normalizedRows = await Promise.all(rawRows.map((row) => ensureInquiryQueueState(admin, row, resolver)))

  if (['super_admin', 'admin', 'developer'].includes(user.role)) {
    return normalizedRows
  }

  if (user.role === 'buyer') {
    return normalizedRows.filter((row) => row.sender_profile_id === user.profileId)
  }

  if (['salesperson', 'agent'].includes(user.role)) {
    return normalizedRows.filter((row) => row.assigned_to === user.profileId)
  }

  if (!actorContext?.organizationRole) {
    return [] as InquiryRow[]
  }

  if (actorContext.organizationRole === 'owner' || actorContext.organizationRole === 'main_secretary') {
    return normalizedRows.filter((row) => row.parent_company_id === actorContext.parentCompanyId)
  }

  if (actorContext.organizationRole === 'suboffice_secretary') {
    return normalizedRows.filter((row) => row.routing_company_id === actorContext.companyId)
  }

  return normalizedRows.filter((row) => row.assigned_to === user.profileId)
}

function mapInquiryRow(
  inquiry: InquiryRow,
  projectMap: Map<number, string>,
  listingMap: Map<number, InquiryListingOptionRecord>,
  userMap: Map<string, string>,
  companyMap: Map<number, string>,
): InquiryRecord {
  const currentQueueLevel =
    inquiry.queue_level === 'agent' ||
    inquiry.queue_level === 'suboffice_queue' ||
    inquiry.queue_level === 'main_queue'
      ? inquiry.queue_level
      : inquiry.assigned_to
        ? 'agent'
        : 'main_queue'

  const isExpired =
    currentQueueLevel === 'agent' &&
    Boolean(inquiry.assignment_expires_at) &&
    !Number.isNaN(new Date(inquiry.assignment_expires_at as string).getTime()) &&
    new Date(inquiry.assignment_expires_at as string).getTime() <= Date.now()

  return {
    id: inquiry.id,
    sender_profile_id: inquiry.sender_profile_id,
    listing_id: inquiry.listing_id,
    project_id: inquiry.project_id,
    subject: inquiry.subject,
    message: inquiry.message,
    status: (inquiry.status ?? 'unread') as InquiryStatus,
    created_at: inquiry.created_at,
    parent_company_id: inquiry.parent_company_id,
    routing_company_id: inquiry.routing_company_id,
    current_company_id: inquiry.current_company_id,
    assigned_to: inquiry.assigned_to,
    assigned_by_profile_id: inquiry.assigned_by_profile_id,
    assigned_at: inquiry.assigned_at,
    assignment_expires_at: inquiry.assignment_expires_at,
    last_returned_at: inquiry.last_returned_at,
    queue_level: currentQueueLevel,
    sender_name: inquiry.sender_profile_id ? userMap.get(inquiry.sender_profile_id) ?? null : null,
    listing_title: inquiry.listing_id ? listingMap.get(inquiry.listing_id)?.title ?? null : null,
    project_name: inquiry.project_id ? projectMap.get(inquiry.project_id) ?? null : null,
    assigned_agent: inquiry.assigned_to ? userMap.get(inquiry.assigned_to) ?? null : null,
    assigned_by_name: inquiry.assigned_by_profile_id ? userMap.get(inquiry.assigned_by_profile_id) ?? null : null,
    current_office_name: inquiry.current_company_id ? companyMap.get(inquiry.current_company_id) ?? null : null,
    routing_office_name: inquiry.routing_company_id ? companyMap.get(inquiry.routing_company_id) ?? null : null,
    is_expired: isExpired,
  }
}

export async function requireInquiriesAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getInquiryProjects() {
  await requireInquiriesAccess()
  return (await getSupportMaps()).projects
}

export async function getInquiryListings() {
  await requireInquiriesAccess()
  return (await getSupportMaps()).listings
}

export async function getInquiryAgents(): Promise<InquiryAgentOptionRecord[]> {
  const currentUser = await requireInquiriesAccess()
  const actorContext = await getFranchiseQueueActorContext(currentUser)

  if (actorContext?.canManageQueue) {
    const options = await getAssignableFranchiseAgents(actorContext)
    return options.map((option) => ({
      id: option.id,
      name: option.full_name,
      office_name: option.office_name ?? null,
    }))
  }

  return [] as InquiryAgentOptionRecord[]
}

export async function getInquiries(): Promise<InquiryRecord[]> {
  const currentUser = await requireInquiriesAccess()
  const [inquiries, support] = await Promise.all([
    getScopedInquiryRows(currentUser),
    getSupportMaps(),
  ])

  const projectMap = new Map(support.projects.map((project) => [project.id, project.name]))
  const listingMap = new Map(support.listings.map((listing) => [listing.id, listing]))
  const userMap = new Map(support.users.map((user) => [user.id, user.name]))
  const companyMap = new Map(support.companies.map((company) => [company.id, company.name]))

  return inquiries.map((inquiry) => mapInquiryRow(inquiry, projectMap, listingMap, userMap, companyMap))
}

export async function getUnreadInquiriesCount() {
  const inquiries = await getInquiries()
  return inquiries.filter((inquiry) => inquiry.status === 'unread').length
}

async function getInquiryByIdInternal(id: number) {
  const inquiries = await getInquiries()
  return inquiries.find((inquiry) => inquiry.id === id) ?? null
}

async function getInquiryRowById(id: number) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('inquiries').select('*').eq('id', id).maybeSingle<InquiryRow>()
  if (error) throw new Error(error.message)
  return data ?? null
}

async function requireScopedInquiry(id: number) {
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) {
    throw new Error('Inquiry not found.')
  }
  return inquiry
}

function canMutateInquiry(currentUser: Awaited<ReturnType<typeof requireInquiriesAccess>>) {
  return ['super_admin', 'admin', 'franchise', 'franchise_secretary', 'salesperson', 'agent'].includes(currentUser.role)
}

export async function updateInquiryStatus(id: number, status: InquiryStatus) {
  const currentUser = await requireInquiriesAccess()
  if (!canMutateInquiry(currentUser) || !INQUIRY_STATUSES.has(status)) {
    throw new Error('Your role does not have permission to update inquiries.')
  }

  await requireScopedInquiry(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function replyToInquiry(id: number, message: string) {
  const currentUser = await requireInquiriesAccess()
  if (!canMutateInquiry(currentUser)) {
    throw new Error('Your role does not have permission to reply to inquiries.')
  }
  if (!trimToNull(message)) throw new Error('Reply message is required.')

  await requireScopedInquiry(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').update({ status: 'replied' }).eq('id', id)
  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function assignInquiryAgent(id: number, assignedTo: string) {
  const currentUser = await requireInquiriesAccess()
  await requireScopedInquiry(id)

  if (!['franchise', 'franchise_secretary', 'super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Only franchise owner or secretary roles can assign inquiries.')
  }

  const admin = createAdminSupabaseClient()
  const rawInquiry = await getInquiryRowById(id)
  if (!rawInquiry) throw new Error('Inquiry not found.')

  if (['super_admin', 'admin'].includes(currentUser.role)) {
    const { error } = await admin.from('inquiries').update({ assigned_to: trimToNull(assignedTo) }).eq('id', id)
    if (error) throw new Error(error.message)
    const inquiry = await getInquiryByIdInternal(id)
    if (!inquiry) throw new Error('Inquiry not found.')
    return inquiry
  }

  const actorContext = await getFranchiseQueueActorContext(currentUser)
  if (!actorContext?.canManageQueue) {
    throw new Error('Only franchise owner or secretary roles can assign inquiries.')
  }

  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const normalizedInquiry = await ensureInquiryQueueState(admin, rawInquiry, resolver)
  const assignment = await buildAgentAssignmentPayload(actorContext, assignedTo, resolver, {
    parentCompanyId: normalizedInquiry.parent_company_id,
    routingCompanyId: normalizedInquiry.routing_company_id,
  })

  const { error } = await admin.from('inquiries').update(assignment).eq('id', id)
  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function returnInquiryToQueue(id: number) {
  const currentUser = await requireInquiriesAccess()
  await requireScopedInquiry(id)

  if (!['franchise', 'franchise_secretary', 'super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Only franchise owner or secretary roles can return inquiries to queue.')
  }

  const admin = createAdminSupabaseClient()
  const rawInquiry = await getInquiryRowById(id)
  if (!rawInquiry) throw new Error('Inquiry not found.')

  const actorContext = await getFranchiseQueueActorContext(currentUser)
  const resolver = createFranchiseQueueResolver(admin, actorContext)
  const normalizedInquiry = await ensureInquiryQueueState(admin, rawInquiry, resolver)
  const returnedQueueLevel =
    normalizedInquiry.routing_company_id && normalizedInquiry.parent_company_id && normalizedInquiry.routing_company_id !== normalizedInquiry.parent_company_id
      ? 'suboffice_queue'
      : 'main_queue'

  const { error } = await admin
    .from('inquiries')
    .update({
      assigned_to: null,
      assigned_at: null,
      assignment_expires_at: null,
      current_company_id: normalizedInquiry.routing_company_id,
      queue_level: returnedQueueLevel,
      last_returned_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function deleteInquiry(id: number) {
  const currentUser = await requireInquiriesAccess()
  if (!['super_admin', 'admin', 'franchise', 'franchise_secretary'].includes(currentUser.role)) {
    throw new Error('Only franchise owner or secretary roles can delete inquiries.')
  }

  await requireScopedInquiry(id)

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
