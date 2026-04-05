import 'server-only'

import {
  ACCOUNT_STATUS_APPROVED,
  ACCOUNT_STATUS_MANUALLY_DISABLED,
  ACCOUNT_STATUS_REJECTED,
  isMissingAccountStateColumnError,
  roleUsesTeamOwnerApproval,
  withNormalizedAccountState,
} from '@/lib/account-status'
import {
  getApplicationAuditEmail,
  isMissingApplicationArchiveColumnError,
  withApplicationArchiveState,
} from '@/lib/application-archive'
import {
  isMissingPrcStateColumnError,
  withNormalizedPrcState,
  PRC_STATUS_PENDING_VERIFICATION,
  PRC_STATUS_REJECTED,
  PRC_STATUS_VERIFIED,
} from '@/lib/prc-status'
import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type {
  CreateManagedUserInput,
  ManagedUserProfileInput,
  ManagedUserRecord,
  UserRoleRecord,
} from '@/lib/users-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])

interface UserProfileAdminRow {
  id: string
  user_id: string
  fname: string | null
  mname: string | null
  lname: string | null
  full_name: string | null
  gender: string | null
  birthday: string | null
  profile_image_url: string | null
  prc_number: string | null
  prc_status: string | null
  prc_reviewed_at: string | null
  prc_reviewed_by: string | null
  prc_rejection_reason: string | null
  role: string | null
  is_active: boolean | null
  account_status: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  application_archived_at: string | null
  application_archive_reason: string | null
  archived_company_id: number | null
  archived_contact_email: string | null
  created_at: string | null
  updated_at: string | null
}

function normalizeString(value: string) {
  return value.trim()
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildFullName(fname: string, lname: string) {
  return [fname.trim(), lname.trim()].filter(Boolean).join(' ').trim() || null
}

function normalizeManagedUserRow<T extends UserProfileAdminRow>(profile: T) {
  return withNormalizedPrcState(withApplicationArchiveState(withNormalizedAccountState(profile)))
}

function isMissingDeveloperActiveColumn(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return message.includes('is_active') && (message.includes('column') || message.includes('schema cache'))
}

function sanitizeProfileInput(input: ManagedUserProfileInput) {
  const fname = normalizeString(input.fname)
  const lname = normalizeString(input.lname)

  if (!fname || !lname) {
    throw new Error('First name and last name are required.')
  }

  if (!input.role.trim()) {
    throw new Error('Role is required.')
  }

  return {
    fname,
    mname: trimToNull(input.mname),
    lname,
    full_name: buildFullName(fname, lname),
    gender: trimToNull(input.gender),
    birthday: trimToNull(input.birthday),
    role: normalizeString(input.role),
  }
}

async function getAuthUsersMap() {
  const admin = createAdminSupabaseClient()
  const authUsers = new Map<string, { email: string; created_at: string | null; last_sign_in_at: string | null }>()

  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    for (const user of data.users) {
      authUsers.set(user.id, {
        email: user.email ?? '',
        created_at: user.created_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
      })
    }

    if (data.users.length < perPage) {
      break
    }

    page += 1
  }

  return authUsers
}

async function getManagedUserProfiles(admin: ReturnType<typeof createAdminSupabaseClient>) {
  const primary = await admin
    .from('user_profiles')
    .select('id,user_id,fname,mname,lname,full_name,gender,birthday,profile_image_url,prc_number,prc_status,prc_reviewed_at,prc_reviewed_by,prc_rejection_reason,role,is_active,account_status,reviewed_at,reviewed_by,rejection_reason,application_archived_at,application_archive_reason,archived_company_id,archived_contact_email,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (
    !isMissingAccountStateColumnError(primary.error)
    && !isMissingPrcStateColumnError(primary.error)
    && !isMissingApplicationArchiveColumnError(primary.error)
  ) {
    return primary
  }

  const fallbackWithAccountState = await admin
    .from('user_profiles')
    .select('id,user_id,fname,mname,lname,full_name,gender,birthday,profile_image_url,prc_number,role,is_active,account_status,reviewed_at,reviewed_by,rejection_reason,application_archived_at,application_archive_reason,archived_company_id,archived_contact_email,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (
    !isMissingAccountStateColumnError(fallbackWithAccountState.error)
    && !isMissingApplicationArchiveColumnError(fallbackWithAccountState.error)
  ) {
    return {
      data: (fallbackWithAccountState.data ?? []).map((profile) => normalizeManagedUserRow(profile as UserProfileAdminRow)),
      error: fallbackWithAccountState.error,
    }
  }

  const fallback = await admin
    .from('user_profiles')
    .select('id,user_id,fname,mname,lname,full_name,gender,birthday,profile_image_url,prc_number,role,is_active,created_at,updated_at')
    .order('created_at', { ascending: false })

  return {
    data: (fallback.data ?? []).map((profile) => normalizeManagedUserRow(profile as UserProfileAdminRow)),
    error: fallback.error,
  }
}

