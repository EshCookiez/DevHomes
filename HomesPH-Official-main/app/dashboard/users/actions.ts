'use server'

import {
  approveManagedUser,
  createManagedUser,
  deleteManagedUser,
  rejectManagedUser,
  rejectManagedUserPrc,
  resetManagedUserPassword,
  setManagedUserActive,
  updateManagedUser,
  updateManagedUserRole,
  verifyManagedUserPrc,
} from '@/lib/users-admin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { CreateManagedUserInput, ManagedUserProfileInput } from '@/lib/users-types'

// ─── Original user management actions ─────────────────────────────────────────

export async function createUserAction(input: CreateManagedUserInput) {
  try {
    const data = await createManagedUser(input)
    return { success: true, message: 'User created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create user.', data: null }
  }
}

export async function approveUserAction(profileId: string) {
  try {
    const data = await approveManagedUser(profileId)
    return { success: true, message: 'User approved successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to approve user.', data: null }
  }
}

export async function rejectUserAction(profileId: string, rejectionReason: string) {
  try {
    const data = await rejectManagedUser(profileId, rejectionReason)
    return { success: true, message: 'User rejected.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reject user.', data: null }
  }
}

export async function verifyUserPrcAction(profileId: string) {
  try {
    const data = await verifyManagedUserPrc(profileId)
    return { success: true, message: 'PRC verified.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to verify PRC.', data: null }
  }
}

export async function rejectUserPrcAction(profileId: string, rejectionReason: string) {
  try {
    const data = await rejectManagedUserPrc(profileId, rejectionReason)
    return { success: true, message: 'PRC rejected.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reject PRC.', data: null }
  }
}

export async function setUserStatusAction(profileId: string, isActive: boolean) {
  try {
    const data = await setManagedUserActive(profileId, isActive)
    return { success: true, message: isActive ? 'User activated.' : 'User deactivated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update status.', data: null }
  }
}

export async function updateUserAction(profileId: string, input: ManagedUserProfileInput) {
  try {
    const data = await updateManagedUser(profileId, input)
    return { success: true, message: 'User updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update user.', data: null }
  }
}

export async function updateUserRoleAction(profileId: string, role: string) {
  try {
    const data = await updateManagedUserRole(profileId, role)
    return { success: true, message: 'Role updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update role.', data: null }
  }
}

// Alias used by user-role-modal.tsx
export const changeUserRoleAction = updateUserRoleAction

export async function resetUserPasswordAction(userId: string, password: string) {
  try {
    await resetManagedUserPassword(userId, password)
    return { success: true, message: 'Password reset successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to reset password.' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await deleteManagedUser(userId)
    return { success: true, message: 'User deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete user.' }
  }
}

// ─── Document fetch (admin-privileged, bypasses RLS) ─────────────────────────

export async function getUserDocumentUrl(userProfileId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('user_documents')
    .select('file_url')
    .eq('user_profile_id', userProfileId)
    .eq('document_type', 'valid_id')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch user document:', error.message)
    return null
  }

  return (data as { file_url: string } | null)?.file_url ?? null
}
