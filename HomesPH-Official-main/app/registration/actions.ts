'use server'

import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import {
  ACCOUNT_STATUS_PENDING_APPROVAL,
  isMissingAccountStateColumnError,
} from '@/lib/account-status'
import {
  PRC_STATUS_NOT_SUBMITTED,
  PRC_STATUS_PENDING_VERIFICATION,
  isMissingPrcStateColumnError,
  roleUsesPrcVerification,
} from '@/lib/prc-status'
import { mapRoleToCompanySystemRole } from '@/lib/company-members'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { uploadPublicFile, ensureImageFile } from '@/lib/storage'

export type RegistrationRole = 'developer' | 'salesperson' | 'ambassador' | 'franchise' | 'franchise_secretary'

interface BaseRegistrationInput {
  role: RegistrationRole
  fname: string
  lname: string
  email: string
  phone: string
  password: string
  affiliateCode?: string | null
  source?: string | null
  campaign?: string | null
  referralId?: string | null // For direct invites
  token?: string | null // For secure company invitations
}

interface SecretaryRegistrationInput extends BaseRegistrationInput {
  role: 'franchise_secretary'
}

interface FranchiseRegistrationInput extends BaseRegistrationInput {
  role: 'franchise'
  prcNumber?: string | null
  isCompanyLinked?: boolean
  companyName?: string | null
  officeStreet?: string | null
  officeCity?: string | null
  officeZip?: string | null
  idUploadUrl?: string | null
}

interface SalespersonRegistrationInput extends BaseRegistrationInput {
  role: 'salesperson'
  prcNumber?: string | null
  isCompanyLinked?: boolean
  companyName?: string | null
  officeStreet?: string | null
  officeCity?: string | null
  officeZip?: string | null
  idUploadUrl?: string | null
}

interface DeveloperRegistrationInput extends BaseRegistrationInput {
  role: 'developer'
  companyName: string
}

interface AmbassadorRegistrationInput extends BaseRegistrationInput {
  role: 'ambassador'
}

export type RegisterAccountInput = 
  | DeveloperRegistrationInput 
  | AmbassadorRegistrationInput 
  | FranchiseRegistrationInput
  | SalespersonRegistrationInput
  | SecretaryRegistrationInput

export interface RegisterAccountResult {
  success: boolean
  message: string
  email?: string
}

