'use server'

import { revalidatePath } from 'next/cache'
import {
  ACCOUNT_STATUS_APPROVED,
  ACCOUNT_STATUS_MANUALLY_DISABLED,
} from '@/lib/account-status'
import {
  getCompanySystemRoleLabel,
  normalizeCompanySystemRole,
} from '@/lib/company-members'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getFranchiseDashboardSnapshot } from '../actions'

type FranchiseTeamMember = {
  approvedBy: string
  assignedBy: string
  assignedSuboffice: string
  canManagePlacement: boolean
  canRemove: boolean
  canToggleActive: boolean
  companyId: number
  email: string
  fullName: string
  id: string
  isActive: boolean
  isCurrentUser: boolean
  invitationType: string
  invitedBy: string
  joined: string | null
  officeName: string
  onboardingNote: string | null
  organizationRole: string
  phone: string
  profileId: string
  role: string
  status: string
  statusLabel: string
}

type FranchiseAssignableOffice = {
  id: number
  isParent: boolean
  label: string
  name: string
}

type FranchiseManagementContext = {
  admin: ReturnType<typeof createAdminSupabaseClient>
  assignableOffices: FranchiseAssignableOffice[]
  companyId: number
  scopeCompanyIds: number[]
  user: NonNullable<Awaited<ReturnType<typeof getCurrentDashboardUser>>>
}

type EditableFranchiseOrganizationRole = 'agent' | 'main_secretary' | 'suboffice_secretary'

type ScopeCompanyRow = {
  company_name: string | null
  created_at: string | null
  id: number
}

function getOwnerOnboardingNote(status: string) {
  if (status === ACCOUNT_STATUS_APPROVED) {
    return null
  }

  if (status === ACCOUNT_STATUS_MANUALLY_DISABLED) {
    return 'This member was manually deactivated by the franchise owner.'
  }

  if (status === 'under_review') {
    return 'Ready for your final approval.'
  }

  if (status === 'correction_required') {
    return 'Returned for correction before it can move forward.'
  }

  if (status === 'pending_approval') {
    return 'Still waiting for franchise review.'
  }

  if (status === 'rejected') {
    return 'This application was rejected and is kept for record history.'
  }

  return 'This member record still has onboarding activity in progress.'
}

function isEditableOrganizationRole(value: string | null | undefined): value is EditableFranchiseOrganizationRole {
  return ['agent', 'main_secretary', 'suboffice_secretary'].includes(value ?? '')
}

