import 'server-only'

import { getCurrentDashboardUser } from '@/lib/auth/user'
import type { DashboardUser } from '@/lib/auth/types'
import {
  getPreferredCompanyMembershipForProfile,
  getSecretaryCompanyScopeForMembership,
  normalizeCompanySystemRole,
  type CompanySystemRole,
} from '@/lib/company-members'
import { getSetting } from '@/lib/site-settings'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminSupabaseClient>

type CompanyRow = {
  company_name: string | null
  id: number
  parent_company_id: number | null
  user_profile_id: string | null
}

type ListingOwnerRow = {
  id: number
  user_profile_id: string | null
}

type LeadQueueRow = {
  assigned_at: string | null
  assigned_by_profile_id: string | null
  assigned_to: string | null
  assignment_expires_at: string | null
  created_at: string | null
  current_company_id: number | null
  id: number
  last_returned_at: string | null
  parent_company_id: number | null
  project_id: number | null
  queue_level: string | null
  routing_company_id: number | null
  updated_at: string | null
}

type InquiryQueueRow = {
  assigned_at: string | null
  assigned_by_profile_id: string | null
  assigned_to: string | null
  assignment_expires_at: string | null
  created_at: string | null
  current_company_id: number | null
  id: number
  last_returned_at: string | null
  listing_id: number | null
  parent_company_id: number | null
  project_id: number | null
  queue_level: string | null
  routing_company_id: number | null
}

type ProfilePlacement = {
  companyId: number
  companyName: string
  officeIsSuboffice: boolean
  organizationRole: CompanySystemRole
  parentCompanyId: number
}

export type FranchiseQueueLevel = 'main_queue' | 'suboffice_queue' | 'agent'

export type FranchiseQueueActorContext = {
  canAssignAcrossFranchise: boolean
  canAssignWithinCompanyOnly: boolean
  canManageQueue: boolean
  companyId: number | null
  organizationRole: CompanySystemRole | null
  parentCompanyId: number | null
  scopeCompanyIds: number[]
  user: DashboardUser
}

export type FranchiseAssignmentAgentOption = {
  full_name: string
  id: string
  office_name: string | null
  role: string | null
}

type QueueRoutingResolution = {
  currentCompanyId: number | null
  parentCompanyId: number | null
  queueLevel: FranchiseQueueLevel
  routingCompanyId: number | null
}

export function normalizeFranchiseQueueLevel(
  value: string | null | undefined,
  fallback: FranchiseQueueLevel = 'main_queue',
): FranchiseQueueLevel {
  if (value === 'main_queue' || value === 'suboffice_queue' || value === 'agent') {
    return value
  }

  return fallback
}

function buildExpiryIso(fromIso: string, hours: number) {
  const start = new Date(fromIso)
  return new Date(start.getTime() + hours * 60 * 60 * 1000).toISOString()
}

function isExpiredAssignment(queueLevel: FranchiseQueueLevel, expiresAt: string | null | undefined) {
  if (queueLevel !== 'agent' || !expiresAt) return false
  const expiry = new Date(expiresAt)
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now()
}

function getReturnedQueueLevel(routingCompanyId: number | null, parentCompanyId: number | null): FranchiseQueueLevel {
  if (!routingCompanyId || !parentCompanyId) return 'main_queue'
  return routingCompanyId === parentCompanyId ? 'main_queue' : 'suboffice_queue'
}

async function getCompany(admin: AdminClient, companyId: number, cache: Map<number, Promise<CompanyRow | null>>) {
  if (!cache.has(companyId)) {
    cache.set(
      companyId,
      (async () => {
        const { data, error } = await admin
          .from('company_profiles')
          .select('id, company_name, parent_company_id, user_profile_id')
          .eq('id', companyId)
          .maybeSingle<CompanyRow>()

        if (error) throw new Error(error.message)
        return data ?? null
      })(),
    )
  }

  return cache.get(companyId)!
}

