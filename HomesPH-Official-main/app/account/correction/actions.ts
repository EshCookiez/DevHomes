'use server'

import {
  ACCOUNT_STATUS_PENDING_APPROVAL,
  normalizeAccountStatus,
} from '@/lib/account-status'
import {
  PRC_STATUS_NOT_SUBMITTED,
  PRC_STATUS_PENDING_VERIFICATION,
  isMissingPrcStateColumnError,
} from '@/lib/prc-status'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface CorrectionResubmissionInput {
  fname: string
  lname: string
  phone: string
  prcNumber?: string | null
  idUploadUrl?: string | null
}

interface CorrectionProfileRow {
  account_status: string | null
  id: string
  is_active: boolean | null
  rejection_reason: string | null
  role: string | null
}

function trimValue(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildFullName(fname: string, lname: string) {
  return [fname, lname].filter(Boolean).join(' ').trim()
}

function roleRequiresLicenseFields(role: string | null | undefined) {
  return role === 'franchise' || role === 'salesperson'
}

async function upsertContactInformation(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
  userProfileId: string,
  phone: string,
) {
  const { data: existingContact, error: contactLookupError } = await admin
    .from('contact_information')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ id: number }>()

  if (contactLookupError) {
    throw new Error(contactLookupError.message)
  }

  if (existingContact?.id) {
    const { error } = await admin
      .from('contact_information')
      .update({ primary_mobile: phone })
      .eq('id', existingContact.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('contact_information')
    .insert({
      email,
      primary_mobile: phone,
      user_profile_id: userProfileId,
    })

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertValidIdDocument(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userProfileId: string,
  idUploadUrl: string,
) {
  const fileName = idUploadUrl.split('/').pop() ?? 'valid-id'
  const { data: existingDocument, error: documentLookupError } = await admin
    .from('user_documents')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .eq('document_type', 'valid_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (documentLookupError) {
    throw new Error(documentLookupError.message)
  }

  if (existingDocument?.id) {
    const { error } = await admin
      .from('user_documents')
      .update({
        category: 'identity',
        file_name: fileName,
        file_url: idUploadUrl,
      })
      .eq('id', existingDocument.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('user_documents')
    .insert({
      user_profile_id: userProfileId,
      document_type: 'valid_id',
      category: 'identity',
      file_name: fileName,
      file_url: idUploadUrl,
    })

  if (error) {
    throw new Error(error.message)
  }
}

export async function resubmitAccountCorrectionAction(
  input: CorrectionResubmissionInput,
): Promise<{ success: boolean; message: string }> {
  const fname = trimValue(input.fname)
  const lname = trimValue(input.lname)
  const phone = trimValue(input.phone)

  if (!fname || !lname) {
    return { success: false, message: 'First name and last name are required.' }
  }

  if (!phone) {
    return { success: false, message: 'Phone number is required.' }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: 'Please sign in again to continue your correction resubmission.' }
  }

  const admin = createAdminSupabaseClient()
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, role, account_status, is_active, rejection_reason')
    .eq('user_id', user.id)
    .maybeSingle<CorrectionProfileRow>()

  if (profileError) {
    return { success: false, message: profileError.message }
  }

  if (!profile) {
    return { success: false, message: 'We could not find your registration record.' }
  }

  const normalizedStatus = normalizeAccountStatus(profile.account_status, profile.is_active)
  const hasActiveCorrection = normalizedStatus === ACCOUNT_STATUS_PENDING_APPROVAL && Boolean(profile.rejection_reason?.trim())

  if (!hasActiveCorrection) {
    return { success: false, message: 'There is no active correction request for this account.' }
  }

  const { data: existingDocument, error: documentLookupError } = await admin
    .from('user_documents')
    .select('file_url')
    .eq('user_profile_id', profile.id)
    .eq('document_type', 'valid_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ file_url: string | null }>()

  if (documentLookupError) {
    return { success: false, message: documentLookupError.message }
  }

  const nextIdUploadUrl = trimToNull(input.idUploadUrl)
  const currentIdUploadUrl = existingDocument?.file_url?.trim() || null

  if (roleRequiresLicenseFields(profile.role) && !nextIdUploadUrl && !currentIdUploadUrl) {
    return { success: false, message: 'Please upload a valid ID document before resubmitting.' }
  }

  const profileUpdatePayload: Record<string, string | null> = {
    fname,
    lname,
    full_name: buildFullName(fname, lname),
    account_status: ACCOUNT_STATUS_PENDING_APPROVAL,
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
  }

  if (roleRequiresLicenseFields(profile.role)) {
    profileUpdatePayload.prc_number = trimToNull(input.prcNumber)
    profileUpdatePayload.prc_status = profileUpdatePayload.prc_number
      ? PRC_STATUS_PENDING_VERIFICATION
      : PRC_STATUS_NOT_SUBMITTED
    profileUpdatePayload.prc_reviewed_at = null
    profileUpdatePayload.prc_reviewed_by = null
    profileUpdatePayload.prc_rejection_reason = null
  }

  const { error: updateProfileError } = await admin
    .from('user_profiles')
    .update(profileUpdatePayload)
    .eq('id', profile.id)

  if (updateProfileError) {
    if (isMissingPrcStateColumnError(updateProfileError)) {
      return { success: false, message: 'The PRC verification workflow fields are missing. Apply the latest schema update first.' }
    }

    return { success: false, message: updateProfileError.message }
  }

  try {
    await upsertContactInformation(admin, user.email ?? '', profile.id, phone)

    if (nextIdUploadUrl) {
      await upsertValidIdDocument(admin, profile.id, nextIdUploadUrl)
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to save your corrected details.',
    }
  }

  await supabase.auth.signOut()

  return {
    success: true,
    message: 'Your updated details were submitted and your application is back in the review queue.',
  }
}