interface InvitationContext {
  companyId: number
  email: string
  id: string
  invitedRole: RegistrationRole
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

function getInitialPrcStatus(role: string, prcNumber: string | null) {
  if (!roleUsesPrcVerification(role)) {
    return PRC_STATUS_NOT_SUBMITTED
  }

  return prcNumber ? PRC_STATUS_PENDING_VERIFICATION : PRC_STATUS_NOT_SUBMITTED
}

async function deleteRegistrationProfileArtifacts(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  authUserId: string,
) {
  const { data: profile, error: profileLookupError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle<{ id: string }>()

  if (profileLookupError) {
    throw new Error(profileLookupError.message)
  }

  if (!profile?.id) {
    return
  }

  const childDeletes = await Promise.all([
    admin.from('user_documents').delete().eq('user_profile_id', profile.id),
    admin.from('addresses').delete().eq('user_profile_id', profile.id),
    admin.from('company_members').delete().eq('user_profile_id', profile.id),
    admin.from('contact_information').delete().eq('user_profile_id', profile.id),
    admin.from('developers_profiles').delete().eq('user_profile_id', profile.id),
  ])

  const childDeleteError = childDeletes.find((result) => result.error)?.error

  if (childDeleteError) {
    throw new Error(childDeleteError.message)
  }

  const { error: profileDeleteError } = await admin
    .from('user_profiles')
    .delete()
    .eq('id', profile.id)

  if (profileDeleteError) {
    throw new Error(profileDeleteError.message)
  }
}

function explainInvitationSessionError(message: string | undefined) {
  const normalizedMessage = message?.trim()
  const loweredMessage = normalizedMessage?.toLowerCase() ?? ''

  if (loweredMessage.includes('auth session missing')) {
    return 'Auth session missing means this page was opened without the active invitation login. Open the latest invitation email and complete registration in that same browser.'
  }

  return normalizedMessage || 'Unable to continue the invitation registration flow.'
}

function isRegistrationRole(value: string): value is RegistrationRole {
  return ['developer', 'salesperson', 'ambassador', 'franchise', 'franchise_secretary'].includes(value)
}

function normalizeRegistrationRole(role: RegistrationRole): Exclude<RegistrationRole, 'franchise_secretary'> | 'salesperson' {
  return role === 'franchise_secretary' ? 'salesperson' : role
}

async function resolveInvitationContext(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  token: string | null | undefined,
): Promise<InvitationContext | null> {
  const normalizedToken = trimValue(token)

  if (!normalizedToken) {
    return null
  }

  const { data, error } = await admin
    .from('company_invitations')
    .select('id, company_id, email, invited_role, status, expires_at')
    .eq('invitation_token', normalizedToken)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<{
      company_id: number
      email: string
      expires_at: string
      id: string
      invited_role: string
      status: string
    }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  if (!isRegistrationRole(data.invited_role)) {
    throw new Error('This invitation has an unsupported role.')
  }

  return {
    id: data.id,
    companyId: data.company_id,
    email: data.email.trim().toLowerCase(),
    invitedRole: data.invited_role,
  }
}

type ResolvedAuthUser = {
  authUser: User
  createdByRegistration: boolean
  usedInvitationSession: boolean
}

async function resolveRegistrationAuthUser(params: {
  email: string
  input: RegisterAccountInput
  metadata: Record<string, unknown>
  normalizedOrigin: string
  password: string
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
}): Promise<ResolvedAuthUser | RegisterAccountResult> {
  const { supabase, input, email, password, metadata, normalizedOrigin } = params
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  if (input.token) {
    if (!currentUser) {
      return {
        success: false,
        message: explainInvitationSessionError('Auth session missing'),
      }
    }

    const invitedEmail = currentUser.email?.trim().toLowerCase()

    if (!invitedEmail) {
      return { success: false, message: 'The invited account is missing an email address.' }
    }

    if (invitedEmail !== email) {
      return { success: false, message: 'Use the invited email address to complete registration.' }
    }

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: metadata,
    })

    if (error) {
      return { success: false, message: explainInvitationSessionError(error.message) }
    }

    return {
      authUser: data.user ?? currentUser,
      createdByRegistration: false,
      usedInvitationSession: true,
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${normalizedOrigin}/login?notice=approval-pending`,
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  const authUser = data.user

  if (!authUser) {
    return { success: false, message: 'Unable to create user account.' }
  }

  if (Array.isArray(authUser.identities) && authUser.identities.length === 0) {
    return {
      success: false,
      message: 'An account with this email already exists or is awaiting confirmation.',
    }
  }

  return {
    authUser,
    createdByRegistration: true,
    usedInvitationSession: false,
  }
}

async function upsertContactInformation(admin: ReturnType<typeof createAdminSupabaseClient>, userProfileId: string, email: string, phone: string) {
  const { data: existingContact, error: contactLookupError } = await admin
    .from('contact_information')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ id: number }>()

  if (contactLookupError) {
    throw new Error(contactLookupError.message)
  }

  const payload = {
    user_profile_id: userProfileId,
    email,
    primary_mobile: phone,
  }

  if (existingContact?.id) {
    const { error } = await admin
      .from('contact_information')
      .update(payload)
      .eq('id', existingContact.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('contact_information')
    .insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertDeveloperProfile(admin: ReturnType<typeof createAdminSupabaseClient>, userProfileId: string, developerName: string) {
  const { data: existingDeveloper, error: developerLookupError } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ id: number }>()

  if (developerLookupError) {
    throw new Error(developerLookupError.message)
  }

  const payload = {
    user_profile_id: userProfileId,
    developer_name: developerName,
    is_active: false,
  }

  if (existingDeveloper?.id) {
    const { error } = await admin
      .from('developers_profiles')
      .update(payload)
      .eq('id', existingDeveloper.id)

    if (error) {
      if (error.message?.toLowerCase().includes('is_active')) {
        throw new Error('developers_profiles.is_active is required for approval-based registration. Apply the latest schema update first.')
      }

      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('developers_profiles')
    .insert(payload)

  if (error) {
    if (error.message?.toLowerCase().includes('is_active')) {
      throw new Error('developers_profiles.is_active is required for approval-based registration. Apply the latest schema update first.')
    }

    throw new Error(error.message)
  }
}

async function markInvitationAccepted(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  invitation: InvitationContext,
) {
  const { error: retireAcceptedError } = await admin
    .from('company_invitations')
    .delete()
    .eq('company_id', invitation.companyId)
    .eq('email', invitation.email)
    .eq('status', 'accepted')
    .neq('id', invitation.id)

  if (retireAcceptedError) {
    throw new Error(retireAcceptedError.message)
  }

  const { error: invitationUpdateError } = await admin
    .from('company_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  if (invitationUpdateError) {
    throw new Error(invitationUpdateError.message)
  }
}

export async function registerAccountAction(input: RegisterAccountInput): Promise<RegisterAccountResult> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const normalizedOrigin = origin.replace(/\/$/, '')

  const fname = trimValue(input.fname)
  const lname = trimValue(input.lname)
  const email = trimValue(input.email).toLowerCase()
  const phone = trimValue(input.phone)
  const password = input.password

  if (!fname || !lname) {
    return { success: false, message: 'First name and last name are required.' }
  }

  if (!email) {
    return { success: false, message: 'Email is required.' }
  }

  if (!phone) {
    return { success: false, message: 'Phone number is required.' }
  }

  if (!password || password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' }
  }

  const supabase = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const invitation = await resolveInvitationContext(admin, input.token)
  const effectiveRole = normalizeRegistrationRole(invitation?.invitedRole ?? input.role)
  const fullName = buildFullName(fname, lname)
  const developerCompanyName = 'companyName' in input ? trimValue(input.companyName) : ''
  const requestedCompanyName = 'companyName' in input ? trimToNull(input.companyName) : null
  const requestedPrcNumber = 'prcNumber' in input ? trimToNull(input.prcNumber) : null

  if (effectiveRole === 'developer' && !developerCompanyName) {
    return { success: false, message: 'Company / developer name is required.' }
  }

  let licensedPrcNumber: string | null = null
  if (effectiveRole === 'franchise' || effectiveRole === 'salesperson') {
    licensedPrcNumber = requestedPrcNumber
  }

  if (input.token && !invitation) {
    return { success: false, message: 'This invitation is invalid, expired, or has already been used.' }
  }

  if (invitation && invitation.email !== email) {
    return { success: false, message: 'Use the invited email address to complete registration.' }
  }

  const metadata = {
    first_name: fname,
    last_name: lname,
    full_name: fullName,
    phone,
    role: effectiveRole,
    ...(effectiveRole === 'developer' ? { company_name: developerCompanyName } : {}),
    ...('isCompanyLinked' in input ? { is_company_linked: input.isCompanyLinked, company_name: requestedCompanyName } : {}),
    prc_number: licensedPrcNumber,
  }

  const authResolution = await resolveRegistrationAuthUser({
    supabase,
    input,
    email,
    password,
    metadata,
    normalizedOrigin,
  })

  if ('success' in authResolution) {
    return authResolution
  }

  const { authUser, createdByRegistration, usedInvitationSession } = authResolution

  let referredById: string | null = input.referralId || null
  if (input.affiliateCode) {
    const { data: refCode } = await admin
      .from('referral_codes')
      .select('user_profile_id')
      .eq('code', input.affiliateCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()
    
    if (refCode) {
      referredById = refCode.user_profile_id

      // 1. Increment the main referral_codes table for tracking Overall Successful Referrals
      const { error: totalError } = await admin.rpc('increment_referral_registration_total', { 
        p_code: input.affiliateCode.toUpperCase() 
      })
      if (totalError) console.error('Error incrementing total registrations:', totalError)

      // 2. Track Campaign Registration if provided
      if (input.campaign) {
        let finalSource = input.source;
        if (!finalSource) {
          // If source is missing from URL, we look up what source this campaign belongs to
          const { data: campaignRecord } = await admin
            .from('referral_source_metrics')
            .select('source_name')
            .eq('ambassador_id', referredById)
            .eq('campaign_name', input.campaign)
            .order('created_at', { ascending: false }) // Get the most recent one if duplicates exist
            .limit(1)
            .maybeSingle();
          
          if (campaignRecord) {
            finalSource = campaignRecord.source_name;
          } else {
            // If No record found, we still want it to go to 'Campaign' or 'Other'
            finalSource = 'Campaign'; 
          }
        }

        const { error: rpcError } = await admin.rpc('increment_referral_registration', {
          p_ambassador_id: referredById,
          p_code: input.affiliateCode.toUpperCase(),
          p_source: finalSource,
          p_campaign: input.campaign
        })
        if (rpcError) console.error('RPC Error (Registration):', rpcError);
      }
    }
  }

  try {
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .upsert({
        user_id: authUser.id,
        fname,
        lname,
        full_name: fullName,
        role: effectiveRole,
        prc_number: licensedPrcNumber,
        prc_status: getInitialPrcStatus(effectiveRole, licensedPrcNumber),
        prc_reviewed_at: null,
        prc_reviewed_by: null,
        prc_rejection_reason: null,
        referred_by: referredById,
        is_active: false,
        account_status: ACCOUNT_STATUS_PENDING_APPROVAL,
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
      }, { onConflict: 'user_id' })
      .select('id')
      .single<{ id: string }>()

    if (profileError || !profile) {
      if (isMissingAccountStateColumnError(profileError) || isMissingPrcStateColumnError(profileError)) {
        throw new Error('user_profiles approval and PRC workflow fields are required for this registration flow. Apply the latest schema update first.')
      }

      throw new Error(profileError?.message ?? 'Unable to create user profile.')
    }

    await upsertContactInformation(admin, profile.id, email, phone)

    if (effectiveRole === 'developer') {
      await upsertDeveloperProfile(admin, profile.id, developerCompanyName)
    }

    if ((effectiveRole === 'franchise' || effectiveRole === 'salesperson') && 'isCompanyLinked' in input) {
      if (input.isCompanyLinked && input.companyName) {
        const { error: compErr } = await admin.from('company_profiles').insert({
          user_profile_id: profile.id,
          company_name: trimValue(input.companyName),
        })
        if (compErr) console.error('Failed to create company_profile', compErr)
      }
    }

    // Always save the ID document for franchise/salesperson regardless of company link
    if ((effectiveRole === 'franchise' || effectiveRole === 'salesperson') && 'idUploadUrl' in input && input.idUploadUrl) {
      const fileName = input.idUploadUrl.split('/').pop() ?? 'id-document'
      const { error: docErr } = await admin.from('user_documents').insert({
        user_profile_id: profile.id,
        document_type: 'valid_id',
        category: 'identity',
        file_name: fileName,
        file_url: input.idUploadUrl
      })
      if (docErr) console.error('Failed to insert user_document', docErr)
    }

    // Automated company linking for secretaries and referred members
    if (invitation) {
      const systemRole = mapRoleToCompanySystemRole(effectiveRole)

      const { error: linkErr } = await admin.from('company_members').upsert({
        company_id: invitation.companyId,
        user_profile_id: profile.id,
        system_role: systemRole,
      }, { onConflict: 'company_id,user_profile_id' })

      if (linkErr) {
        throw new Error(`Unable to link this invited account to the franchise office. ${linkErr.message}`)
      }

      await markInvitationAccepted(admin, invitation)
    } else if (referredById) {
      // Find the company owned by the referrer
      const { data: referrerCompany } = await admin
        .from('company_profiles')
        .select('id')
        .eq('user_profile_id', referredById)
        .is('parent_company_id', null)
        .maybeSingle()

      if (referrerCompany) {
        const systemRole = mapRoleToCompanySystemRole(effectiveRole)

        const { error: linkErr } = await admin.from('company_members').upsert({
          company_id: referrerCompany.id,
          user_profile_id: profile.id,
          system_role: systemRole,
        }, { onConflict: 'company_id,user_profile_id' })
        if (linkErr) throw new Error(`Unable to link this account to the referrer company. ${linkErr.message}`)
      }
    }

    await supabase.auth.signOut()

    return {
      success: true,
      message: usedInvitationSession
        ? 'Invitation accepted. Your account is now pending franchise review and owner approval. PRC verification is handled separately by platform admin.'
        : 'Account created. Verify your email to place your registration in the approval queue.',
      email,
    }
  } catch (persistError) {
    if (createdByRegistration) {
      await admin.auth.admin.deleteUser(authUser.id)
      await deleteRegistrationProfileArtifacts(admin, authUser.id)
    } else if (usedInvitationSession) {
      await deleteRegistrationProfileArtifacts(admin, authUser.id)
    }

    return {
      success: false,
      message: persistError instanceof Error ? persistError.message : 'Unable to finish registration.',
    }
  }
}

export async function uploadIdAction(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) return { success: false, message: 'No file provided' }
  try {
    ensureImageFile(file)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `identity-docs/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const publicUrl = await uploadPublicFile({ file, path, provider: 'supabase' })
    return { success: true, url: publicUrl }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