async function getFranchiseManagementContext(): Promise<FranchiseManagementContext> {
  const user = await getCurrentDashboardUser()

  if (!user || user.role !== 'franchise') {
    throw new Error('Only franchise owners can manage this team view.')
  }

  const admin = createAdminSupabaseClient()

  const ownedCompanyResult = await admin
    .from('company_profiles')
    .select('id, company_name, created_at')
    .eq('user_profile_id', user.profileId)
    .is('parent_company_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<ScopeCompanyRow>()

  if (ownedCompanyResult.error) {
    throw new Error(ownedCompanyResult.error.message)
  }

  let company = ownedCompanyResult.data ?? null

  if (!company) {
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
      throw new Error('Your franchise organization is not set up yet.')
    }

    const fallbackCompanyResult = await admin
      .from('company_profiles')
      .select('id, company_name, created_at')
      .eq('id', ownerMembershipResult.data.company_id)
      .is('parent_company_id', null)
      .maybeSingle<ScopeCompanyRow>()

    if (fallbackCompanyResult.error) {
      throw new Error(fallbackCompanyResult.error.message)
    }

    company = fallbackCompanyResult.data ?? null
  }

  if (!company) {
    throw new Error('Your franchise organization is not set up yet.')
  }

  const [subofficesResult, duplicateRootsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id, company_name, created_at')
      .eq('parent_company_id', company.id)
      .order('created_at', { ascending: false })
      .returns<ScopeCompanyRow[]>(),
    company.company_name?.trim()
      ? admin
          .from('company_profiles')
          .select('id')
          .eq('company_name', company.company_name.trim())
          .is('parent_company_id', null)
          .neq('id', company.id)
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

  const suboffices = subofficesResult.data ?? []
  const duplicateRootIds = (duplicateRootsResult.data ?? []).map((office) => office.id)

  return {
    admin,
    assignableOffices: [
      {
        id: company.id,
        isParent: true,
        label: `${company.company_name?.trim() || 'Main Office'} (Main Office)`,
        name: company.company_name?.trim() || 'Main Office',
      },
      ...suboffices.map((office) => ({
        id: office.id,
        isParent: false,
        label: office.company_name?.trim() || 'Unnamed Suboffice',
        name: office.company_name?.trim() || 'Unnamed Suboffice',
      })),
    ],
    companyId: company.id,
    scopeCompanyIds: [company.id, ...suboffices.map((office) => office.id), ...duplicateRootIds],
    user,
  }
}

function revalidateFranchiseMemberPages(profileId: string) {
  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/team')
  revalidatePath('/dashboard/franchise/suboffices')
  revalidatePath('/dashboard/franchise/settings')
  revalidatePath('/dashboard/franchise/applications')
  revalidatePath(`/dashboard/profile/${profileId}`)
}

export async function fetchFranchiseAssignableOffices(): Promise<FranchiseAssignableOffice[]> {
  const context = await getFranchiseManagementContext()
  return context.assignableOffices
}

export async function fetchFranchiseTeamMembers(): Promise<FranchiseTeamMember[]> {
  const user = await getCurrentDashboardUser()

  if (!user || user.role !== 'franchise') {
    throw new Error('Only franchise owners can manage this team view.')
  }

  const snapshot = await getFranchiseDashboardSnapshot()

  if (!snapshot.hasCompany) {
    return []
  }

  return snapshot.members.map((member) => {
    const canManageRecord = member.systemRole !== 'owner' && member.profileId !== user.profileId
    const canToggleActive = canManageRecord && [ACCOUNT_STATUS_APPROVED, ACCOUNT_STATUS_MANUALLY_DISABLED].includes(member.status)

    return {
      approvedBy: member.approvedBy,
      assignedBy: member.assignedBy,
      assignedSuboffice: member.assignedSuboffice,
      canManagePlacement: canManageRecord,
      canRemove: canManageRecord,
      canToggleActive,
      companyId: member.companyId,
      email: member.email || 'No email on file',
      fullName: member.fullName,
      id: `${member.companyId}-${member.profileId}`,
      isActive: member.status === ACCOUNT_STATUS_APPROVED,
      isCurrentUser: member.profileId === user.profileId,
      invitationType: member.invitationType,
      invitedBy: member.invitedBy,
      joined: member.joinedAt,
      officeName: member.workplace,
      onboardingNote: getOwnerOnboardingNote(member.status),
      organizationRole: member.systemRole,
      phone: member.phone,
      profileId: member.profileId,
      role: member.roleLabel,
      status: member.status,
      statusLabel: member.statusLabel,
    }
  })
}

export async function updateFranchiseMemberRecordAction(
  profileId: string,
  updates: {
    fname?: string
    lname?: string
    organizationRole?: string
    phone?: string
    targetCompanyId?: number
  },
) {
  const context = await getFranchiseManagementContext()
  const snapshot = await getFranchiseDashboardSnapshot()
  const scopedMember = snapshot.members.find((member) => member.profileId === profileId)

  if (!scopedMember) {
    throw new Error('You can only update members inside your franchise scope.')
  }

  if (scopedMember.systemRole === 'owner') {
    throw new Error('Franchise owner records cannot be reassigned from this member view.')
  }

  const admin = context.admin
  const fullName = [updates.fname?.trim(), updates.lname?.trim()].filter(Boolean).join(' ')

  const { error: profileError } = await admin
    .from('user_profiles')
    .update({
      fname: updates.fname?.trim() || null,
      lname: updates.lname?.trim() || null,
      full_name: fullName || null,
    })
    .eq('id', profileId)

  if (profileError) {
    throw new Error(profileError.message)
  }

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
      .update({ primary_mobile: updates.phone?.trim() || null })
      .eq('id', existingContact.id)

    if (contactError) {
      throw new Error(contactError.message)
    }
  } else {
    const { error: insertContactError } = await admin
      .from('contact_information')
      .insert({
        primary_mobile: updates.phone?.trim() || null,
        user_profile_id: profileId,
      })

    if (insertContactError) {
      throw new Error(insertContactError.message)
    }
  }

  const targetCompanyId = Number.isFinite(updates.targetCompanyId) ? Number(updates.targetCompanyId) : scopedMember.companyId
  const targetOffice = context.assignableOffices.find((office) => office.id === targetCompanyId)
  const requestedOrganizationRole = isEditableOrganizationRole(updates.organizationRole)
    ? updates.organizationRole
    : normalizeCompanySystemRole(scopedMember.systemRole)

  if (!targetOffice) {
    throw new Error('Choose a valid parent office or suboffice for this member.')
  }

  if (requestedOrganizationRole === 'main_secretary' && !targetOffice.isParent) {
    throw new Error('Main Secretary must stay under the main office. Choose the main office or keep this member as Agent.')
  }

  if (requestedOrganizationRole === 'suboffice_secretary' && targetOffice.isParent) {
    throw new Error('Suboffice Secretary must be assigned to a suboffice. Choose a branch office first.')
  }

  const { error: deleteMembershipError } = await admin
    .from('company_members')
    .delete()
    .in('company_id', context.scopeCompanyIds)
    .eq('user_profile_id', profileId)

  if (deleteMembershipError) {
    throw new Error(deleteMembershipError.message)
  }

  if (requestedOrganizationRole === 'main_secretary') {
    const { error: demoteMainSecretaryError } = await admin
      .from('company_members')
      .update({ system_role: 'agent' })
      .eq('company_id', targetCompanyId)
      .in('system_role', ['main_secretary', 'secretary'])

    if (demoteMainSecretaryError) {
      throw new Error(demoteMainSecretaryError.message)
    }
  }

  if (requestedOrganizationRole === 'suboffice_secretary') {
    const { error: demoteBranchSecretaryError } = await admin
      .from('company_members')
      .update({ system_role: 'agent' })
      .eq('company_id', targetCompanyId)
      .in('system_role', ['suboffice_secretary', 'secretary'])

    if (demoteBranchSecretaryError) {
      throw new Error(demoteBranchSecretaryError.message)
    }
  }

  const { error: insertMembershipError } = await admin
    .from('company_members')
    .insert({
      company_id: targetCompanyId,
      system_role: requestedOrganizationRole,
      user_profile_id: profileId,
    })

  if (insertMembershipError) {
    throw new Error(insertMembershipError.message)
  }

  revalidateFranchiseMemberPages(profileId)

  const movedBetweenOffices = targetCompanyId !== scopedMember.companyId

  return {
    message: movedBetweenOffices
      ? `Member updated as ${getCompanySystemRoleLabel(requestedOrganizationRole, !targetOffice.isParent)} and placed under ${targetOffice.name}.`
      : `Member record updated as ${getCompanySystemRoleLabel(requestedOrganizationRole, !targetOffice.isParent)}.`,
    success: true,
  }
}

