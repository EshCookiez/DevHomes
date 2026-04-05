'use server'

import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import {
  getPreferredCompanyMembershipForProfile,
  getSecretaryCompanyScopeForMembership,
  repairCompanyInvitationMemberships,
} from '@/lib/company-members'
import { sendCorrectionRequestNotification } from '@/lib/email/correction-request-notifications'
import { sendOwnerReviewReadyNotification } from '@/lib/email/owner-review-ready-notifications'
import { 
  ACCOUNT_STATUS_PENDING_APPROVAL, 
  ACCOUNT_STATUS_UNDER_REVIEW, 
  ACCOUNT_STATUS_CORRECTION_REQUIRED,
  getSecretaryApplicationStatus
} from '@/lib/account-status'
import { revalidatePath } from 'next/cache'

type SecretaryReviewActionResult = {
  success: boolean
  message: string
  emailSent?: boolean
}

type SecretaryDashboardSummary = {
  activeMembers: number
  inactiveMembers: number
  ownerReady: number
  pendingInvites: number
  pendingOnboarding: number
  officeName: string
  ownerNotificationRecipients: number
}

type SecretaryOwnerRecipient = {
  email: string
  fullName: string | null
  profileId: string
}

async function buildCorrectionPortalUrl() {
  const headerStore = await headers()
  const baseUrl = (headerStore.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${baseUrl}/account/correction`
}

async function buildReviewedProfileUrl(profileId: string) {
  const headerStore = await headers()
  const baseUrl = (headerStore.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${baseUrl}/dashboard/profile/${profileId}`
}

async function getSecretaryCompanyContext() {
  const user = await getCurrentDashboardUser()
  if (!user || user.role !== 'franchise_secretary') {
    throw new Error('Unauthorized')
  }

  const admin = createAdminSupabaseClient()
  const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
    allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
  })

  if (!membership?.companyId) {
    throw new Error('Secretary is not linked to a franchise office.')
  }

  const scope = await getSecretaryCompanyScopeForMembership(admin, membership)
  await Promise.all(
    scope.scopeCompanyIds.map(async (companyId) => {
      try {
        await repairCompanyInvitationMemberships(admin, companyId)
      } catch {
        // Keep the secretary views usable even if one office is mid-repair.
      }
    }),
  )

  return {
    admin,
    companyId: scope.companyId,
    companyName: scope.companyName,
    organizationRole: scope.organizationRole,
    parentCompanyId: scope.parentCompanyId,
    scopeCompanyIds: scope.scopeCompanyIds,
    user,
  }
}

async function getSecretaryScopedAgent(agentId: string) {
  const context = await getSecretaryCompanyContext()

  const { data: companyMembers, error: membershipError } = await context.admin
    .from('company_members')
    .select('user_profile_id')
    .in('company_id', context.scopeCompanyIds)
    .eq('user_profile_id', agentId)
    .limit(1)
    .returns<Array<{ user_profile_id: string }>>()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!(companyMembers ?? []).length) {
    throw new Error('This application does not belong to your franchise office.')
  }

  const [profileResult, contactResult] = await Promise.all([
    context.admin
      .from('user_profiles')
      .select('id, full_name, is_active, account_status, rejection_reason, reviewed_at')
      .eq('id', agentId)
      .maybeSingle<{
        id: string
        full_name: string | null
        is_active: boolean | null
        account_status: string | null
        rejection_reason: string | null
        reviewed_at: string | null
      }>(),
    context.admin
      .from('contact_information')
      .select('email')
      .eq('user_profile_id', agentId)
      .maybeSingle<{ email: string | null }>(),
  ])

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (contactResult.error) {
    throw new Error(contactResult.error.message)
  }

  if (!profileResult.data) {
    throw new Error('Application not found.')
  }

  return {
    ...context,
    email: contactResult.data?.email?.trim() ?? '',
    profile: profileResult.data,
  }
}

