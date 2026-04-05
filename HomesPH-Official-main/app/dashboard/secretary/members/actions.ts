'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import {
  ACCOUNT_STATUS_CORRECTION_REQUIRED,
  ACCOUNT_STATUS_PENDING_APPROVAL,
  ACCOUNT_STATUS_REJECTED,
  getSecretaryApplicationStatus,
  normalizeAccountStatus,
} from '@/lib/account-status'
import { getPrcStatusLabel, normalizePrcStatus, roleUsesPrcVerification } from '@/lib/prc-status'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import {
  getCompanySystemRoleLabel,
  getCompanySystemRolePriority,
  getPreferredCompanyMembershipForProfile,
  getSecretaryCompanyScopeForMembership,
} from '@/lib/company-members'
import { revalidatePath } from 'next/cache'

function buildFullName(fname?: string | null, lname?: string | null) {
  return [fname?.trim(), lname?.trim()].filter(Boolean).join(' ').trim() || null
}

function buildReviewerName(reviewer?: { fname?: string | null; full_name?: string | null; lname?: string | null } | null) {
  if (!reviewer) {
    return 'Not recorded'
  }

  return (
    reviewer.full_name?.trim() ||
    buildFullName(reviewer.fname, reviewer.lname) ||
    'Not recorded'
  )
}

function formatActorRole(role: string | null | undefined, organizationRole?: string | null) {
  if (organizationRole === 'owner' || role === 'franchise') {
    return 'Owner'
  }

  if (organizationRole === 'main_secretary' || organizationRole === 'suboffice_secretary' || role === 'franchise_secretary') {
    return 'Secretary'
  }

  if (role === 'salesperson' || role === 'agent') {
    return 'Salesperson'
  }

  return 'Team Member'
}

function buildActorLabel(
  profile?: { fname?: string | null; full_name?: string | null; lname?: string | null; role?: string | null } | null,
  organizationRole?: string | null,
) {
  if (!profile) {
    return 'Manual'
  }

  const name = profile.full_name?.trim() || buildFullName(profile.fname, profile.lname)
  const roleLabel = formatActorRole(profile.role, organizationRole)
  return name ? `${name} (${roleLabel})` : roleLabel
}