export async function setFranchiseMemberActiveAction(profileId: string, shouldBeActive: boolean) {
  const context = await getFranchiseManagementContext()
  const snapshot = await getFranchiseDashboardSnapshot()
  const scopedMember = snapshot.members.find((member) => member.profileId === profileId)

  if (!scopedMember) {
    throw new Error('You can only manage members inside your franchise scope.')
  }

  if (scopedMember.systemRole === 'owner' || scopedMember.profileId === context.user.profileId) {
    throw new Error('You cannot deactivate or reactivate the owner record from this page.')
  }

  if (![ACCOUNT_STATUS_APPROVED, ACCOUNT_STATUS_MANUALLY_DISABLED].includes(scopedMember.status)) {
    throw new Error('Only approved or disabled members can be activated or deactivated here.')
  }

  const { error } = await context.admin
    .from('user_profiles')
    .update({
      account_status: shouldBeActive ? ACCOUNT_STATUS_APPROVED : ACCOUNT_STATUS_MANUALLY_DISABLED,
      is_active: shouldBeActive,
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.user.userId,
    })
    .eq('id', profileId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateFranchiseMemberPages(profileId)

  return {
    message: shouldBeActive ? 'Member reactivated.' : 'Member deactivated.',
    success: true,
  }
}

export async function removeFranchiseMemberAction(profileId: string) {
  const context = await getFranchiseManagementContext()
  const snapshot = await getFranchiseDashboardSnapshot()
  const scopedMember = snapshot.members.find((member) => member.profileId === profileId)

  if (!scopedMember) {
    throw new Error('You can only remove members inside your franchise scope.')
  }

  if (scopedMember.systemRole === 'owner' || scopedMember.profileId === context.user.profileId) {
    throw new Error('You cannot remove the owner record from the franchise.')
  }

  const { error: deleteMembershipError } = await context.admin
    .from('company_members')
    .delete()
    .in('company_id', context.scopeCompanyIds)
    .eq('user_profile_id', profileId)

  if (deleteMembershipError) {
    throw new Error(deleteMembershipError.message)
  }

  const { data: remainingMembership, error: remainingMembershipError } = await context.admin
    .from('company_members')
    .select('id')
    .eq('user_profile_id', profileId)
    .limit(1)
    .maybeSingle<{ id: number }>()

  if (remainingMembershipError) {
    throw new Error(remainingMembershipError.message)
  }

  if (!remainingMembership?.id && [ACCOUNT_STATUS_APPROVED, ACCOUNT_STATUS_MANUALLY_DISABLED].includes(scopedMember.status)) {
    const { error: deactivateError } = await context.admin
      .from('user_profiles')
      .update({
        account_status: ACCOUNT_STATUS_MANUALLY_DISABLED,
        is_active: false,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.user.userId,
      })
      .eq('id', profileId)

    if (deactivateError) {
      throw new Error(deactivateError.message)
    }
  }

  revalidateFranchiseMemberPages(profileId)

  return {
    message: 'Member removed from your franchise scope.',
    success: true,
  }
}
