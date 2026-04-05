'use server'

import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import { buildArchivedAuthEmail, isMissingApplicationArchiveColumnError } from '@/lib/application-archive'
import { ACCOUNT_STATUS_REJECTED } from '@/lib/account-status'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import {
  getPreferredCompanyMembershipForProfile,
  repairCompanyInvitationMemberships,
} from '@/lib/company-members'
import { revalidatePath } from 'next/cache'

const INVITATION_PATHS = ['/dashboard/secretary/invitations', '/dashboard/franchise/invitations']
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

type AuthorizedCompanyContext = {
  admin: ReturnType<typeof createAdminSupabaseClient>
  companyId: number
  companyName: string
  user: NonNullable<Awaited<ReturnType<typeof getCurrentDashboardUser>>>
}

type CompanyInvitationRecord = {
  id: string
  company_id: number
  email: string
  invited_role: string
  invitation_token: string
  status: string
  expires_at: string
}

type InvitationActionResult = {
  success: boolean
  message: string
  emailSent?: boolean
  renewed?: boolean
}

type ExistingInvitationProfile = {
  account_status: string | null
  full_name: string | null
  id: string
  role: string | null
  user_id: string
}

type ReusableRejectedApplicant = {
  authUser: User | null
  profile: ExistingInvitationProfile
}

type InvitationRecipientResolution = {
  conflictMessage: string | null
  reusableRejectedApplicant: ReusableRejectedApplicant | null
}

function revalidateInvitationPages() {
  for (const path of INVITATION_PATHS) {
    revalidatePath(path)
  }
}

function buildInvitationToken() {
  return randomBytes(32).toString('hex')
}

function getInvitationExpiryIso() {
  return new Date(Date.now() + INVITATION_TTL_MS).toISOString()
}