async function getCompanyOwnerRecipients(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  companyId: number,
) {
  const { data: currentCompany, error: currentCompanyError } = await admin
    .from('company_profiles')
    .select('id, company_name, parent_company_id, user_profile_id')
    .eq('id', companyId)
    .maybeSingle<{ company_name: string | null; id: number; parent_company_id: number | null; user_profile_id: string | null }>()

  if (currentCompanyError) {
    throw new Error(currentCompanyError.message)
  }

  const siblingCompanyIds =
    currentCompany?.company_name?.trim()
      ? (
          await admin
            .from('company_profiles')
            .select('id')
            .eq('company_name', currentCompany.company_name.trim())
            .is('parent_company_id', null)
            .neq('id', companyId)
            .returns<Array<{ id: number }>>()
        )
      : { data: [], error: null as { message: string } | null }

  if (siblingCompanyIds.error) {
    throw new Error(siblingCompanyIds.error.message)
  }

  const scopeCompanyIds = [
    companyId,
    currentCompany?.parent_company_id ?? null,
    ...(siblingCompanyIds.data ?? []).map((entry) => entry.id),
  ].filter((value): value is number => typeof value === 'number')

  const [companyOwnersResult, ownerMembershipsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id, user_profile_id')
      .in('id', scopeCompanyIds)
      .returns<Array<{ id: number; user_profile_id: string | null }>>(),
    admin
      .from('company_members')
      .select('user_profile_id')
      .in('company_id', scopeCompanyIds)
      .eq('system_role', 'owner')
      .returns<Array<{ user_profile_id: string }>>(),
  ])

  if (companyOwnersResult.error) {
    throw new Error(companyOwnersResult.error.message)
  }

  if (ownerMembershipsResult.error) {
    throw new Error(ownerMembershipsResult.error.message)
  }

  const ownerProfileIds = [
    ...(companyOwnersResult.data ?? []).map((entry) => entry.user_profile_id),
    ...(ownerMembershipsResult.data ?? []).map((entry) => entry.user_profile_id),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)

  const uniqueOwnerProfileIds = [...new Set(ownerProfileIds)]

  if (!uniqueOwnerProfileIds.length) {
    return [] as SecretaryOwnerRecipient[]
  }

  const [ownerProfilesResult, ownerContactsResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('id, user_id, full_name')
      .in('id', uniqueOwnerProfileIds)
      .returns<Array<{ id: string; user_id: string | null; full_name: string | null }>>(),
    admin
      .from('contact_information')
      .select('user_profile_id, email')
      .in('user_profile_id', uniqueOwnerProfileIds)
      .returns<Array<{ user_profile_id: string; email: string | null }>>(),
  ])

  if (ownerProfilesResult.error) {
    throw new Error(ownerProfilesResult.error.message)
  }

  if (ownerContactsResult.error) {
    throw new Error(ownerContactsResult.error.message)
  }

  const profileById = new Map(
    (ownerProfilesResult.data ?? []).map((profile) => [profile.id, profile]),
  )
  const emailByProfileId = new Map(
    (ownerContactsResult.data ?? []).map((contact) => [contact.user_profile_id, contact.email?.trim() ?? '']),
  )

  const ownersMissingContactEmail = uniqueOwnerProfileIds
    .map((profileId) => profileById.get(profileId))
    .filter((profile): profile is { id: string; user_id: string; full_name: string | null } => Boolean(profile?.user_id))
    .filter((profile) => !emailByProfileId.get(profile.id))

  if (ownersMissingContactEmail.length) {
    const authLookups = await Promise.all(
      ownersMissingContactEmail.map(async (profile) => {
        const result = await admin.auth.admin.getUserById(profile.user_id)
        return {
          email: result.data.user?.email?.trim() ?? '',
          profileId: profile.id,
        }
      }),
    )

    for (const lookup of authLookups) {
      if (lookup.email) {
        emailByProfileId.set(lookup.profileId, lookup.email)
      }
    }
  }

  return uniqueOwnerProfileIds
    .map((profileId) => ({
      email: emailByProfileId.get(profileId) ?? '',
      fullName: profileById.get(profileId)?.full_name?.trim() ?? null,
      profileId,
    }))
    .filter((entry) => entry.email)
}

