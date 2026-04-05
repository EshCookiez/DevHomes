'use server'

import { revalidatePath } from 'next/cache'
import {
  ACCOUNT_STATUS_APPROVED,
  ACCOUNT_STATUS_CORRECTION_REQUIRED,
  ACCOUNT_STATUS_PENDING_APPROVAL,
  ACCOUNT_STATUS_REJECTED,
  ACCOUNT_STATUS_UNDER_REVIEW,
  getSecretaryApplicationStatus,
  normalizeAccountStatus,
} from '@/lib/account-status'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import {
  getCompanySystemRoleLabel,
  getCompanySystemRolePriority,
  getPreferredCompanyMembershipForProfile,
  getSecretaryCompanyScopeForMembership,
  isSecretaryCompanyRole,
  normalizeCompanySystemRole,
  repairCompanyInvitationMemberships,
} from '@/lib/company-members'
import { sendAccountReviewNotification } from '@/lib/email/account-review-notifications'
import { normalizePrcStatus, PRC_STATUS_VERIFIED, roleUsesPrcVerification } from '@/lib/prc-status'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type CompanyRow = {
  company_name: string | null
  created_at: string | null
  id: number
  parent_company_id: number | null
  user_profile_id?: string | null
}

type MembershipRow = {
  company_id: number
  system_role: string | null
  user_profile_id: string
}

type ProfileRow = {
  account_status: string | null
  created_at: string | null
  fname: string | null
  full_name: string | null
  id: string
  is_active: boolean | null
  lname: string | null
  referred_by: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  role: string | null
}

type ContactRow = {
  email: string | null
  primary_mobile: string | null
  user_profile_id: string
}

type AddressRow = {
  city: string | null
  company_id: number
  full_address: string | null
  state: string | null
}

type InvitationRow = {
  company_id: number
  created_at: string | null
  email: string
  expires_at: string | null
  id: string
  invited_role: string | null
  invited_by: string | null
  status: string
}

type ActorProfileRow = {
  fname: string | null
  full_name: string | null
  id: string
  lname: string | null
  role: string | null
  user_id: string
}

type ActorMembershipRow = {
  company_id: number
  system_role: string | null
  user_profile_id: string
}

export type FranchiseNetworkOffice = {
  address: string
  companyId: number
  isParent: boolean
  memberCount: number
  name: string
  pendingApplications: number
  secretaryName: string | null
}

export type FranchiseNetworkMember = {
  approvedBy: string
  assignedBy: string
  assignedSuboffice: string
  companyId: number
  email: string
  fullName: string
  invitationType: string
  invitedBy: string
  joinedAt: string | null
  phone: string
  profileId: string
  roleLabel: string
  status: string
  statusLabel: string
  systemRole: string
  workplace: string
}

export type FranchiseDashboardSummary = {
  activeMembers: number
  assignedSecretaries: number
  companyName: string
  networkMembers: number
  ownerReady: number
  pendingApplications: number
  pendingInvites: number
  salespersons: number
  suboffices: number
}

export type FranchiseDashboardSnapshot = {
  applicationsByMonth: Array<{ count: number; name: string }>
  hasCompany: boolean
  latestMembers: FranchiseNetworkMember[]
  members: FranchiseNetworkMember[]
  officeBreakdown: Array<{ count: number; name: string }>
  offices: FranchiseNetworkOffice[]
  summary: FranchiseDashboardSummary
}

export type FranchiseApplicationsSnapshot = {
  applications: FranchiseNetworkMember[]
  companyName: string
  hasCompany: boolean
}

type OwnerReviewActionResult = {
  success: boolean
  message: string
  emailSent?: boolean
}

type OwnerScopedApplication = {
  applicantName: string
  companyId: number
  email: string
  profile: {
    account_status: string | null
    full_name: string | null
    id: string
    is_active: boolean | null
    prc_number: string | null
    prc_status: string | null
    rejection_reason: string | null
    reviewed_at: string | null
    role: string | null
  }
  user: Awaited<ReturnType<typeof getCurrentDashboardUser>>
}