async function getProfilePlacement(
  admin: AdminClient,
  profileId: string,
  profilePlacementCache: Map<string, Promise<ProfilePlacement | null>>,
  companyCache: Map<number, Promise<CompanyRow | null>>,
) {
  if (!profilePlacementCache.has(profileId)) {
    profilePlacementCache.set(
      profileId,
      (async () => {
        const membership = await getPreferredCompanyMembershipForProfile(admin, profileId)
        if (!membership) {
          return null
        }

        const scope = await getSecretaryCompanyScopeForMembership(admin, membership)
        const company = await getCompany(admin, membership.companyId, companyCache)

        return {
          companyId: membership.companyId,
          companyName: company?.company_name?.trim() || scope.companyName,
          officeIsSuboffice: membership.officeIsSuboffice,
          organizationRole: membership.organizationRole,
          parentCompanyId: scope.parentCompanyId,
        } satisfies ProfilePlacement
      })(),
    )
  }

  return profilePlacementCache.get(profileId)!
}

export async function getFranchiseAssignmentSlaHours() {
  const raw = await getSetting<number | string>('franchise_assignment_sla_hours', 24)
  const numeric: number = typeof raw === 'string' ? Number(raw) : raw ?? 24
  return Number.isFinite(numeric) && numeric > 0 ? Math.trunc(numeric) : 24
}

export async function getFranchiseQueueActorContext(user?: DashboardUser | null): Promise<FranchiseQueueActorContext | null> {
  const resolvedUser = user ?? await getCurrentDashboardUser()
  if (!resolvedUser) return null

  const admin = createAdminSupabaseClient()
  const membership = await getPreferredCompanyMembershipForProfile(admin, resolvedUser.profileId)

  if (!membership) {
    return {
      user: resolvedUser,
      organizationRole: null,
      companyId: null,
      parentCompanyId: null,
      scopeCompanyIds: [],
      canManageQueue: false,
      canAssignAcrossFranchise: false,
      canAssignWithinCompanyOnly: false,
    }
  }

  const scope = await getSecretaryCompanyScopeForMembership(admin, membership)
  const isOwner = membership.organizationRole === 'owner'
  const isMainSecretary = membership.organizationRole === 'main_secretary'
  const isSubofficeSecretary = membership.organizationRole === 'suboffice_secretary'

  return {
    user: resolvedUser,
    organizationRole: membership.organizationRole,
    companyId: membership.companyId,
    parentCompanyId: scope.parentCompanyId,
    scopeCompanyIds: isOwner || isMainSecretary ? scope.scopeCompanyIds : [membership.companyId],
    canManageQueue: isOwner || isMainSecretary || isSubofficeSecretary,
    canAssignAcrossFranchise: isOwner || isMainSecretary,
    canAssignWithinCompanyOnly: isSubofficeSecretary,
  }
}

export async function getAssignableFranchiseAgents(actorContext?: FranchiseQueueActorContext | null) {
  if (!actorContext?.canManageQueue || !actorContext.scopeCompanyIds.length) {
    return [] as FranchiseAssignmentAgentOption[]
  }

  const admin = createAdminSupabaseClient()
  const { data: memberships, error: membershipsError } = await admin
    .from('company_members')
    .select('company_id, system_role, user_profile_id')
    .in('company_id', actorContext.scopeCompanyIds)
    .returns<Array<{ company_id: number; system_role: string | null; user_profile_id: string }>>()

  if (membershipsError) {
    throw new Error(membershipsError.message)
  }

  const eligibleMemberships = (memberships ?? []).filter((membership) => {
    const officeIsSuboffice = membership.company_id !== actorContext.parentCompanyId
    return normalizeCompanySystemRole(membership.system_role, { officeIsSuboffice }) === 'agent'
  })

  if (!eligibleMemberships.length) {
    return [] as FranchiseAssignmentAgentOption[]
  }

  const profileIds = [...new Set(eligibleMemberships.map((membership) => membership.user_profile_id))]
  const companyIds = [...new Set(eligibleMemberships.map((membership) => membership.company_id))]

  const [{ data: profiles, error: profilesError }, { data: companies, error: companiesError }] = await Promise.all([
    admin
      .from('user_profiles')
      .select('account_status, full_name, fname, id, is_active, lname, role')
      .in('id', profileIds)
      .returns<Array<{ account_status: string | null; full_name: string | null; fname: string | null; id: string; is_active: boolean | null; lname: string | null; role: string | null }>>(),
    admin
      .from('company_profiles')
      .select('company_name, id, parent_company_id')
      .in('id', companyIds)
      .returns<Array<{ company_name: string | null; id: number; parent_company_id: number | null }>>(),
  ])

  if (profilesError) throw new Error(profilesError.message)
  if (companiesError) throw new Error(companiesError.message)

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]))
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const deduped = new Map<string, FranchiseAssignmentAgentOption>()

  for (const membership of eligibleMemberships) {
    const profile = profileMap.get(membership.user_profile_id)
    if (!profile || profile.is_active === false || profile.account_status === 'rejected' || profile.account_status === 'manually_disabled') {
      continue
    }

    const company = companyMap.get(membership.company_id)
    const fullName =
      profile.full_name?.trim() ||
      [profile.fname, profile.lname].filter(Boolean).join(' ').trim() ||
      'Unnamed member'

    if (!deduped.has(profile.id)) {
      deduped.set(profile.id, {
        id: profile.id,
        full_name: fullName,
        role: profile.role,
        office_name: company?.parent_company_id ? company.company_name ?? 'Suboffice' : 'Main Office',
      })
    }
  }

  return [...deduped.values()].sort((left, right) => left.full_name.localeCompare(right.full_name))
}

