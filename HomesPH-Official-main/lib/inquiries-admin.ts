import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type {
  InquiryListingOptionRecord,
  InquiryProjectOptionRecord,
  InquiryRecord,
  InquiryStatus,
} from '@/lib/inquiries-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'buyer', 'developer'])
const INQUIRY_STATUSES = new Set<InquiryStatus>(['unread', 'read', 'replied', 'closed'])

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildDisplayName(row: { full_name: string | null; fname?: string | null; lname?: string | null; email?: string | null }) {
  return row.full_name?.trim() || [row.fname, row.lname].filter(Boolean).join(' ').trim() || row.email || 'Unknown sender'
}

async function getSupportMaps() {
  const admin = createAdminSupabaseClient()
  const [projectsResult, listingsResult, usersResult] = await Promise.all([
    admin.from('projects').select('id,name').order('name', { ascending: true }),
    admin.from('property_listings').select('id,project_id,title').order('title', { ascending: true }),
    admin.from('user_profiles').select('id,full_name,fname,lname').order('full_name', { ascending: true }),
  ])

  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (listingsResult.error) throw new Error(listingsResult.error.message)
  if (usersResult.error) throw new Error(usersResult.error.message)

  const projects = (projectsResult.data ?? []) as Array<{ id: number; name: string }>
  const listings = (listingsResult.data ?? []) as Array<{ id: number; project_id: number | null; title: string }>
  const users = (usersResult.data ?? []) as Array<{ id: string; full_name: string | null; fname: string | null; lname: string | null }>

  return {
    projects: projects.map((project) => ({ id: project.id, name: project.name })) as InquiryProjectOptionRecord[],
    listings: listings.map((listing) => ({ id: listing.id, project_id: listing.project_id, title: listing.title })) as InquiryListingOptionRecord[],
    users: users.map((user) => ({ id: user.id, name: buildDisplayName(user) })),
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

async function getScopedInquiryRows(user: Awaited<ReturnType<typeof requireInquiriesAccess>>) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('inquiries').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<any>

  if (['super_admin', 'admin'].includes(user.role)) {
    return rows
  }

  if (user.role === 'buyer') {
    return rows.filter((row) => row.sender_profile_id === user.profileId)
  }

  if (user.role === 'developer') {
    const scope = await getDeveloperOwnedScopes(user.profileId)
    const projectSet = new Set(scope.projectIds)
    const listingSet = new Set(scope.listingIds)
    return rows.filter((row) => (row.project_id && projectSet.has(row.project_id)) || (row.listing_id && listingSet.has(row.listing_id)))
  }

  return []
}

function mapInquiryRow(inquiry: any, projectMap: Map<number, string>, listingMap: Map<number, InquiryListingOptionRecord>, userMap: Map<string, string>): InquiryRecord {
  return {
    id: inquiry.id,
    sender_profile_id: inquiry.sender_profile_id,
    listing_id: inquiry.listing_id,
    project_id: inquiry.project_id,
    subject: inquiry.subject,
    message: inquiry.message,
    status: (inquiry.status ?? 'unread') as InquiryStatus,
    created_at: inquiry.created_at,
    sender_name: inquiry.sender_profile_id ? userMap.get(inquiry.sender_profile_id) ?? null : null,
    listing_title: inquiry.listing_id ? listingMap.get(inquiry.listing_id)?.title ?? null : null,
    project_name: inquiry.project_id ? projectMap.get(inquiry.project_id) ?? null : null,
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

export async function getInquiries(): Promise<InquiryRecord[]> {
  const currentUser = await requireInquiriesAccess()
  const [inquiries, support] = await Promise.all([
    getScopedInquiryRows(currentUser),
    getSupportMaps(),
  ])

  const projectMap = new Map(support.projects.map((project) => [project.id, project.name]))
  const listingMap = new Map(support.listings.map((listing) => [listing.id, listing]))
  const userMap = new Map(support.users.map((user) => [user.id, user.name]))

  return (inquiries ?? []).map((inquiry) => mapInquiryRow(inquiry, projectMap, listingMap, userMap))
}

export async function getUnreadInquiriesCount() {
  await requireInquiriesAccess()
  const admin = createAdminSupabaseClient()
  const { count, error } = await admin.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'unread')
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function getInquiryByIdInternal(id: number) {
  const inquiries = await getInquiries()
  return inquiries.find((inquiry) => inquiry.id === id) ?? null
}

export async function updateInquiryStatus(id: number, status: InquiryStatus) {
  const currentUser = await requireInquiriesAccess()
  if (!['super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Your role has read-only access to inquiries.')
  }
  if (!INQUIRY_STATUSES.has(status)) throw new Error('Invalid inquiry status.')

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function replyToInquiry(id: number, message: string) {
  const currentUser = await requireInquiriesAccess()
  if (!['super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Your role has read-only access to inquiries.')
  }
  if (!trimToNull(message)) throw new Error('Reply message is required.')

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').update({ status: 'replied' }).eq('id', id)
  if (error) throw new Error(error.message)
  const inquiry = await getInquiryByIdInternal(id)
  if (!inquiry) throw new Error('Inquiry not found.')
  return inquiry
}

export async function deleteInquiry(id: number) {
  const currentUser = await requireInquiriesAccess()
  if (!['super_admin', 'admin'].includes(currentUser.role)) {
    throw new Error('Your role has read-only access to inquiries.')
  }
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('inquiries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}