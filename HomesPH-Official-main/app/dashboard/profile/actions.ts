'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  removeAddress,
  saveAddress,
  sendPasswordReset,
  uploadProfileImage,
  updateBasicProfile,
  updatePassword,
  updatePersonalProfile,
  upsertContactInformation,
} from '@/lib/profile'
import type { AddressInput, AddressRecord, ContactInput } from '@/lib/profile-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateProfileSurfaces() {
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
}

export async function saveBasicProfileAction(input: { fname: string; mname: string; lname: string }): Promise<ActionResult> {
  try {
    await updateBasicProfile(input)
    revalidateProfileSurfaces()
    return { success: true, message: 'Basic information updated successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update basic information.' }
  }
}

export async function savePersonalProfileAction(input: { gender: string; birthday: string | null }): Promise<ActionResult> {
  try {
    await updatePersonalProfile(input)
    revalidateProfileSurfaces()
    return { success: true, message: 'Personal details updated successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update personal details.' }
  }
}

export async function saveContactInformationAction(input: ContactInput): Promise<ActionResult> {
  try {
    await upsertContactInformation(input)
    revalidateProfileSurfaces()
    return { success: true, message: 'Contact information updated successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update contact information.' }
  }
}

export async function saveAddressAction(id: number | null, input: AddressInput): Promise<ActionResult<AddressRecord>> {
  try {
    const data = await saveAddress(id, input)
    revalidateProfileSurfaces()
    return { success: true, message: id ? 'Address updated successfully.' : 'Address added successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save address.' }
  }
}

export async function deleteAddressAction(id: number): Promise<ActionResult> {
  try {
    await removeAddress(id)
    revalidateProfileSurfaces()
    return { success: true, message: 'Address deleted successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete address.' }
  }
}

export async function uploadProfileImageAction(formData: FormData): Promise<ActionResult<{ profileImageUrl: string }>> {
  try {
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose an image to upload.')
    }

    const data = await uploadProfileImage(file)
    revalidateProfileSurfaces()
    return { success: true, message: 'Image uploaded successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update profile image.' }
  }
}

export async function changePasswordAction(password: string): Promise<ActionResult> {
  try {
    await updatePassword(password)
    return { success: true, message: 'Password changed successfully.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to change password.' }
  }
}

export async function sendResetPasswordAction(email: string): Promise<ActionResult> {
  try {
    await sendPasswordReset(email)
    return { success: true, message: 'Password reset email sent.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to send reset email.' }
  }
}

export async function skipProfileCompletionAction() {
  const cookieStore = await cookies()
  const supabase = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unable to load the current account.')
  }

  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      profile_completion_skipped: true,
    },
  })

  if (metadataError) {
    throw new Error(metadataError.message)
  }

  cookieStore.set('profile-completion-skip', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  revalidateProfileSurfaces()
  redirect('/dashboard')
}