async function notifyOwnersOfReadyApplication(
  context: Awaited<ReturnType<typeof getSecretaryCompanyContext>>,
  agentProfileId: string,
  applicantName: string,
) {
  const ownerRecipients = await getCompanyOwnerRecipients(context.admin, context.companyId)

  if (!ownerRecipients.length) {
    return {
      emailSent: false,
      recipientCount: 0,
      message: 'No owner email is on file for this office yet.',
    }
  }

  const reviewUrl = await buildReviewedProfileUrl(agentProfileId)
  const results = await Promise.all(
    ownerRecipients.map((owner) =>
      sendOwnerReviewReadyNotification({
        applicantName,
        officeName: context.companyName,
        ownerEmail: owner.email,
        ownerName: owner.fullName,
        reviewUrl,
      }),
    ),
  )

  const sentCount = results.filter((result) => result.sent).length

  if (!sentCount) {
    return {
      emailSent: false,
      recipientCount: ownerRecipients.length,
      message: results.find((result) => result.message)?.message ?? 'Owner notification could not be sent.',
    }
  }

  if (sentCount < ownerRecipients.length) {
    return {
      emailSent: true,
      recipientCount: sentCount,
      message: `Owner notice sent to ${sentCount} of ${ownerRecipients.length} owners.`,
    }
  }

  return {
    emailSent: true,
    recipientCount: sentCount,
    message: ownerRecipients.length === 1
      ? 'Owner notified that the application is ready for approval.'
      : `All ${ownerRecipients.length} owners were notified that the application is ready for approval.`,
  }
}

/**
 * Fetches agents belonging to the same franchise as the current secretary
 * who are currently pending approval or under review.
 */