function getInvitationRecordPriority(invitation: { created_at?: string | null; status: string }) {
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

function getOnboardingNote(
  status: string,
  isActive: boolean | null,
  role: string | null | undefined,
  prcNumber: string | null | undefined,
  prcStatus: string | null | undefined,
) {
  if (normalizeAccountStatus(status, isActive) === 'approved') {
    if (roleUsesPrcVerification(role) && normalizePrcStatus(prcStatus, role, prcNumber) !== 'verified') {
      return `Account is active. PRC status: ${getPrcStatusLabel(prcStatus, role, prcNumber)}.`
    }

    return null
  }

  if (status === 'under_review') {
    return 'Reviewed and waiting for final franchise approval.'
  }

  if (status === ACCOUNT_STATUS_CORRECTION_REQUIRED) {
    return 'Needs corrections before it can move forward.'
  }

  if (status === ACCOUNT_STATUS_PENDING_APPROVAL) {
    return 'Still missing final approval.'
  }

  if (status === ACCOUNT_STATUS_REJECTED) {
    return 'This application was rejected by the franchise owner and is no longer in onboarding.'
  }

  return 'Account onboarding is still in progress.'
}

/**
 * Fetches all members of the franchise company
 */
export async function fetchFranchiseMembers() {
  const user = await getCurrentDashboardUser()
  if (!user || !['franchise', 'franchise_secretary'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const admin = createAdminSupabaseClient()
  const membership =
    user.role === 'franchise_secretary'
      ? await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
          allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
        })
      : await getPreferredCompanyMembershipForProfile(admin, user.profileId)

  if (!membership?.companyId) return []

  const secretaryScope = await getSecretaryCompanyScopeForMembership(admin, membership)
  const officeScopeIds = secretaryScope.scopeCompanyIds

  const { data: offices, error: officesError } = await admin
    .from('company_profiles')
    .select('id, company_name, parent_company_id')
    .in('id', officeScopeIds)
    .returns<Array<{ company_name: string | null; id: number; parent_company_id: number | null }>>()

  if (officesError) {
    throw new Error(officesError.message)
  }

  const officeMap = new Map((offices ?? []).map((office) => [office.id, office]))

  // Fetch all members with their profiles
  const { data: members, error } = await admin
    .from('company_members')
    .select(`
      id,
      company_id,
      system_role,
      user_profile_id,
      user_profiles (
        id,
        fname,
        lname,
        full_name,
        role,
        prc_number,
        prc_status,
        account_status,
        is_active,
        referred_by,
        reviewed_by,
        created_at,
        rejection_reason,
        reviewed_at
      )
    `)
    .in('company_id', officeScopeIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const uniqueMembers = [...(members ?? [])]
    .sort((left: any, right: any) => {
      const leftOffice = officeMap.get(left.company_id)
      const rightOffice = officeMap.get(right.company_id)
      const leftPriority = getCompanySystemRolePriority(left.system_role, Boolean(leftOffice?.parent_company_id))
      const rightPriority = getCompanySystemRolePriority(right.system_role, Boolean(rightOffice?.parent_company_id))

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      if (left.company_id !== right.company_id) {
        if (left.company_id === membership.companyId) return -1
        if (right.company_id === membership.companyId) return 1
        return left.company_id - right.company_id
      }

      return 0
    })
    .filter((member: any, index: number, entries: any[]) => {
      return index === entries.findIndex((entry) => entry.user_profile_id === member.user_profile_id)
    })

  const profileIds = [...new Set(uniqueMembers.map((member: any) => member.user_profile_id).filter(Boolean))]

  const reviewerUserIds = [
    ...new Set(
      uniqueMembers
        .map((member: any) => member.user_profiles?.reviewed_by)
        .filter((value: any): value is string => typeof value === 'string' && value.length > 0),
    ),
  ]
  const referredProfileIds = [
    ...new Set(
      uniqueMembers
        .map((member: any) => member.user_profiles?.referred_by)
        .filter((value: any): value is string => typeof value === 'string' && value.length > 0),
    ),
  ]

  const { data: invitations, error: invitationsError } = await admin
    .from('company_invitations')
    .select('company_id, email, invited_by, status, created_at')
    .in('company_id', officeScopeIds)
    .returns<Array<{ company_id: number; created_at: string | null; email: string; invited_by: string | null; status: string }>>()

  if (invitationsError) {
    throw new Error(invitationsError.message)
  }

  const inviterUserIds = [
    ...new Set((invitations ?? []).map((invitation) => invitation.invited_by).filter((value): value is string => typeof value === 'string' && value.length > 0)),
  ]

  const [contactsResult, reviewersResult, invitersResult, referrersResult] = await Promise.all([
    admin
      .from('contact_information')
      .select('user_profile_id, email, primary_mobile')
      .in('user_profile_id', profileIds),
    reviewerUserIds.length
      ? admin
          .from('user_profiles')
          .select('user_id, fname, lname, full_name')
          .in('user_id', reviewerUserIds)
          .returns<Array<{ fname: string | null; full_name: string | null; lname: string | null; user_id: string }>>()
      : Promise.resolve({ data: [], error: null }),
    inviterUserIds.length
      ? admin
          .from('user_profiles')
          .select('id, user_id, fname, lname, full_name, role')
          .in('user_id', inviterUserIds)
          .returns<Array<{ fname: string | null; full_name: string | null; id: string; lname: string | null; role: string | null; user_id: string }>>()
      : Promise.resolve({ data: [], error: null }),
    referredProfileIds.length
      ? admin
          .from('user_profiles')
          .select('id, fname, lname, full_name, role')
          .in('id', referredProfileIds)
          .returns<Array<{ fname: string | null; full_name: string | null; id: string; lname: string | null; role: string | null }>>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (contactsResult.error) {
    throw new Error(contactsResult.error.message)
  }

  if (reviewersResult.error) {
    throw new Error(reviewersResult.error.message)
  }

  if (invitersResult.error) {
    throw new Error(invitersResult.error.message)
  }

  if (referrersResult.error) {
    throw new Error(referrersResult.error.message)
  }

  const contactByProfileId = new Map(
    (contactsResult.data ?? []).map((contact: any) => [contact.user_profile_id, contact]),
  )
  const reviewerByUserId = new Map((reviewersResult.data ?? []).map((reviewer) => [reviewer.user_id, reviewer]))
  const inviterByUserId = new Map((invitersResult.data ?? []).map((inviter) => [inviter.user_id, inviter]))
  const referrerByProfileId = new Map((referrersResult.data ?? []).map((referrer) => [referrer.id, referrer]))
  const actorProfileIds = [
    ...new Set([
      ...(invitersResult.data ?? []).map((inviter) => inviter.id),
      ...(referrersResult.data ?? []).map((referrer) => referrer.id),
    ]),
  ]
  const actorMembershipsResult = actorProfileIds.length
    ? await admin
        .from('company_members')
        .select('company_id, system_role, user_profile_id')
        .in('user_profile_id', actorProfileIds)
        .in('company_id', officeScopeIds)
        .returns<Array<{ company_id: number; system_role: string | null; user_profile_id: string }>>()
    : { data: [], error: null }

  if (actorMembershipsResult.error) {
    throw new Error(actorMembershipsResult.error.message)
  }

  const actorMembershipsByProfileId = new Map<string, Array<{ company_id: number; system_role: string | null; user_profile_id: string }>>()
  for (const membershipRow of actorMembershipsResult.data ?? []) {
    const group = actorMembershipsByProfileId.get(membershipRow.user_profile_id) ?? []
    group.push(membershipRow)
    actorMembershipsByProfileId.set(membershipRow.user_profile_id, group)
  }

  const getHighestOrganizationRole = (
    memberships: Array<{ company_id: number; system_role: string | null; user_profile_id: string }> | undefined,
  ) => {
    const prioritized = [...(memberships ?? [])].sort((left, right) => {
      const leftOffice = officeMap.get(left.company_id)
      const rightOffice = officeMap.get(right.company_id)
      return (
        getCompanySystemRolePriority(left.system_role, Boolean(leftOffice?.parent_company_id)) -
        getCompanySystemRolePriority(right.system_role, Boolean(rightOffice?.parent_company_id))
      )
    })[0]

    if (!prioritized) {
      return null
    }

    const office = officeMap.get(prioritized.company_id)
    return office?.parent_company_id ? 'suboffice_secretary' : prioritized.system_role
  }

  const invitationByEmail = new Map<string, { company_id: number; created_at: string | null; email: string; invited_by: string | null; status: string }>()
  for (const invitation of invitations ?? []) {
    const key = invitation.email?.trim().toLowerCase()
    if (!key) continue
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
      const nextTime = invitation.created_at ? new Date(invitation.created_at).getTime() : 0
      if (nextTime > existingTime) {
        invitationByEmail.set(key, invitation)
      }
    }
  }

  return uniqueMembers.map((m: any) => {
    const profile = m.user_profiles ?? {}
    const contact = contactByProfileId.get(m.user_profile_id)
    const secretaryStatus = getSecretaryApplicationStatus(profile)
    const reviewer = reviewerByUserId.get(profile.reviewed_by)
    const office = officeMap.get(m.company_id)
    const normalizedEmail = contact?.email?.trim().toLowerCase() || ''
    const invitation = normalizedEmail ? invitationByEmail.get(normalizedEmail) ?? null : null
    const inviter = invitation?.invited_by ? inviterByUserId.get(invitation.invited_by) ?? null : null
    const inviterOrganizationRole = inviter
      ? getHighestOrganizationRole(actorMembershipsByProfileId.get(inviter.id))
      : null
    const referrer = profile.referred_by ? referrerByProfileId.get(profile.referred_by) ?? null : null
    const referrerOrganizationRole = referrer
      ? getHighestOrganizationRole(actorMembershipsByProfileId.get(referrer.id))
      : null

    return {
      approvedBy: buildReviewerName(reviewer),
      assignedSuboffice: office?.parent_company_id ? office.company_name?.trim() || 'Suboffice' : 'Main Office',
      id: m.id,
      profileId: m.user_profile_id,
      fullName: profile.full_name?.trim() || buildFullName(profile.fname, profile.lname) || 'Unnamed member',
      email: contact?.email?.trim() || 'No email on file',
      invitedBy: inviter
        ? buildActorLabel(inviter, inviterOrganizationRole)
        : referrer
          ? `${buildActorLabel(referrer, referrerOrganizationRole)} (Referral)`
          : 'Manual',
      phone: contact?.primary_mobile?.trim() || '',
      role: getCompanySystemRoleLabel(m.system_role, Boolean(office?.parent_company_id)),
      status: secretaryStatus,
      isActive: profile.is_active,
      joined: profile.created_at,
      officeName: office?.parent_company_id ? office.company_name?.trim() || 'Suboffice' : secretaryScope.companyName,
      isCurrentUser: m.user_profile_id === user.profileId,
      onboardingNote: getOnboardingNote(secretaryStatus, profile.is_active, profile.role, profile.prc_number, profile.prc_status),
    }
  })
}

/**
 * Updates a member's record (Feature 2)
 */
export async function updateMemberRecordAction(profileId: string, updates: { 
  fname?: string, 
  lname?: string, 
  phone?: string 
}) {
  const user = await getCurrentDashboardUser()
  if (!user || user.role !== 'franchise_secretary') {
    throw new Error('Only the Secretary can update member records.')
  }

  const admin = createAdminSupabaseClient()
  const secretaryMembership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
    allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
  })

  if (!secretaryMembership?.companyId) {
    throw new Error('Secretary is not linked to an office.')
  }

  const secretaryScope = await getSecretaryCompanyScopeForMembership(admin, secretaryMembership)

  const { data: scopedMembers, error: memberScopeError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .in('company_id', secretaryScope.scopeCompanyIds)
    .eq('user_profile_id', profileId)
    .limit(1)
    .returns<Array<{ user_profile_id: string }>>()

  if (memberScopeError) {
    throw new Error(memberScopeError.message)
  }

  if (!(scopedMembers ?? []).length) {
    throw new Error('You can only update members assigned to your secretary scope.')
  }

  const fullName = [updates.fname, updates.lname].filter(Boolean).join(' ')

  const { error } = await admin
    .from('user_profiles')
    .update({
      fname: updates.fname,
      lname: updates.lname,
      full_name: fullName || undefined,
    })
    .eq('id', profileId)

  if (error) throw new Error(error.message)

  const { data: existingContact, error: contactLookupError } = await admin
    .from('contact_information')
    .select('id')
    .eq('user_profile_id', profileId)
    .maybeSingle<{ id: number }>()

  if (contactLookupError) {
    throw new Error(contactLookupError.message)
  }

  if (existingContact?.id) {
    const { error: contactError } = await admin
      .from('contact_information')
      .update({ primary_mobile: updates.phone ?? null })
      .eq('id', existingContact.id)

    if (contactError) {
      throw new Error(contactError.message)
    }
  } else {
    const { error: insertContactError } = await admin
      .from('contact_information')
      .insert({
        user_profile_id: profileId,
        primary_mobile: updates.phone ?? null,
      })

    if (insertContactError) {
      throw new Error(insertContactError.message)
    }
  }

  revalidatePath('/dashboard/secretary/members')
  revalidatePath('/dashboard/secretary')
  return { success: true }
}