async function buildInvitationUrl(token: string) {
  const headerStore = await headers()
  const baseUrl = (headerStore.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${baseUrl}/join/${token}`
}

async function getAuthorizedCompanyContext(): Promise<AuthorizedCompanyContext> {
  const user = await getCurrentDashboardUser()

  if (!user || !['franchise', 'franchise_secretary'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const admin = createAdminSupabaseClient()

  if (user.role === 'franchise') {
    const ownedCompanyResult = await admin
      .from('company_profiles')
      .select('id, company_name')
      .eq('user_profile_id', user.profileId)
      .is('parent_company_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<{ id: number; company_name: string | null }>()

    if (ownedCompanyResult.error) {
      throw new Error(ownedCompanyResult.error.message)
    }

    if (ownedCompanyResult.data?.id) {
      return {
        admin,
        companyId: ownedCompanyResult.data.id,
        companyName: ownedCompanyResult.data.company_name?.trim() || 'HomesPH Partner',
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
      throw new Error('Your account is not yet linked to an active company.')
    }

    const fallbackCompanyResult = await admin
      .from('company_profiles')
      .select('company_name')
      .eq('id', ownerMembershipResult.data.company_id)
      .maybeSingle<{ company_name: string | null }>()

    if (fallbackCompanyResult.error) {
      throw new Error(fallbackCompanyResult.error.message)
    }

    return {
      admin,
      companyId: ownerMembershipResult.data.company_id,
      companyName: fallbackCompanyResult.data?.company_name?.trim() || 'HomesPH Partner',
      user,
    }
  }

  const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
    allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
  })

  if (!membership?.companyId) {
    throw new Error('Your account is not yet linked to an active company.')
  }

  const { data: company, error: companyError } = await admin
    .from('company_profiles')
    .select('company_name')
    .eq('id', membership.companyId)
    .maybeSingle<{ company_name: string | null }>()

  if (companyError) {
    throw new Error(companyError.message)
  }

  return {
    admin,
    companyId: membership.companyId,
    companyName: company?.company_name?.trim() || 'HomesPH Partner',
    user,
  }
}

async function getManagedInvitation(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  companyId: number,
  inviteId: string,
) {
  const { data: invitation, error } = await admin
    .from('company_invitations')
    .select('id, company_id, email, invited_role, invitation_token, status, expires_at')
    .eq('company_id', companyId)
    .eq('id', inviteId)
    .maybeSingle<CompanyInvitationRecord>()

  if (error) {
    throw new Error(error.message)
  }

  if (!invitation) {
    throw new Error('Invitation not found.')
  }

  return invitation
}

async function findExistingInvitationProfileByEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data: contact, error: contactError } = await admin
    .from('contact_information')
    .select('user_profile_id')
    .eq('email', normalizedEmail)
    .maybeSingle<{ user_profile_id: string }>()

  if (contactError) {
    throw new Error(contactError.message)
  }

  if (!contact?.user_profile_id) {
    return null
  }

  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, user_id, full_name, role, account_status')
    .eq('id', contact.user_profile_id)
    .maybeSingle<ExistingInvitationProfile>()

  if (profileError) {
    throw new Error(profileError.message)
  }

  return profile ?? null
}

function isReusableRejectedApplicant(profile: ExistingInvitationProfile | null | undefined) {
  if (!profile) {
    return false
  }

  return profile.account_status === 'rejected' && ['agent', 'salesperson'].includes(profile.role ?? '')
}

async function deleteStaleInvitationProfile(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  profileId: string,
) {
  const childDeletes = await Promise.all([
    admin.from('user_documents').delete().eq('user_profile_id', profileId),
    admin.from('addresses').delete().eq('user_profile_id', profileId),
    admin.from('company_members').delete().eq('user_profile_id', profileId),
    admin.from('contact_information').delete().eq('user_profile_id', profileId),
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

async function archiveRejectedApplicantForFreshInvite(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  options: {
    authUser: User | null
    companyId: number
    originalEmail: string
    profile: ExistingInvitationProfile
  },
) {
  const { authUser, companyId, originalEmail, profile } = options
  const archivedAt = new Date().toISOString()
  const archiveReason = 'Rejected application archived after the office sent a fresh invite.'
  const archivedEmail = buildArchivedAuthEmail(originalEmail, profile.id)

  if (authUser?.id) {
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(authUser.id, {
      email: archivedEmail,
      email_confirm: true,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        application_archive_reason: archiveReason,
        application_archived_at: archivedAt,
        archived_contact_email: originalEmail,
      },
    })

    if (updateAuthError) {
      throw new Error(updateAuthError.message)
    }
  }

  const { error: contactUpdateError } = await admin
    .from('contact_information')
    .update({ email: archivedEmail })
    .eq('user_profile_id', profile.id)

  if (contactUpdateError) {
    throw new Error(contactUpdateError.message)
  }

  const { error: profileUpdateError } = await admin
    .from('user_profiles')
    .update({
      account_status: ACCOUNT_STATUS_REJECTED,
      application_archived_at: archivedAt,
      application_archive_reason: archiveReason,
      archived_company_id: companyId,
      archived_contact_email: originalEmail,
      is_active: false,
    })
    .eq('id', profile.id)

  if (profileUpdateError) {
    if (isMissingApplicationArchiveColumnError(profileUpdateError)) {
      throw new Error('Rejected application archive fields are required for clean re-invites. Apply docs-and-migrations/20260404_rejected_application_archives.sql first.')
    }

    throw new Error(profileUpdateError.message)
  }

  const { error: membershipDeleteError } = await admin
    .from('company_members')
    .delete()
    .eq('company_id', companyId)
    .eq('user_profile_id', profile.id)

  if (membershipDeleteError) {
    throw new Error(membershipDeleteError.message)
  }
}

async function resolveInvitationRecipientState(
  context: AuthorizedCompanyContext,
  email: string,
): Promise<InvitationRecipientResolution> {
  const existingProfile = await findExistingInvitationProfileByEmail(context.admin, email)
  const existingAuthUser = await findAuthUserByEmail(context.admin, email)

  if (existingProfile) {
    const { data: sameOfficeMember, error: memberError } = await context.admin
      .from('company_members')
      .select('user_profile_id')
      .eq('company_id', context.companyId)
      .eq('user_profile_id', existingProfile.id)
      .maybeSingle<{ user_profile_id: string }>()

    if (memberError) {
      throw new Error(memberError.message)
    }

    if (!existingAuthUser) {
      if (sameOfficeMember && isReusableRejectedApplicant(existingProfile)) {
        return {
          conflictMessage: null,
          reusableRejectedApplicant: {
            authUser: null,
            profile: existingProfile,
          },
        }
      }

      const isStaleInviteApplicant = ['agent', 'salesperson'].includes(existingProfile.role ?? '')
      if (!isStaleInviteApplicant) {
        return {
          conflictMessage: 'This email is linked to an older HomesPH profile record. Please clear that user manually before sending a new invite.',
          reusableRejectedApplicant: null,
        }
      }

      await deleteStaleInvitationProfile(context.admin, existingProfile.id)
      return {
        conflictMessage: null,
        reusableRejectedApplicant: null,
      }
    }

    if (sameOfficeMember) {
      if (isReusableRejectedApplicant(existingProfile)) {
        return {
          conflictMessage: null,
          reusableRejectedApplicant: {
            authUser: existingAuthUser,
            profile: existingProfile,
          },
        }
      }

      return {
        conflictMessage: 'This email already belongs to an existing member or pending applicant in your office. Review that record instead of sending a new invite.',
        reusableRejectedApplicant: null,
      }
    }

    return {
      conflictMessage: 'This email already belongs to an existing HomesPH account or pending registration. Ask the user to sign in instead of sending a new invite.',
      reusableRejectedApplicant: null,
    }
  }

  if (!existingAuthUser) {
    return {
      conflictMessage: null,
      reusableRejectedApplicant: null,
    }
  }

  const hasProfile = await authUserHasProfile(context.admin, existingAuthUser.id)

  if (hasProfile) {
    return {
      conflictMessage: 'This email already belongs to an existing HomesPH account or pending registration. Ask the user to sign in instead of sending a new invite.',
      reusableRejectedApplicant: null,
    }
  }

  if (!isManagedInvitationAuthUser(existingAuthUser)) {
    return {
      conflictMessage: 'This email already has an authentication record. Ask the user to log in with that account or use a different email.',
      reusableRejectedApplicant: null,
    }
  }

  return {
    conflictMessage: null,
    reusableRejectedApplicant: null,
  }
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    const existingUser =
      data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ?? null

    if (existingUser) {
      return existingUser
    }

    if (data.users.length < perPage) {
      break
    }

    page += 1
  }

  return null
}

async function authUserHasProfile(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  authUserId: string,
) {
  const { data, error } = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data?.id)
}

function isManagedInvitationAuthUser(user: User | null | undefined) {
  const metadata = user?.user_metadata

  return Boolean(
    metadata &&
      (typeof metadata.company_invitation_id === 'string' ||
        typeof metadata.invitation_token === 'string' ||
        typeof metadata.invited_role === 'string'),
  )
}

function buildInvitationMetadata(
  context: AuthorizedCompanyContext,
  invitation: Pick<CompanyInvitationRecord, 'id' | 'invited_role' | 'invitation_token'>,
) {
  return {
    company_invitation_id: invitation.id,
    company_name: context.companyName,
    invitation_token: invitation.invitation_token,
    invited_role: invitation.invited_role,
    inviter_name: context.user.fullName,
    inviter_profile_id: context.user.profileId,
  }
}

function formatInvitationDeliveryError(message: string | undefined) {
  const normalizedMessage = message?.trim()

  if (!normalizedMessage) {
    return 'The invitation email could not be sent.'
  }

  const loweredMessage = normalizedMessage.toLowerCase()

  if (loweredMessage.includes('already been registered') || loweredMessage.includes('already registered')) {
    return 'This email already has a HomesPH auth account. Secretary invitations are only for new agent account creation.'
  }

  return normalizedMessage
}

async function deliverInvitationEmail(
  context: AuthorizedCompanyContext,
  invitation: Pick<CompanyInvitationRecord, 'id' | 'email' | 'invited_role' | 'invitation_token'>,
) {
  const inviteUrl = await buildInvitationUrl(invitation.invitation_token)
  const existingAuthUser = await findAuthUserByEmail(context.admin, invitation.email)

  if (existingAuthUser) {
    const hasProfile = await authUserHasProfile(context.admin, existingAuthUser.id)

    if (hasProfile) {
      return {
        emailResult: {
          sent: false,
          message: 'This email already belongs to a registered or pending HomesPH account.',
        },
      }
    }

    if (!isManagedInvitationAuthUser(existingAuthUser)) {
      return {
        emailResult: {
          sent: false,
          message: 'This email already has an authentication record. Ask the agent to log in with that account or use a different email.',
        },
      }
    }

    const { error: deleteError } = await context.admin.auth.admin.deleteUser(existingAuthUser.id)

    if (deleteError) {
      return {
        emailResult: {
          sent: false,
          message: deleteError.message,
        },
      }
    }
  }

  const { error } = await context.admin.auth.admin.inviteUserByEmail(invitation.email, {
    redirectTo: inviteUrl,
    data: buildInvitationMetadata(context, invitation),
  })

  return {
    emailResult: {
      sent: !error,
      message: formatInvitationDeliveryError(error?.message),
    },
  }
}

/**
 * Fetches all trackable invitations for the franchise company
 */
export async function fetchCompanyInvitations() {
  const { admin, companyId } = await getAuthorizedCompanyContext()

  await repairCompanyInvitationMemberships(admin, companyId)

  const { data: invitations, error } = await admin
    .from('company_invitations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return invitations ?? []
}

/**
 * Creates a new company invitation and sends the Supabase invite email.
 */
export async function createCompanyInvitationAction(email: string, role: string): Promise<InvitationActionResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      return { success: false, message: 'Email is required.' }
    }

    const context = await getAuthorizedCompanyContext()
    const recipientResolution = await resolveInvitationRecipientState(context, normalizedEmail)
    const archivedPreviousRejectedApplication = Boolean(recipientResolution.reusableRejectedApplicant)

    if (recipientResolution.conflictMessage) {
      return {
        success: false,
        message: recipientResolution.conflictMessage,
        emailSent: false,
      }
    }

    const invitationToken = buildInvitationToken()
    const expiresAt = getInvitationExpiryIso()

    const { data: existingInvites, error: lookupError } = await context.admin
      .from('company_invitations')
      .select('id, company_id, email, invited_role, invitation_token, status, expires_at')
      .eq('company_id', context.companyId)
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })

    if (lookupError) {
      return { success: false, message: lookupError.message }
    }

    const reusableInvite =
      (existingInvites ?? []).find((invite) => invite.status === 'pending') ??
      (existingInvites ?? []).find((invite) => invite.status !== 'accepted')
    let inviteRecord: CompanyInvitationRecord | undefined
    let renewed = false

    if (reusableInvite) {
      renewed = true
      const { data: updatedInvite, error: updateError } = await context.admin
        .from('company_invitations')
        .update({
          email: normalizedEmail,
          invited_role: role,
          invited_by: context.user.userId,
          invitation_token: invitationToken,
          status: 'pending',
          expires_at: expiresAt,
        })
        .eq('id', reusableInvite.id)
        .select('id, company_id, email, invited_role, invitation_token, status, expires_at')
        .single<CompanyInvitationRecord>()

      if (updateError) {
        return { success: false, message: updateError.message }
      }

      inviteRecord = updatedInvite
    } else {
      const { data: createdInvite, error: createError } = await context.admin
        .from('company_invitations')
        .insert({
          company_id: context.companyId,
          email: normalizedEmail,
          invited_role: role,
          invited_by: context.user.userId,
          invitation_token: invitationToken,
          status: 'pending',
          expires_at: expiresAt,
        })
        .select('id, company_id, email, invited_role, invitation_token, status, expires_at')
        .single<CompanyInvitationRecord>()

      if (createError) {
        return { success: false, message: createError.message }
      }

      inviteRecord = createdInvite
    }

    if (!inviteRecord) {
      return { success: false, message: 'Unable to create invitation.' }
    }

    if (recipientResolution.reusableRejectedApplicant) {
      await archiveRejectedApplicantForFreshInvite(context.admin, {
        authUser: recipientResolution.reusableRejectedApplicant.authUser,
        companyId: context.companyId,
        originalEmail: normalizedEmail,
        profile: recipientResolution.reusableRejectedApplicant.profile,
      })
    }

    const { emailResult } = await deliverInvitationEmail(context, inviteRecord)

    revalidateInvitationPages()

    if (!emailResult.sent) {
      return {
        success: false,
        message: archivedPreviousRejectedApplication
          ? `Previous rejected application archived, but the new invite email could not be sent. ${emailResult.message || ''}`.trim()
          : emailResult.message || 'Invitation saved, but the email could not be sent.',
        emailSent: false,
        renewed,
      }
    }

    return {
      success: true,
      message: archivedPreviousRejectedApplication
        ? 'Fresh invite sent. The previous rejected application was archived for history.'
        : renewed
          ? 'Invitation renewed and email sent.'
          : 'Invitation email sent successfully.',
      emailSent: true,
      renewed,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Resends/Renews an existing invitation by updating its expiry date.
 */
export async function resendInvitationAction(inviteId: string) {
  const context = await getAuthorizedCompanyContext()
  const invitation = await getManagedInvitation(context.admin, context.companyId, inviteId)

  if (invitation.status === 'accepted') {
    throw new Error('Accepted invitations can no longer be resent.')
  }

  const recipientResolution = await resolveInvitationRecipientState(context, invitation.email)
  const archivedPreviousRejectedApplication = Boolean(recipientResolution.reusableRejectedApplicant)

  if (recipientResolution.conflictMessage) {
    return {
      success: false,
      message: recipientResolution.conflictMessage,
      emailSent: false,
    }
  }

  const refreshedToken = buildInvitationToken()
  const refreshedExpiry = getInvitationExpiryIso()

  const { data: refreshedInvitation, error } = await context.admin
    .from('company_invitations')
    .update({
      invited_by: context.user.userId,
      invitation_token: refreshedToken,
      expires_at: refreshedExpiry,
      status: 'pending',
    })
    .eq('id', inviteId)
    .eq('company_id', context.companyId)
    .select('id, company_id, email, invited_role, invitation_token, status, expires_at')
    .single<CompanyInvitationRecord>()

  if (error) {
    throw new Error(error.message)
  }

  if (recipientResolution.reusableRejectedApplicant) {
    await archiveRejectedApplicantForFreshInvite(context.admin, {
      authUser: recipientResolution.reusableRejectedApplicant.authUser,
      companyId: context.companyId,
      originalEmail: invitation.email,
      profile: recipientResolution.reusableRejectedApplicant.profile,
    })
  }

  const { emailResult } = await deliverInvitationEmail(context, refreshedInvitation)

  revalidateInvitationPages()

  if (!emailResult.sent) {
    return {
      success: false,
      message: archivedPreviousRejectedApplication
        ? `Previous rejected application archived, but the renewed invite email could not be sent. ${emailResult.message || ''}`.trim()
        : emailResult.message || 'Invitation renewed, but the email could not be sent.',
      emailSent: false,
    }
  }

  return {
    success: true,
    message: archivedPreviousRejectedApplication
      ? 'Invite renewed. The previous rejected application was archived for history.'
      : 'Invitation renewed and email sent.',
    emailSent: true,
  }
}

export async function cancelInvitationAction(inviteId: string) {
  const context = await getAuthorizedCompanyContext()
  const invitation = await getManagedInvitation(context.admin, context.companyId, inviteId)

  if (invitation.status === 'accepted') {
    throw new Error('Accepted invitations cannot be cancelled.')
  }

  const { error } = await context.admin
    .from('company_invitations')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .eq('company_id', context.companyId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateInvitationPages()

  return {
    success: true,
    message: 'Invitation cancelled.',
  }
}

export async function removeInvitationAction(inviteId: string) {
  const context = await getAuthorizedCompanyContext()
  await getManagedInvitation(context.admin, context.companyId, inviteId)

  const { error } = await context.admin
    .from('company_invitations')
    .delete()
    .eq('id', inviteId)
    .eq('company_id', context.companyId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateInvitationPages()

  return {
    success: true,
    message: 'Invitation removed.',
  }
}
