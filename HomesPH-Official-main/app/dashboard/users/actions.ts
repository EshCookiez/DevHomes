'use server'

import { revalidatePath } from 'next/cache'
import { sendAccountReviewNotification } from '@/lib/email/account-review-notifications'
import {
  approveManagedUser,
  createManagedUser,
  deleteManagedUser,
  rejectManagedUser,
  resetManagedUserPassword,
  setManagedUserActive,
  updateManagedUser,
  updateManagedUserRole,
} from '@/lib/users-admin'
import type { CreateManagedUserInput, ManagedUserProfileInput, ManagedUserRecord } from '@/lib/users-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateUsersSurface() {
  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/developers')
}

function appendNotificationWarning(message: string, warning?: string) {
  return warning ? `${message} ${warning}` : message
}

export async function createUserAction(input: CreateManagedUserInput): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await createManagedUser(input)
    revalidateUsersSurface()
    return { success: true, message: 'User created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create user.' }
  }
}

export async function updateUserAction(profileId: string, input: ManagedUserProfileInput): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await updateManagedUser(profileId, input)
    revalidateUsersSurface()
    return { success: true, message: 'User updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update user.' }
  }
}

export async function changeUserRoleAction(profileId: string, role: string): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await updateManagedUserRole(profileId, role)
    revalidateUsersSurface()
    return { success: true, message: 'Role updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update role.' }
  }
}

export async function setUserStatusAction(profileId: string, isActive: boolean): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await setManagedUserActive(profileId, isActive)
    revalidateUsersSurface()
    return { success: true, message: isActive ? 'User activated.' : 'User deactivated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update user status.' }
  }
}

export async function approveUserAction(profileId: string): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await approveManagedUser(profileId)
    const notification = await sendAccountReviewNotification({
      email: data.email,
      fullName: data.full_name ?? data.email,
      decision: 'approved',
    })

    revalidateUsersSurface()
    return {
      success: true,
      message: appendNotificationWarning('User approved.', notification.sent ? undefined : notification.message),
      data,
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to approve user.' }
  }
}

export async function rejectUserAction(profileId: string, rejectionReason: string): Promise<ActionResult<ManagedUserRecord>> {
  try {
    const data = await rejectManagedUser(profileId, rejectionReason)
    const notification = await sendAccountReviewNotification({
      email: data.email,
      fullName: data.full_name ?? data.email,
      decision: 'rejected',
      rejectionReason,
    })

    revalidateUsersSurface()
    return {
      success: true,
      message: appendNotificationWarning('User rejected.', notification.sent ? undefined : notification.message),
      data,
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to reject user.' }
  }
}

export async function resetUserPasswordAction(userId: string, password: string): Promise<ActionResult> {
  try {
    await resetManagedUserPassword(userId, password)
    return { success: true, message: 'Password reset successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to reset password.' }
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult<{ userId: string }>> {
  try {
    await deleteManagedUser(userId)
    revalidateUsersSurface()
    return { success: true, message: 'User deleted successfully.', data: { userId } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete user.' }
  }
}