function buildFullName(profile: ProfileRow | null | undefined) {
  if (!profile) {
    return 'Unknown Member'
  }

  return (
    profile.full_name?.trim() ||
    [profile.fname, profile.lname].filter(Boolean).join(' ').trim() ||
    'Unknown Member'
  )
}

function formatOfficeAddress(address: AddressRow | null | undefined) {
  if (!address) {
    return 'Address not set'
  }

  return (
    [address.city?.trim(), address.state?.trim()].filter(Boolean).join(', ') ||
    address.full_address?.trim() ||
    'Address not set'
  )
}

function formatMemberRole(role: string | null | undefined) {
  return getCompanySystemRoleLabel(role)
}

function formatActorRole(role: string | null | undefined, organizationRole?: string | null) {
  if (organizationRole === 'owner' || role === 'franchise') {
    return 'Owner'
  }

  if (isSecretaryCompanyRole(organizationRole) || role === 'franchise_secretary') {
    return 'Secretary'
  }

  if (role === 'salesperson' || role === 'agent') {
    return 'Salesperson'
  }

  return 'Team Member'
}

function buildActorLabel(
  profile: ActorProfileRow | null | undefined,
  fallbackRole?: string | null,
  organizationRole?: string | null,
) {
  if (profile) {
    const name =
      profile.full_name?.trim() ||
      [profile.fname, profile.lname].filter(Boolean).join(' ').trim()

    if (name) {
      return `${name} (${formatActorRole(profile.role, organizationRole)})`
    }

    return formatActorRole(profile.role, organizationRole)
  }

  if (fallbackRole) {
    return fallbackRole
  }

  return 'Not recorded'
}

function formatApplicationStatusLabel(status: string) {
  switch (status) {
    case ACCOUNT_STATUS_PENDING_APPROVAL:
      return 'Pending Approval'
    case ACCOUNT_STATUS_UNDER_REVIEW:
      return 'Ready for Owner'
    case ACCOUNT_STATUS_CORRECTION_REQUIRED:
      return 'Correction Required'
    case ACCOUNT_STATUS_APPROVED:
      return 'Approved'
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }
}

function getMembershipRolePriority(role: string | null | undefined) {
  return getCompanySystemRolePriority(role)
}

function getInvitationRecordPriority(invitation: InvitationRow) {
  switch (invitation.status) {
    case 'accepted':
      return 0
    case 'pending':
      return 1
    case 'cancelled':
      return 2
    default:
      return 3
  }
}

function getHighestPriorityOrganizationRole(
  memberships: Array<{ company_id: number; system_role: string | null }> | null | undefined,
  officeMap: Map<number, { parent_company_id: number | null }>,
) {
  const prioritizedMembership = [...(memberships ?? [])].sort((left, right) => {
    const leftOffice = officeMap.get(left.company_id)
    const rightOffice = officeMap.get(right.company_id)

    return (
      getCompanySystemRolePriority(left.system_role, Boolean(leftOffice?.parent_company_id)) -
      getCompanySystemRolePriority(right.system_role, Boolean(rightOffice?.parent_company_id))
    )
  })[0]

  if (!prioritizedMembership) {
    return null
  }

  const prioritizedOffice = officeMap.get(prioritizedMembership.company_id)
  return normalizeCompanySystemRole(prioritizedMembership.system_role, {
    officeIsSuboffice: Boolean(prioritizedOffice?.parent_company_id),
  })
}

function getInvitationType(
  invitation: InvitationRow | null | undefined,
  inviterProfile: ActorProfileRow | null | undefined,
  inviterOrganizationRole: string | null | undefined,
  hasReferral: boolean,
) {
  if (invitation) {
    if (isSecretaryCompanyRole(inviterOrganizationRole) || inviterProfile?.role === 'franchise_secretary') {
      return 'Secretary Invite'
    }

    if (inviterOrganizationRole === 'owner' || inviterProfile?.role === 'franchise') {
      return 'Owner Invite'
    }

    return 'Company Invite'
  }

  if (hasReferral) {
    return 'Referral'
  }

  return 'Manual'
}

function normalizeInvitationStatus(invitation: InvitationRow) {
  if (invitation.status !== 'pending') {
    return invitation.status
  }

  if (!invitation.expires_at) {
    return invitation.status
  }

  return new Date(invitation.expires_at).getTime() < Date.now() ? 'expired' : 'pending'
}