async function syncLinkedDeveloperProfile(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userProfileId: string,
  isActive: boolean,
) {
  const { error } = await admin
    .from('developers_profiles')
    .update({ is_active: isActive })
    .eq('user_profile_id', userProfileId)

  if (!error) {
    return
  }

  if (isMissingDeveloperActiveColumn(error)) {
    throw new Error('developers_profiles.is_active is required to keep developer registrations in sync. Apply the latest schema update first.')
  }

  throw new Error(error.message)
}

async function updateManagedUserAccountState(
  profileId: string,
  payload: {
    is_active: boolean
    account_status: string
    reviewed_at: string | null
    reviewed_by: string | null
    rejection_reason: string | null
  },
  options?: {
    allowLegacyFallback?: boolean
  },
) {
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('user_profiles')
    .update(payload)
    .eq('id', profileId)

  if (error) {
    if (isMissingAccountStateColumnError(error)) {
      if (options?.allowLegacyFallback) {
        const legacyResult = await admin
          .from('user_profiles')
          .update({ is_active: payload.is_active })
          .eq('id', profileId)

        if (legacyResult.error) {
          throw new Error(legacyResult.error.message)
        }

        await syncLinkedDeveloperProfile(admin, profileId, payload.is_active)
        return await getManagedUserByProfileId(profileId)
      }

      throw new Error('user_profiles.account_status and review fields are required for the approval workflow. Apply the latest schema update first.')
    }

    throw new Error(error.message)
  }

  await syncLinkedDeveloperProfile(admin, profileId, payload.is_active)
  return await getManagedUserByProfileId(profileId)
}

async function updateManagedUserPrcState(
  profileId: string,
  payload: {
    prc_rejection_reason: string | null
    prc_reviewed_at: string | null
    prc_reviewed_by: string | null
    prc_status: string
  },
) {
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('user_profiles')
    .update(payload)
    .eq('id', profileId)

  if (error) {
    if (isMissingPrcStateColumnError(error)) {
      throw new Error('user_profiles.prc_status and PRC review fields are required. Apply the latest PRC verification schema update first.')
    }

    throw new Error(error.message)
  }

  return await getManagedUserByProfileId(profileId)
}

async function assertPlatformCanManageAccountApproval(profileId: string) {
  const admin = createAdminSupabaseClient()
  const { data: profile, error } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', profileId)
    .maybeSingle<{ role: string | null }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!profile) {
    throw new Error('User profile not found.')
  }

  if (roleUsesTeamOwnerApproval(profile.role)) {
    throw new Error('This account is approved by the franchise team workflow, not by platform admin.')
  }
}

async function deleteManagedUserProfileArtifacts(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  profileId: string,
) {
  const childDeletes = await Promise.all([
    admin.from('user_documents').delete().eq('user_profile_id', profileId),
    admin.from('addresses').delete().eq('user_profile_id', profileId),
    admin.from('company_members').delete().eq('user_profile_id', profileId),
    admin.from('contact_information').delete().eq('user_profile_id', profileId),
    admin.from('developers_profiles').delete().eq('user_profile_id', profileId),
  ])

  const childDeleteError = childDeletes.find((result) => result.error)?.error

  if (childDeleteError) {
    throw new Error(childDeleteError.message)
  }

  const { error: profileDeleteError } = await admin
    .from('user_profiles')
    .delete()
    .eq('id', profileId)

  if (profileDeleteError) {
    throw new Error(profileDeleteError.message)
  }
}

export async function requireUsersAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getUserRoles(): Promise<UserRoleRecord[]> {
  await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('user_roles')
    .select('id,role_name,description')
    .order('role_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as UserRoleRecord[]
}

export async function getManagedUsers(): Promise<ManagedUserRecord[]> {
  await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const [authUsers, profilesResult] = await Promise.all([
    getAuthUsersMap(),
    getManagedUserProfiles(admin),
  ])

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  return ((profilesResult.data ?? []) as UserProfileAdminRow[]).map((profile) => {
    const normalizedProfile = normalizeManagedUserRow(profile)
    const authUser = authUsers.get(profile.user_id)
    const auditEmail = getApplicationAuditEmail(authUser?.email ?? '', normalizedProfile.archived_contact_email)
    const fullName = normalizedProfile.full_name?.trim()
      || [normalizedProfile.fname, normalizedProfile.lname].filter(Boolean).join(' ').trim()
      || auditEmail
      || 'Unnamed User'

    return {
      ...normalizedProfile,
      full_name: fullName,
      email: auditEmail,
      auth_created_at: authUser?.created_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    }
  })
}

export async function createManagedUser(input: CreateManagedUserInput) {
  const currentUser = await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const email = normalizeString(input.email).toLowerCase()
  const password = input.password

  if (!email) {
    throw new Error('Email is required.')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const profilePayload = sanitizeProfileInput(input)
  const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: profilePayload.fname,
      last_name: profilePayload.lname,
    },
  })

  if (authError || !createdUser.user) {
    throw new Error(authError?.message ?? 'Unable to create user account.')
  }

  const { data: existingProfile } = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_id', createdUser.user.id)
    .maybeSingle<{ id: string }>()

  const { error: profileError } = await admin
    .from('user_profiles')
    .upsert({
      id: existingProfile?.id,
      user_id: createdUser.user.id,
      ...profilePayload,
      is_active: true,
      account_status: ACCOUNT_STATUS_APPROVED,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUser.userId,
      rejection_reason: null,
    }, { onConflict: 'user_id' })

  if (profileError) {
    if (isMissingAccountStateColumnError(profileError)) {
      const legacyProfileResult = await admin
        .from('user_profiles')
        .upsert({
          id: existingProfile?.id,
          user_id: createdUser.user.id,
          ...profilePayload,
          is_active: true,
        }, { onConflict: 'user_id' })

      if (legacyProfileResult.error) {
        await admin.auth.admin.deleteUser(createdUser.user.id)
        throw new Error(legacyProfileResult.error.message)
      }

      return await getManagedUserByAuthId(createdUser.user.id)
    }

    await admin.auth.admin.deleteUser(createdUser.user.id)
    throw new Error(profileError.message)
  }

  return await getManagedUserByAuthId(createdUser.user.id)
}