export function createFranchiseQueueResolver(admin: AdminClient, actorContext?: FranchiseQueueActorContext | null) {
  const companyCache = new Map<number, Promise<CompanyRow | null>>()
  const profilePlacementCache = new Map<string, Promise<ProfilePlacement | null>>()
  const listingOwnerCache = new Map<number, Promise<string | null>>()
  const projectOwnerCache = new Map<number, Promise<string | null>>()

  async function getListingOwnerProfileId(listingId: number) {
    if (!listingOwnerCache.has(listingId)) {
      listingOwnerCache.set(
        listingId,
        (async () => {
          const { data, error } = await admin
            .from('property_listings')
            .select('id, user_profile_id')
            .eq('id', listingId)
            .maybeSingle<ListingOwnerRow>()

          if (error) throw new Error(error.message)
          return data?.user_profile_id ?? null
        })(),
      )
    }

    return listingOwnerCache.get(listingId)!
  }

  async function getProjectOwnerProfileId(projectId: number) {
    if (!projectOwnerCache.has(projectId)) {
      projectOwnerCache.set(
        projectId,
        (async () => {
          const { data, error } = await admin
            .from('property_listings')
            .select('id, user_profile_id')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })
            .limit(1)
            .returns<ListingOwnerRow[]>()

          if (error) throw new Error(error.message)
          return data?.[0]?.user_profile_id ?? null
        })(),
      )
    }

    return projectOwnerCache.get(projectId)!
  }

  async function resolveFallbackRoutingCompanyId() {
    if (actorContext?.organizationRole === 'suboffice_secretary') {
      return actorContext.companyId
    }

    return actorContext?.parentCompanyId ?? actorContext?.companyId ?? null
  }

  async function resolveLeadRouting(row: LeadQueueRow): Promise<QueueRoutingResolution> {
    const fallbackRoutingCompanyId = await resolveFallbackRoutingCompanyId()
    const assignedPlacement =
      row.assigned_to
        ? await getProfilePlacement(admin, row.assigned_to, profilePlacementCache, companyCache)
        : null

    let routePlacement: ProfilePlacement | null = null

    if (row.project_id) {
      const projectOwnerProfileId = await getProjectOwnerProfileId(row.project_id)
      if (projectOwnerProfileId) {
        routePlacement = await getProfilePlacement(admin, projectOwnerProfileId, profilePlacementCache, companyCache)
      }
    }

    const routingCompanyId = row.routing_company_id ?? routePlacement?.companyId ?? assignedPlacement?.companyId ?? fallbackRoutingCompanyId
    const parentCompanyId = row.parent_company_id ?? routePlacement?.parentCompanyId ?? assignedPlacement?.parentCompanyId ?? actorContext?.parentCompanyId ?? routingCompanyId
    const currentCompanyId = row.current_company_id ?? (row.assigned_to ? assignedPlacement?.companyId ?? routingCompanyId : routingCompanyId)
    const fallbackQueueLevel = row.assigned_to
      ? 'agent'
      : routingCompanyId && parentCompanyId && routingCompanyId !== parentCompanyId
        ? 'suboffice_queue'
        : 'main_queue'

    return {
      parentCompanyId: parentCompanyId ?? null,
      routingCompanyId: routingCompanyId ?? null,
      currentCompanyId: currentCompanyId ?? null,
      queueLevel: normalizeFranchiseQueueLevel(row.queue_level, fallbackQueueLevel),
    }
  }

  async function resolveInquiryRouting(row: InquiryQueueRow): Promise<QueueRoutingResolution> {
    const fallbackRoutingCompanyId = await resolveFallbackRoutingCompanyId()
    const assignedPlacement =
      row.assigned_to
        ? await getProfilePlacement(admin, row.assigned_to, profilePlacementCache, companyCache)
        : null

    let routePlacement: ProfilePlacement | null = null

    if (row.listing_id) {
      const listingOwnerProfileId = await getListingOwnerProfileId(row.listing_id)
      if (listingOwnerProfileId) {
        routePlacement = await getProfilePlacement(admin, listingOwnerProfileId, profilePlacementCache, companyCache)
      }
    } else if (row.project_id) {
      const projectOwnerProfileId = await getProjectOwnerProfileId(row.project_id)
      if (projectOwnerProfileId) {
        routePlacement = await getProfilePlacement(admin, projectOwnerProfileId, profilePlacementCache, companyCache)
      }
    }

    const routingCompanyId = row.routing_company_id ?? routePlacement?.companyId ?? assignedPlacement?.companyId ?? fallbackRoutingCompanyId
    const parentCompanyId = row.parent_company_id ?? routePlacement?.parentCompanyId ?? assignedPlacement?.parentCompanyId ?? actorContext?.parentCompanyId ?? routingCompanyId
    const currentCompanyId = row.current_company_id ?? (row.assigned_to ? assignedPlacement?.companyId ?? routingCompanyId : routingCompanyId)
    const fallbackQueueLevel = row.assigned_to
      ? 'agent'
      : routingCompanyId && parentCompanyId && routingCompanyId !== parentCompanyId
        ? 'suboffice_queue'
        : 'main_queue'

    return {
      parentCompanyId: parentCompanyId ?? null,
      routingCompanyId: routingCompanyId ?? null,
      currentCompanyId: currentCompanyId ?? null,
      queueLevel: normalizeFranchiseQueueLevel(row.queue_level, fallbackQueueLevel),
    }
  }

  return {
    getCompany: (companyId: number) => getCompany(admin, companyId, companyCache),
    getProfilePlacement: (profileId: string) => getProfilePlacement(admin, profileId, profilePlacementCache, companyCache),
    resolveLeadRouting,
    resolveInquiryRouting,
  }
}

