'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getPreferredCompanyMembershipForProfile } from '@/lib/company-members'
import { uploadPublicFile } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

function normalizeDocumentCategory(documentType: string) {
  if (documentType === 'valid_id') return 'identity'
  if (documentType === 'license') return 'license'
  return 'requirements'
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

async function getSecretaryDocumentScope() {
  const user = await getCurrentDashboardUser()
  if (!user || user.role !== 'franchise_secretary') {
    throw new Error('Only the Secretary can manage documents.')
  }

  const admin = createAdminSupabaseClient()
  const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
    allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
  })

  if (!membership?.companyId) {
    throw new Error('Secretary is not linked to an office.')
  }

  return {
    admin,
    companyId: membership.companyId,
    user,
  }
}

/**
 * Fetches all documents for members of the franchise company
 */
export async function fetchFranchiseDocuments() {
  const { admin, companyId } = await getSecretaryDocumentScope()

  // Get all profile IDs in this company
  const { data: members, error: membersError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .eq('company_id', companyId)

  if (membersError) {
    throw new Error(membersError.message)
  }

  const profileIds = members?.map((m: any) => m.user_profile_id) || []
  if (!profileIds.length) {
    return []
  }

  // Fetch documents for these profiles
  const { data: docs, error } = await admin
    .from('user_documents')
    .select(`
      id,
      user_profile_id,
      document_type,
      category,
      file_name,
      file_url,
      created_at
    `)
    .in('user_profile_id', profileIds)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const { data: profiles, error: profilesError } = await admin
    .from('user_profiles')
    .select('id, full_name, fname, lname')
    .in('id', profileIds)

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileNameMap = new Map(
    (profiles ?? []).map((profile: any) => [
      profile.id,
      profile.full_name?.trim() || [profile.fname, profile.lname].filter(Boolean).join(' ').trim() || 'Unknown Member',
    ]),
  )

  return (docs ?? []).map((d: any) => ({
    id: d.id,
    ownerProfileId: d.user_profile_id,
    type: d.document_type,
    category: d.category,
    name: d.file_name,
    url: d.file_url,
    uploadedAt: d.created_at,
    owner: profileNameMap.get(d.user_profile_id) || 'Unknown Member'
  }))
}

export async function uploadSecretaryDocumentAction(formData: FormData) {
  const { admin, companyId } = await getSecretaryDocumentScope()
  const userProfileId = String(formData.get('userProfileId') ?? '').trim()
  const documentType = String(formData.get('documentType') ?? '').trim()
  const file = formData.get('file')

  if (!userProfileId) {
    throw new Error('Select a member before uploading a document.')
  }

  if (!documentType) {
    throw new Error('Select a document type.')
  }

  if (!(file instanceof File) || !file.size) {
    throw new Error('Choose a file to upload.')
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Document must be 15MB or smaller.')
  }

  const { data: scopedMember, error: scopeError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .eq('company_id', companyId)
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ user_profile_id: string }>()

  if (scopeError) {
    throw new Error(scopeError.message)
  }

  if (!scopedMember) {
    throw new Error('You can only upload documents for members assigned to your office.')
  }

  const safeFileName = sanitizeFileName(file.name || `${documentType}-document`)
  const uploadPath = `secretary-documents/${userProfileId}/${Date.now()}-${safeFileName}`
  const fileUrl = await uploadPublicFile({
    file,
    path: uploadPath,
    cacheControl: '3600',
    upsert: false,
  })

  const { error: insertError } = await admin
    .from('user_documents')
    .insert({
      user_profile_id: userProfileId,
      document_type: documentType,
      category: normalizeDocumentCategory(documentType),
      file_name: safeFileName,
      file_url: fileUrl,
    })

  if (insertError) {
    throw new Error(insertError.message)
  }

  revalidatePath('/dashboard/secretary/documents')
  revalidatePath(`/dashboard/profile/${userProfileId}`)

  return {
    success: true,
    message: 'Document uploaded successfully.',
  }
}

/**
 * Deletes a document record (and potentially the file)
 */
export async function deleteDocumentAction(docId: string) {
  const { admin } = await getSecretaryDocumentScope()
  const { error } = await admin.from('user_documents').delete().eq('id', docId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/secretary/documents')
  return { success: true }
}