export async function updateManagedUser(profileId: string, input: ManagedUserProfileInput) {
  await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const payload = sanitizeProfileInput(input)

  const { error } = await admin
    .from('user_profiles')
    .update(payload)
    .eq('id', profileId)

  if (error) {
    throw new Error(error.message)
  }

  return await getManagedUserByProfileId(profileId)
}

export async function updateManagedUserRole(profileId: string, role: string) {
  await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const normalizedRole = role.trim()

  if (!normalizedRole) {
    throw new Error('Role is required.')
  }

  const { error } = await admin
    .from('user_profiles')
    .update({ role: normalizedRole })
    .eq('id', profileId)

  if (error) {
    throw new Error(error.message)
  }

  return await getManagedUserByProfileId(profileId)
}

export async function setManagedUserActive(profileId: string, isActive: boolean) {
  const currentUser = await requireUsersAccess()

  return await updateManagedUserAccountState(profileId, {
    is_active: isActive,
    account_status: isActive ? ACCOUNT_STATUS_APPROVED : ACCOUNT_STATUS_MANUALLY_DISABLED,
    reviewed_at: new Date().toISOString(),
    reviewed_by: currentUser.userId,
    rejection_reason: null,
  }, { allowLegacyFallback: true })
}

export async function approveManagedUser(profileId: string) {
  const currentUser = await requireUsersAccess()
  await assertPlatformCanManageAccountApproval(profileId)

  return await updateManagedUserAccountState(profileId, {
    is_active: true,
    account_status: ACCOUNT_STATUS_APPROVED,
    reviewed_at: new Date().toISOString(),
    reviewed_by: currentUser.userId,
    rejection_reason: null,
  })
}

export async function rejectManagedUser(profileId: string, rejectionReason: string) {
  const currentUser = await requireUsersAccess()
  await assertPlatformCanManageAccountApproval(profileId)

  return await updateManagedUserAccountState(profileId, {
    is_active: false,
    account_status: ACCOUNT_STATUS_REJECTED,
    reviewed_at: new Date().toISOString(),
    reviewed_by: currentUser.userId,
    rejection_reason: trimToNull(rejectionReason),
  })
}

export async function verifyManagedUserPrc(profileId: string) {
  const currentUser = await requireUsersAccess()

  return await updateManagedUserPrcState(profileId, {
    prc_status: PRC_STATUS_VERIFIED,
    prc_reviewed_at: new Date().toISOString(),
    prc_reviewed_by: currentUser.userId,
    prc_rejection_reason: null,
  })
}

export async function rejectManagedUserPrc(profileId: string, rejectionReason: string) {
  const currentUser = await requireUsersAccess()

  return await updateManagedUserPrcState(profileId, {
    prc_status: PRC_STATUS_REJECTED,
    prc_reviewed_at: new Date().toISOString(),
    prc_reviewed_by: currentUser.userId,
    prc_rejection_reason: trimToNull(rejectionReason),
  })
}

export async function resetManagedUserPassword(userId: string, password: string) {
  await requireUsersAccess()

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password })

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteManagedUser(userId: string) {
  await requireUsersAccess()

  const admin = createAdminSupabaseClient()
  const { data: profile, error: profileLookupError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle<{ id: string }>()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(error.message)
  }

  if (profile?.id) {
    await deleteManagedUserProfileArtifacts(admin, profile.id)
  }
}

async function getManagedUserByProfileId(profileId: string) {
  const users = await getManagedUsers()
  const user = users.find((entry) => entry.id === profileId)

  if (!user) {
    throw new Error('User not found.')
  }

  return user
}

async function getManagedUserByAuthId(userId: string) {
  const users = await getManagedUsers()
  const user = users.find((entry) => entry.user_id === userId)

  if (!user) {
    throw new Error('User not found.')
  }

  return user
}