export async function ensureLeadQueueState<T extends LeadQueueRow>(
  admin: AdminClient,
  row: T,
  resolver: ReturnType<typeof createFranchiseQueueResolver>,
) {
  const resolved = await resolver.resolveLeadRouting(row)
  const patch: Partial<LeadQueueRow> = {}

  if (row.parent_company_id !== resolved.parentCompanyId) patch.parent_company_id = resolved.parentCompanyId
  if (row.routing_company_id !== resolved.routingCompanyId) patch.routing_company_id = resolved.routingCompanyId
  if (row.current_company_id !== resolved.currentCompanyId) patch.current_company_id = resolved.currentCompanyId
  if (row.queue_level !== resolved.queueLevel) patch.queue_level = resolved.queueLevel

  const currentQueueLevel = normalizeFranchiseQueueLevel(patch.queue_level ?? row.queue_level, resolved.queueLevel)
  const currentExpiresAt = row.assignment_expires_at
  const assignmentExpired = isExpiredAssignment(currentQueueLevel, currentExpiresAt)

  if (assignmentExpired) {
    const returnedQueueLevel = getReturnedQueueLevel(
      patch.routing_company_id ?? row.routing_company_id ?? resolved.routingCompanyId,
      patch.parent_company_id ?? row.parent_company_id ?? resolved.parentCompanyId,
    )
    const nowIso = new Date().toISOString()

    patch.queue_level = returnedQueueLevel
    patch.current_company_id = patch.routing_company_id ?? row.routing_company_id ?? resolved.routingCompanyId
    patch.assigned_to = null
    patch.assigned_at = null
    patch.assignment_expires_at = null
    patch.last_returned_at = nowIso
  }

  if (Object.keys(patch).length) {
    patch.updated_at = new Date().toISOString()
    const { error } = await admin.from('leads').update(patch).eq('id', row.id)
    if (error) throw new Error(error.message)
  }

  return { ...row, ...patch } as T
}