function buildMonthSeries(dates: Array<string | null | undefined>, months = 6) {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const now = new Date()
  const timeline = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1)
    return {
      count: 0,
      key: `${date.getFullYear()}-${date.getMonth()}`,
      name: formatter.format(date),
      month: date.getMonth(),
      year: date.getFullYear(),
    }
  })

  const counts = new Map(timeline.map((entry) => [entry.key, 0]))

  for (const rawDate of dates) {
    if (!rawDate) {
      continue
    }

    const parsed = new Date(rawDate)
    if (Number.isNaN(parsed.getTime())) {
      continue
    }

    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return timeline.map((entry) => ({
    count: counts.get(entry.key) ?? 0,
    name: entry.name,
  }))
}

async function getFranchiseContext() {
  const user = await getCurrentDashboardUser()
  if (!user || user.role !== 'franchise') {
    throw new Error('Only franchise owners can access this data.')
  }

  const admin = createAdminSupabaseClient()

  const ownedCompanyResult = await admin
    .from('company_profiles')
    .select('id, company_name, parent_company_id, created_at')
    .eq('user_profile_id', user.profileId)
    .is('parent_company_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<CompanyRow>()

  if (ownedCompanyResult.error) {
    throw new Error(ownedCompanyResult.error.message)
  }

  if (ownedCompanyResult.data) {
    return {
      admin,
      company: ownedCompanyResult.data,
      user,
    }
  }

  const ownerMembershipResult = await admin
    .from('company_members')
    .select('company_id')
    .eq('user_profile_id', user.profileId)
    .eq('system_role', 'owner')
    .limit(1)
    .maybeSingle<{ company_id: number }>()

  if (ownerMembershipResult.error) {
    throw new Error(ownerMembershipResult.error.message)
  }

  if (!ownerMembershipResult.data?.company_id) {
    return {
      admin,
      company: null,
      user,
    }
  }

  const fallbackCompanyResult = await admin
    .from('company_profiles')
    .select('id, company_name, parent_company_id, created_at')
    .eq('id', ownerMembershipResult.data.company_id)
    .is('parent_company_id', null)
    .maybeSingle<CompanyRow>()

  if (fallbackCompanyResult.error) {
    throw new Error(fallbackCompanyResult.error.message)
  }

  return {
    admin,
    company: fallbackCompanyResult.data ?? null,
    user,
  }
}

async function getFranchiseScopeCompanyIds() {
  const context = await getFranchiseContext()

  if (!context.company) {
    throw new Error('Your franchise organization is not set up yet.')
  }

  const [subofficesResult, duplicateRootsResult] = await Promise.all([
    context.admin
      .from('company_profiles')
      .select('id')
      .eq('parent_company_id', context.company.id)
      .returns<Array<{ id: number }>>(),
    context.company.company_name?.trim()
      ? context.admin
          .from('company_profiles')
          .select('id')
          .eq('company_name', context.company.company_name.trim())
          .is('parent_company_id', null)
          .neq('id', context.company.id)
          .is('user_profile_id', null)
          .returns<Array<{ id: number }>>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (subofficesResult.error) {
    throw new Error(subofficesResult.error.message)
  }

  if (duplicateRootsResult.error) {
    throw new Error(duplicateRootsResult.error.message)
  }

  return {
    ...context,
    companyIds: [
      context.company.id,
      ...(subofficesResult.data ?? []).map((office) => office.id),
      ...(duplicateRootsResult.data ?? []).map((office) => office.id),
    ],
  }
}

async function getOwnerScopedApplication(agentProfileId: string): Promise<OwnerScopedApplication> {
  const user = await getCurrentDashboardUser()
  if (!user || !['franchise', 'franchise_secretary'].includes(user.role)) {
    throw new Error('Only franchise owners or the main secretary can approve applications.')
  }

  const admin = createAdminSupabaseClient()
  const context =
    user.role === 'franchise_secretary'
      ? await (async () => {
          const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
            allowedOrganizationRoles: ['main_secretary'],
          })

          if (!membership) {
            throw new Error('Only the main secretary can approve franchise applications.')
          }

          const scope = await getSecretaryCompanyScopeForMembership(admin, membership)

          return {
            admin,
            company: null,
            companyIds: scope.scopeCompanyIds,
            user,
          }
        })()
      : await getFranchiseScopeCompanyIds()

  const { data: memberRecords, error: membershipError } = await context.admin
    .from('company_members')
    .select('company_id, user_profile_id')
    .in('company_id', context.companyIds)
    .eq('user_profile_id', agentProfileId)
    .limit(1)
    .returns<Array<{ company_id: number; user_profile_id: string }>>()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  const memberRecord = memberRecords?.[0]

  if (!memberRecord) {
    throw new Error('This application is outside your franchise scope.')
  }

  const [profileResult, contactResult] = await Promise.all([
    context.admin
      .from('user_profiles')
      .select('id, full_name, role, prc_number, prc_status, is_active, account_status, reviewed_at, rejection_reason')
      .eq('id', agentProfileId)
      .maybeSingle<{
        account_status: string | null
        full_name: string | null
        id: string
        is_active: boolean | null
        prc_number: string | null
        prc_status: string | null
        rejection_reason: string | null
        reviewed_at: string | null
        role: string | null
      }>(),
    context.admin
      .from('contact_information')
      .select('email')
      .eq('user_profile_id', agentProfileId)
      .maybeSingle<{ email: string | null }>(),
  ])

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (contactResult.error) {
    throw new Error(contactResult.error.message)
  }

  if (!profileResult.data) {
    throw new Error('Application not found.')
  }

  if (!['salesperson', 'agent'].includes(profileResult.data.role ?? '')) {
    throw new Error('Only invited agent applications can be approved from this review screen.')
  }

  return {
    applicantName: profileResult.data.full_name?.trim() || contactResult.data?.email?.trim() || 'This applicant',
    companyId: memberRecord.company_id,
    email: contactResult.data?.email?.trim() || '',
    profile: profileResult.data,
    user: context.user,
  }
}

export async function getFranchiseDashboardSnapshot(): Promise<FranchiseDashboardSnapshot> {
  const context = await getFranchiseContext()

  if (!context.company) {
    return {
      applicationsByMonth: [],
      hasCompany: false,
      latestMembers: [],
      members: [],
      officeBreakdown: [],
      offices: [],
      summary: {
        activeMembers: 0,
        assignedSecretaries: 0,
        companyName: '',
        networkMembers: 0,
        ownerReady: 0,
        pendingApplications: 0,
        pendingInvites: 0,
        salespersons: 0,
        suboffices: 0,
      },
    }
  }

  const { admin, company } = context

  const [subofficesResult, duplicateRootsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id, company_name, parent_company_id, created_at')
      .eq('parent_company_id', company.id)
      .order('created_at', { ascending: false })
      .returns<CompanyRow[]>(),
    company.company_name?.trim()
      ? admin
          .from('company_profiles')
          .select('id, company_name, parent_company_id, created_at')
          .eq('company_name', company.company_name.trim())
          .is('parent_company_id', null)
          .neq('id', company.id)
          .is('user_profile_id', null)
          .order('created_at', { ascending: false })
          .returns<CompanyRow[]>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (subofficesResult.error) {
    throw new Error(subofficesResult.error.message)
  }

  if (duplicateRootsResult.error) {
    throw new Error(duplicateRootsResult.error.message)
  }

  const duplicateRootOffices = duplicateRootsResult.data ?? []
  const subofficeRows = subofficesResult.data ?? []
  const scopeOffices = [company, ...duplicateRootOffices, ...subofficeRows]
  const displayOffices = [company, ...subofficeRows]
  const duplicateRootIds = duplicateRootOffices.map((office) => office.id)
  const companyIds = scopeOffices.map((office) => office.id)

  await Promise.all(
    companyIds.map(async (companyId) => {
      try {
        await repairCompanyInvitationMemberships(admin, companyId)
      } catch {
        // Keep dashboards usable even if repair is not needed or a table is mid-migration.
      }
    }),
  )

  const [membershipsResult, addressesResult, invitationsResult] = await Promise.all([
    admin
      .from('company_members')
      .select('company_id, user_profile_id, system_role')
      .in('company_id', companyIds)
      .returns<MembershipRow[]>(),
    admin
      .from('addresses')
      .select('company_id, city, state, full_address')
      .in('company_id', companyIds)
      .returns<AddressRow[]>(),
    admin
      .from('company_invitations')
      .select('id, company_id, email, invited_role, invited_by, status, expires_at, created_at')
      .in('company_id', companyIds)
      .returns<InvitationRow[]>(),
  ])

  if (membershipsResult.error) {
    throw new Error(membershipsResult.error.message)
  }

  if (addressesResult.error) {
    throw new Error(addressesResult.error.message)
  }

  if (invitationsResult.error) {
    throw new Error(invitationsResult.error.message)
  }

  const memberProfileIds = [...new Set((membershipsResult.data ?? []).map((member) => member.user_profile_id).filter(Boolean))]
  const [profilesResult, contactsResult] = memberProfileIds.length
    ? await Promise.all([
        admin
          .from('user_profiles')
          .select('id, fname, lname, full_name, role, account_status, is_active, reviewed_at, reviewed_by, rejection_reason, created_at, referred_by')
          .in('id', memberProfileIds)
          .returns<ProfileRow[]>(),
        admin
          .from('contact_information')
          .select('user_profile_id, email, primary_mobile')
          .in('user_profile_id', memberProfileIds)
          .returns<ContactRow[]>(),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  if (contactsResult.error) {
    throw new Error(contactsResult.error.message)
  }

  const profiles = profilesResult.data ?? []
  const invitations = invitationsResult.data ?? []
  const inviterUserIds = [...new Set(invitations.map((invite) => invite.invited_by).filter(Boolean))] as string[]
  const reviewerUserIds = [...new Set(profiles.map((profile) => profile.reviewed_by).filter(Boolean))] as string[]
  const referredProfileIds = [...new Set(profiles.map((profile) => profile.referred_by).filter(Boolean))] as string[]
  const actorUserIds = [...new Set([...inviterUserIds, ...reviewerUserIds])]

  const [actorProfilesResult, referredProfilesResult] = await Promise.all([
    actorUserIds.length
      ? admin
          .from('user_profiles')
          .select('id, user_id, fname, lname, full_name, role')
          .in('user_id', actorUserIds)
          .returns<ActorProfileRow[]>()
      : Promise.resolve({ data: [], error: null }),
    referredProfileIds.length
      ? admin
          .from('user_profiles')
          .select('id, user_id, fname, lname, full_name, role')
          .in('id', referredProfileIds)
          .returns<ActorProfileRow[]>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (actorProfilesResult.error) {
    throw new Error(actorProfilesResult.error.message)
  }

  if (referredProfilesResult.error) {
    throw new Error(referredProfilesResult.error.message)
  }

  const actorProfileIds = [...new Set((actorProfilesResult.data ?? []).map((profile) => profile.id))]
  const actorMembershipProfileIds = [
    ...new Set([
      ...actorProfileIds,
      ...((referredProfilesResult.data ?? []).map((profile) => profile.id)),
    ]),
  ]
  const actorMembershipsResult = actorMembershipProfileIds.length
    ? await admin
        .from('company_members')
        .select('company_id, system_role, user_profile_id')
        .in('user_profile_id', actorMembershipProfileIds)
        .in('company_id', companyIds)
        .returns<ActorMembershipRow[]>()
    : { data: [], error: null }

  if (actorMembershipsResult.error) {
    throw new Error(actorMembershipsResult.error.message)
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
  const contactMap = new Map((contactsResult.data ?? []).map((contact) => [contact.user_profile_id, contact]))
  const addressMap = new Map((addressesResult.data ?? []).map((address) => [address.company_id, address]))
  const officeMap = new Map(scopeOffices.map((office) => [office.id, office]))
  const officePriorityMap = new Map(scopeOffices.map((office, index) => [office.id, index]))
  const actorProfileByUserId = new Map((actorProfilesResult.data ?? []).map((profile) => [profile.user_id, profile]))
  const referredProfileMap = new Map((referredProfilesResult.data ?? []).map((profile) => [profile.id, profile]))
  const actorMembershipsByProfileId = new Map<string, ActorMembershipRow[]>()
  const invitationByEmail = new Map<string, InvitationRow>()

  for (const membership of actorMembershipsResult.data ?? []) {
    const group = actorMembershipsByProfileId.get(membership.user_profile_id) ?? []
    group.push(membership)
    actorMembershipsByProfileId.set(membership.user_profile_id, group)
  }

  for (const invitation of invitations) {
    const key = invitation.email?.trim().toLowerCase()
    if (!key) {
      continue
    }

    const existing = invitationByEmail.get(key)
    if (!existing) {
      invitationByEmail.set(key, invitation)
      continue
    }

    const priorityDelta = getInvitationRecordPriority(invitation) - getInvitationRecordPriority(existing)
    if (priorityDelta < 0) {
      invitationByEmail.set(key, invitation)
      continue
    }

    if (priorityDelta === 0) {
      const existingTime = existing.created_at ? new Date(existing.created_at).getTime() : 0
      const invitationTime = invitation.created_at ? new Date(invitation.created_at).getTime() : 0
      if (invitationTime > existingTime) {
        invitationByEmail.set(key, invitation)
      }
    }
  }

  const uniqueMemberships = [...(membershipsResult.data ?? [])]
    .sort((left, right) => {
      const leftOffice = officeMap.get(left.company_id)
      const rightOffice = officeMap.get(right.company_id)
      const officePriorityDelta =
        (officePriorityMap.get(left.company_id) ?? Number.MAX_SAFE_INTEGER) -
        (officePriorityMap.get(right.company_id) ?? Number.MAX_SAFE_INTEGER)

      if (officePriorityDelta !== 0) {
        return officePriorityDelta
      }

      return (
        getCompanySystemRolePriority(left.system_role, Boolean(leftOffice?.parent_company_id)) -
        getCompanySystemRolePriority(right.system_role, Boolean(rightOffice?.parent_company_id))
      )
    })
    .filter((member, index, entries) => {
      return index === entries.findIndex((entry) => entry.user_profile_id === member.user_profile_id)
    })

  const members = uniqueMemberships
    .map<FranchiseNetworkMember>((member) => {
      const profile = profileMap.get(member.user_profile_id)
      const contact = contactMap.get(member.user_profile_id)
      const office = officeMap.get(member.company_id)
      const normalizedSystemRole = normalizeCompanySystemRole(member.system_role, {
        officeIsSuboffice: Boolean(office?.parent_company_id),
      })
      const status = profile
        ? getSecretaryApplicationStatus(profile)
        : ACCOUNT_STATUS_APPROVED
      const normalizedEmail = contact?.email?.trim().toLowerCase() || ''
      const invitation = normalizedEmail ? invitationByEmail.get(normalizedEmail) ?? null : null
      const inviterProfile = invitation?.invited_by ? actorProfileByUserId.get(invitation.invited_by) ?? null : null
      const inviterOrganizationRole = inviterProfile
        ? getHighestPriorityOrganizationRole(actorMembershipsByProfileId.get(inviterProfile.id), officeMap)
        : null
      const referrerProfile = profile?.referred_by ? referredProfileMap.get(profile.referred_by) ?? null : null
      const referrerOrganizationRole = referrerProfile
        ? getHighestPriorityOrganizationRole(actorMembershipsByProfileId.get(referrerProfile.id), officeMap)
        : null
      const reviewerProfile = profile?.reviewed_by ? actorProfileByUserId.get(profile.reviewed_by) ?? null : null
      const isSubofficeMember = office?.parent_company_id === company.id
      const assignedSuboffice = isSubofficeMember
        ? office?.company_name?.trim() || 'Unnamed Suboffice'
        : 'Main Office'
      const invitationType = getInvitationType(invitation, inviterProfile, inviterOrganizationRole, Boolean(referrerProfile))
      const invitedBy = inviterProfile
        ? buildActorLabel(inviterProfile, null, inviterOrganizationRole)
        : referrerProfile
          ? `${buildActorLabel(referrerProfile, null, referrerOrganizationRole)} (Referral)`
          : invitation
            ? 'Company Invite'
            : 'Manual'

      return {
        approvedBy: reviewerProfile
          ? buildActorLabel(
              reviewerProfile,
              null,
              getHighestPriorityOrganizationRole(actorMembershipsByProfileId.get(reviewerProfile.id), officeMap),
            )
          : 'Not recorded',
        assignedBy: 'Not recorded',
        assignedSuboffice,
        companyId: member.company_id,
        email: contact?.email?.trim() || '',
        fullName: buildFullName(profile),
        invitationType,
        invitedBy,
        joinedAt: profile?.created_at ?? null,
        phone: contact?.primary_mobile?.trim() || '',
        profileId: member.user_profile_id,
        roleLabel: formatMemberRole(normalizedSystemRole),
        status,
        statusLabel: formatApplicationStatusLabel(status),
        systemRole: normalizedSystemRole,
        workplace: officeMap.get(member.company_id)?.company_name?.trim() || 'Unassigned Office',
      }
    })
    .sort((left, right) => {
      const leftTime = left.joinedAt ? new Date(left.joinedAt).getTime() : 0
      const rightTime = right.joinedAt ? new Date(right.joinedAt).getTime() : 0
      return rightTime - leftTime
    })

  const normalizedInvitations = invitations.map((invitation) => normalizeInvitationStatus(invitation))

  const officeSummaryGroupIds = new Map<number, number[]>(
    [
      [company.id, [company.id, ...duplicateRootIds]],
      ...subofficeRows.map((office): [number, number[]] => [office.id, [office.id]]),
    ],
  )

  const officeSummaries: FranchiseNetworkOffice[] = displayOffices.map((office) => {
    const aggregatedCompanyIds = officeSummaryGroupIds.get(office.id) ?? [office.id]
    const officeMembers = members.filter((member) => aggregatedCompanyIds.includes(member.companyId))
    const expectedSecretaryRole = office.id === company.id ? 'main_secretary' : 'suboffice_secretary'
    const secretaryMember = officeMembers.find((member) => member.systemRole === expectedSecretaryRole)
    const address = aggregatedCompanyIds
      .map((companyId) => addressMap.get(companyId))
      .find((value): value is AddressRow => Boolean(value))

    return {
      address: formatOfficeAddress(address),
      companyId: office.id,
      isParent: office.id === company.id,
      memberCount: officeMembers.length,
      name: office.company_name?.trim() || 'Unnamed Office',
      pendingApplications: officeMembers.filter((member) =>
        [ACCOUNT_STATUS_PENDING_APPROVAL, ACCOUNT_STATUS_UNDER_REVIEW, ACCOUNT_STATUS_CORRECTION_REQUIRED].includes(member.status),
      ).length,
      secretaryName: secretaryMember?.fullName ?? null,
    }
  })

  return {
    applicationsByMonth: buildMonthSeries(
      members
        .filter((member) => member.systemRole !== 'owner')
        .map((member) => member.joinedAt),
    ),
    hasCompany: true,
    latestMembers: members.slice(0, 6),
    members,
    officeBreakdown: officeSummaries.map((office) => ({
      count: office.memberCount,
      name: office.name.length > 18 ? `${office.name.slice(0, 18)}...` : office.name,
    })),
    offices: officeSummaries,
    summary: {
      activeMembers: members.filter((member) => {
        const profile = profileMap.get(member.profileId)
        return normalizeAccountStatus(profile?.account_status, profile?.is_active) === ACCOUNT_STATUS_APPROVED
      }).length,
      assignedSecretaries: members.filter((member) =>
        ['main_secretary', 'suboffice_secretary'].includes(member.systemRole),
      ).length,
      companyName: company.company_name?.trim() || 'Franchise Organization',
      networkMembers: members.length,
      ownerReady: members.filter((member) => member.status === ACCOUNT_STATUS_UNDER_REVIEW).length,
      pendingApplications: members.filter((member) =>
        [ACCOUNT_STATUS_PENDING_APPROVAL, ACCOUNT_STATUS_UNDER_REVIEW, ACCOUNT_STATUS_CORRECTION_REQUIRED].includes(member.status),
      ).length,
      pendingInvites: normalizedInvitations.filter((status) => status === 'pending').length,
      salespersons: members.filter((member) => member.systemRole === 'agent').length,
      suboffices: officeSummaries.filter((office) => !office.isParent).length,
    },
  }
}

export async function getFranchiseApplicationsSnapshot(): Promise<FranchiseApplicationsSnapshot> {
  const snapshot = await getFranchiseDashboardSnapshot()

  return {
    applications: snapshot.members.filter((member) => member.systemRole === 'agent'),
    companyName: snapshot.summary.companyName,
    hasCompany: snapshot.hasCompany,
  }
}

export async function approveAgentAsFranchiseOwner(agentProfileId: string): Promise<OwnerReviewActionResult> {
  const scopedApplication = await getOwnerScopedApplication(agentProfileId)
  const currentStatus = getSecretaryApplicationStatus(scopedApplication.profile)

  if (![ACCOUNT_STATUS_UNDER_REVIEW, ACCOUNT_STATUS_PENDING_APPROVAL].includes(currentStatus)) {
    throw new Error('Only pending or owner-ready applications can be approved from this review screen.')
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('user_profiles')
    .update({
      account_status: ACCOUNT_STATUS_APPROVED,
      is_active: true,
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: scopedApplication.user?.userId ?? null,
    })
    .eq('id', agentProfileId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/applications')
  revalidatePath('/dashboard/franchise/team')
  revalidatePath('/dashboard/secretary')
  revalidatePath('/dashboard/secretary/applications')
  revalidatePath(`/dashboard/profile/${agentProfileId}`)

  if (!scopedApplication.email) {
    return {
      success: true,
      message: 'Application approved. The agent can now sign in, but no email address was available for a notification.',
      emailSent: false,
    }
  }

  const emailResult = await sendAccountReviewNotification({
    decision: 'approved',
    email: scopedApplication.email,
    fullName: scopedApplication.applicantName,
    prcStatusNote:
      roleUsesPrcVerification(scopedApplication.profile.role) &&
      normalizePrcStatus(
        scopedApplication.profile.prc_status,
        scopedApplication.profile.role,
        scopedApplication.profile.prc_number,
      ) !== PRC_STATUS_VERIFIED
        ? 'Your PRC verification is still pending separate platform review.'
        : null,
  })

  return {
    success: true,
    message: emailResult.sent
      ? 'Application approved. The agent can now sign in.'
      : `Application approved, but the approval email could not be sent. ${emailResult.message ?? ''}`.trim(),
    emailSent: emailResult.sent,
  }
}

export async function rejectAgentAsFranchiseOwner(
  agentProfileId: string,
  rejectionReason: string,
): Promise<OwnerReviewActionResult> {
  const trimmedReason = rejectionReason.trim()

  if (trimmedReason.length < 10) {
    throw new Error('Add a short reason so the agent understands why the application was not approved.')
  }

  const scopedApplication = await getOwnerScopedApplication(agentProfileId)
  const currentStatus = getSecretaryApplicationStatus(scopedApplication.profile)

  if (![ACCOUNT_STATUS_UNDER_REVIEW, ACCOUNT_STATUS_PENDING_APPROVAL].includes(currentStatus)) {
    throw new Error('Only pending or owner-ready applications can be rejected from this review screen.')
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('user_profiles')
    .update({
      account_status: ACCOUNT_STATUS_REJECTED,
      is_active: false,
      rejection_reason: trimmedReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: scopedApplication.user?.userId ?? null,
    })
    .eq('id', agentProfileId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/applications')
  revalidatePath('/dashboard/franchise/team')
  revalidatePath('/dashboard/secretary')
  revalidatePath('/dashboard/secretary/applications')
  revalidatePath(`/dashboard/profile/${agentProfileId}`)

  if (!scopedApplication.email) {
    return {
      success: true,
      message: 'Application rejected. No email address was available to notify the agent.',
      emailSent: false,
    }
  }

  const emailResult = await sendAccountReviewNotification({
    decision: 'rejected',
    email: scopedApplication.email,
    fullName: scopedApplication.applicantName,
    rejectionReason: trimmedReason,
  })

  return {
    success: true,
    message: emailResult.sent
      ? 'Application rejected and the agent was notified.'
      : `Application rejected, but the rejection email could not be sent. ${emailResult.message ?? ''}`.trim(),
    emailSent: emailResult.sent,
  }
}