export async function getPendingFranchiseAgents() {
  const { admin, scopeCompanyIds, user } = await getSecretaryCompanyContext()

  const { data: members, error: membersError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .in('company_id', scopeCompanyIds)
    .neq('user_profile_id', user.profileId)

  if (membersError) {
    console.error('Error fetching company members:', membersError)
    return []
  }

  const profileIds = [...new Set((members ?? []).map((member) => member.user_profile_id).filter(Boolean))]

  if (!profileIds.length) {
    return []
  }

  const [profilesResult, contactsResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('id, full_name, role, account_status, created_at, profile_image_url, rejection_reason, reviewed_at')
      .in('id', profileIds)
      .in('role', ['salesperson', 'agent'])
      .in('account_status', [
        ACCOUNT_STATUS_PENDING_APPROVAL,
        ACCOUNT_STATUS_UNDER_REVIEW,
        ACCOUNT_STATUS_CORRECTION_REQUIRED,
      ]),
    admin
      .from('contact_information')
      .select('user_profile_id, email')
      .in('user_profile_id', profileIds),
  ])

  if (profilesResult.error) {
    console.error('Error fetching pending agent profiles:', profilesResult.error)
    return []
  }

  if (contactsResult.error) {
    console.error('Error fetching pending agent contact information:', contactsResult.error)
  }

  const emailByProfileId = new Map(
    (contactsResult.data ?? []).map((contact) => [contact.user_profile_id, contact.email ?? '']),
  )

  return (profilesResult.data ?? [])
    .map((profile) => ({
      ...profile,
      account_status: getSecretaryApplicationStatus(profile),
      email: emailByProfileId.get(profile.id) ?? '',
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getSecretaryDashboardSummary(): Promise<SecretaryDashboardSummary> {
  const context = await getSecretaryCompanyContext()

  const { data: companyMembers, error: membersError } = await context.admin
    .from('company_members')
    .select('user_profile_id')
    .in('company_id', context.scopeCompanyIds)

  if (membersError) {
    throw new Error(membersError.message)
  }

  const profileIds = [...new Set((companyMembers ?? []).map((member) => member.user_profile_id).filter(Boolean))]

  const [profilesResult, invitesResult, ownerRecipients] = await Promise.all([
    profileIds.length
      ? context.admin
          .from('user_profiles')
          .select('id, is_active, account_status, rejection_reason, reviewed_at')
          .in('id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    context.admin
      .from('company_invitations')
      .select('status, expires_at')
      .in('company_id', context.scopeCompanyIds),
    getCompanyOwnerRecipients(context.admin, context.companyId),
  ])

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  if (invitesResult.error) {
    throw new Error(invitesResult.error.message)
  }

  const normalizedProfiles = (profilesResult.data ?? []).map((profile) => ({
    ...profile,
    normalizedStatus: getSecretaryApplicationStatus(profile),
  }))

  const pendingInvites = (invitesResult.data ?? []).filter((invite) => {
    if (invite.status !== 'pending') {
      return false
    }

    return !invite.expires_at || new Date(invite.expires_at).getTime() >= Date.now()
  }).length

  return {
    activeMembers: normalizedProfiles.filter((profile) => profile.is_active !== false).length,
    inactiveMembers: normalizedProfiles.filter((profile) => profile.is_active === false).length,
    ownerReady: normalizedProfiles.filter((profile) => profile.normalizedStatus === ACCOUNT_STATUS_UNDER_REVIEW).length,
    pendingInvites,
    pendingOnboarding: normalizedProfiles.filter((profile) =>
      [ACCOUNT_STATUS_PENDING_APPROVAL, ACCOUNT_STATUS_CORRECTION_REQUIRED].includes(profile.normalizedStatus),
    ).length,
    officeName: context.companyName,
    ownerNotificationRecipients: ownerRecipients.length,
  }
}

/**
 * Marks an agent as 'Correction Required' with feedback notes.
 */
export async function returnAgentForCorrection(agentId: string, feedback: string): Promise<SecretaryReviewActionResult> {
  const { admin, user } = await getSecretaryScopedAgent(agentId)
  
  const { error } = await admin
    .from('user_profiles')
    .update({ 
      account_status: ACCOUNT_STATUS_PENDING_APPROVAL,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.userId,
      rejection_reason: feedback // Use rejection_reason column for correction notes
    })
    .eq('id', agentId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/secretary')
  revalidatePath('/dashboard/secretary/applications')
  revalidatePath(`/dashboard/profile/${agentId}`)

  let message = 'Correction request saved.'
  let emailSent = false

  try {
    const [profileResult, contactResult] = await Promise.all([
      admin
        .from('user_profiles')
        .select('full_name')
        .eq('id', agentId)
        .maybeSingle<{ full_name: string | null }>(),
      admin
        .from('contact_information')
        .select('email')
        .eq('user_profile_id', agentId)
        .maybeSingle<{ email: string | null }>(),
    ])

    if (profileResult.error) {
      throw new Error(profileResult.error.message)
    }

    if (contactResult.error) {
      throw new Error(contactResult.error.message)
    }

    const recipientEmail = contactResult.data?.email?.trim()

    if (!recipientEmail) {
      message = 'Correction request saved, but this agent does not have an email address on file.'
    } else {
      const emailResult = await sendCorrectionRequestNotification({
        correctionNote: feedback,
        correctionUrl: await buildCorrectionPortalUrl(),
        email: recipientEmail,
        fullName: profileResult.data?.full_name?.trim() || recipientEmail,
      })

      emailSent = emailResult.sent
      message = emailResult.sent
        ? 'Correction request saved and emailed to the agent.'
        : `Correction request saved, but the email could not be sent. ${emailResult.message ?? ''}`.trim()
    }
  } catch (notificationError) {
    const reason = notificationError instanceof Error ? notificationError.message : 'Unable to deliver the correction email.'
    message = `Correction request saved, but the email could not be sent. ${reason}`
  }

  return { success: true, message, emailSent }
}

export async function sendApplicationReminder(agentId: string): Promise<SecretaryReviewActionResult> {
  const { email, profile } = await getSecretaryScopedAgent(agentId)
  const secretaryStatus = getSecretaryApplicationStatus(profile)

  if (secretaryStatus !== ACCOUNT_STATUS_CORRECTION_REQUIRED || !profile.rejection_reason?.trim()) {
    return {
      success: false,
      message: 'Reminder emails are only available after a correction request has been sent.',
      emailSent: false,
    }
  }

  if (!email) {
    return {
      success: false,
      message: 'This application does not have an email address on file.',
      emailSent: false,
    }
  }

  const emailResult = await sendCorrectionRequestNotification({
    correctionNote: profile.rejection_reason,
    correctionUrl: await buildCorrectionPortalUrl(),
    email,
    fullName: profile.full_name?.trim() || email,
  })

  if (!emailResult.sent) {
    return {
      success: false,
      message: `Reminder email could not be sent. ${emailResult.message ?? ''}`.trim(),
      emailSent: false,
    }
  }

  return {
    success: true,
    message: 'Reminder email sent to the agent.',
    emailSent: true,
  }
}

export async function notifyOwnerReadyForApproval(agentId: string): Promise<SecretaryReviewActionResult> {
  const scopedAgent = await getSecretaryScopedAgent(agentId)
  const secretaryStatus = getSecretaryApplicationStatus(scopedAgent.profile)

  if (secretaryStatus !== ACCOUNT_STATUS_UNDER_REVIEW) {
    return {
      success: false,
      message: 'Mark the application as reviewed first before notifying the owner.',
      emailSent: false,
    }
  }

  const applicantName = scopedAgent.profile.full_name?.trim() || scopedAgent.email || 'This applicant'
  const ownerNotice = await notifyOwnersOfReadyApplication(scopedAgent, agentId, applicantName)

  return {
    success: ownerNotice.emailSent,
    message: ownerNotice.message,
    emailSent: ownerNotice.emailSent,
  }
}

/**
 * Marks an agent's application as "Reviewed" by the secretary.
 * This does NOT approve the account, only flags it for the owner.
 */
export async function markAgentAsReviewed(agentProfileId: string): Promise<SecretaryReviewActionResult> {
  const scopedAgent = await getSecretaryScopedAgent(agentProfileId)
  const { admin, user } = scopedAgent

  const { error } = await admin
    .from('user_profiles')
    .update({ 
      account_status: ACCOUNT_STATUS_PENDING_APPROVAL,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.userId,
      rejection_reason: null,
    })
    .eq('id', agentProfileId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/secretary')
  revalidatePath('/dashboard/secretary/applications')
  revalidatePath(`/dashboard/profile/${agentProfileId}`)

  const applicantName = scopedAgent.profile.full_name?.trim() || scopedAgent.email || 'This applicant'
  const ownerNotice = await notifyOwnersOfReadyApplication(scopedAgent, agentProfileId, applicantName)

  return {
    success: true,
    message: ownerNotice.emailSent
      ? `Application marked as reviewed. ${ownerNotice.message}`
      : `Application marked as reviewed and ready for final approval. ${ownerNotice.message}`,
    emailSent: ownerNotice.emailSent,
  }
}

/**
 * Fetches recent leads for the franchise
 */
export async function getFranchiseLeads() {
  const user = await getCurrentDashboardUser()
  if (!user) throw new Error('Unauthorized')

  const admin = createAdminSupabaseClient()

  const membership =
    user.role === 'franchise_secretary'
      ? await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
          allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
        })
      : await getPreferredCompanyMembershipForProfile(admin, user.profileId)

  if (!membership) return []

  // Fetch leads linked to this company or its members
  // (Assuming a leads table exists with company_id or similar scoping)
  const { data: leads, error } = await admin
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return leads
}