export async function ensureInquiryQueueState<T extends InquiryQueueRow>(
  admin: AdminClient,
  row: T,
  resolver: ReturnType<typeof createFranchiseQueueResolver>,
) {
  const resolved = await resolver.resolveInquiryRouting(row)
  const patch: Partial<InquiryQueueRow> = {}

  if (row.parent_company_id !== resolved.parentCompanyId) patch.parent_company_id = resolved.parentCompanyId
  if (row.routing_company_id !== resolved.routingCompanyId) patch.routing_company_id = resolved.routingCompanyId
  if (row.current_company_id !== resolved.currentCompanyId) patch.current_company_id = resolved.currentCompanyId
  if (row.queue_level !== resolved.queueLevel) patch.queue_level = resolved.queueLevel

  const currentQueueLevel = normalizeFranchiseQueueLevel(patch.queue_level ?? row.queue_level, resolved.queueLevel)
  const assignmentExpired = isExpiredAssignment(currentQueueLevel, row.assignment_expires_at)

  if (assignmentExpired) {
    patch.queue_level = getReturnedQueueLevel(
      patch.routing_company_id ?? row.routing_company_id ?? resolved.routingCompanyId,
      patch.parent_company_id ?? row.parent_company_id ?? resolved.parentCompanyId,
    )
    patch.current_company_id = patch.routing_company_id ?? row.routing_company_id ?? resolved.routingCompanyId
    patch.assigned_to = null
    patch.assigned_at = null
    patch.assignment_expires_at = null
    patch.last_returned_at = new Date().toISOString()
  }

  if (Object.keys(patch).length) {
    const { error } = await admin.from('inquiries').update(patch).eq('id', row.id)
    if (error) throw new Error(error.message)
  }

  return { ...row, ...patch } as T
}

export async function buildAgentAssignmentPayload(
  actorContext: FranchiseQueueActorContext,
  targetProfileId: string,
  resolver: ReturnType<typeof createFranchiseQueueResolver>,
  options?: {
    parentCompanyId?: number | null
    routingCompanyId?: number | null
  },
) {
  if (!actorContext.canManageQueue) {
    throw new Error('You do not have permission to assign queue items.')
  }

  const targetPlacement = await resolver.getProfilePlacement(targetProfileId)

  if (!targetPlacement || targetPlacement.organizationRole !== 'agent') {
    throw new Error('Only active agent members can receive assignments.')
  }

  if (actorContext.canAssignAcrossFranchise) {
    if (!actorContext.parentCompanyId || targetPlacement.parentCompanyId !== actorContext.parentCompanyId) {
      throw new Error('That agent is outside your franchise scope.')
    }
  } else if (actorContext.canAssignWithinCompanyOnly) {
    if (!actorContext.companyId || targetPlacement.companyId !== actorContext.companyId) {
      throw new Error('Suboffice secretaries can only assign agents in their own branch.')
    }
  } else {
    throw new Error('You do not have permission to assign queue items.')
  }

  const assignedAt = new Date().toISOString()
  const slaHours = await getFranchiseAssignmentSlaHours()
  const routingCompanyId =
    options?.routingCompanyId ??
    (actorContext.canAssignWithinCompanyOnly ? actorContext.companyId : actorContext.parentCompanyId) ??
    targetPlacement.companyId
  const parentCompanyId =
    options?.parentCompanyId ??
    actorContext.parentCompanyId ??
    targetPlacement.parentCompanyId ??
    routingCompanyId

  return {
    parent_company_id: parentCompanyId,
    routing_company_id: routingCompanyId,
    current_company_id: targetPlacement.companyId,
    queue_level: 'agent' as FranchiseQueueLevel,
    assigned_to: targetProfileId,
    assigned_by_profile_id: actorContext.user.profileId,
    assigned_at: assignedAt,
    assignment_expires_at: buildExpiryIso(assignedAt, slaHours),
    last_returned_at: null,
  }
}
