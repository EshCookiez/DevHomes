import 'server-only'

import { canAccessDashboardAccount } from '@/lib/account-status'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getUserProfileWithAccountStateFallback } from '@/lib/auth/profile-query'
import { getRoleRouteSegment } from '@/lib/auth/roles'
import type { DashboardUser } from '@/lib/auth/types'
import { getProfileCompletionStatus } from '@/lib/profile-completion'
import { getEffectiveRolePermissionMap } from '@/lib/role-permissions-resolver'
import {
  getCompanySystemRolePriority,
  isSecretaryCompanyRole,
  normalizeCompanySystemRole,
} from '@/lib/company-members'

interface UserProfileRow {
  id: string
  fname: string | null
  lname: string | null
  full_name: string | null
  profile_image_url: string | null
  role: string | null
  birthday: string | null
  account_status: string | null
  is_active: boolean | null
}

interface ContactRow {
  primary_mobile: string | null
}

interface MembershipRow {
  company_id: number
  system_role: string | null
}

interface MembershipCompanyRow {
  id: number
  parent_company_id: number | null
}

function hasPersistedProfileCompletionSkip(metadata: UserProfileMetadata | undefined) {
  const value = metadata?.profile_completion_skipped
  return value === true || value === 'true' || value === 1 || value === '1'
}

type UserProfileMetadata = {
  profile_completion_skipped?: boolean | string | number | null
}

export async function getCurrentDashboardUser(): Promise<DashboardUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile } = await getUserProfileWithAccountStateFallback<Omit<UserProfileRow, 'is_active' | 'account_status'>>({
    supabase,
    userId: user.id,
    selectWithAccountState: 'id,fname,lname,full_name,profile_image_url,role,birthday,is_active,account_status',
    selectWithoutAccountState: 'id,fname,lname,full_name,profile_image_url,role,birthday,is_active',
  })

  const admin = createAdminSupabaseClient()
  let organizationRole: string | null = null

  if (profile?.id) {
    const { data: memberships, error: membershipsError } = await admin
      .from('company_members')
      .select('company_id, system_role')
      .eq('user_profile_id', profile.id)
      .returns<MembershipRow[]>()

    if (membershipsError) {
      throw new Error(membershipsError.message)
    }

    const companyIds = [...new Set((memberships ?? []).map((membership) => membership.company_id).filter(Boolean))]
    const { data: membershipCompanies, error: membershipCompaniesError } = companyIds.length
      ? await admin
          .from('company_profiles')
          .select('id, parent_company_id')
          .in('id', companyIds)
          .returns<MembershipCompanyRow[]>()
      : { data: [], error: null }

    if (membershipCompaniesError) {
      throw new Error(membershipCompaniesError.message)
    }

    const companyMap = new Map((membershipCompanies ?? []).map((company) => [company.id, company]))
    const prioritizedMembership = [...(memberships ?? [])]
      .sort((left, right) => {
        const leftCompany = companyMap.get(left.company_id)
        const rightCompany = companyMap.get(right.company_id)
        return (
          getCompanySystemRolePriority(left.system_role, Boolean(leftCompany?.parent_company_id)) -
          getCompanySystemRolePriority(right.system_role, Boolean(rightCompany?.parent_company_id))
        )
      })[0]

    if (prioritizedMembership) {
      const prioritizedCompany = companyMap.get(prioritizedMembership.company_id)
      organizationRole = normalizeCompanySystemRole(prioritizedMembership.system_role, {
        officeIsSuboffice: Boolean(prioritizedCompany?.parent_company_id),
      })
    }
  }

  const appRole = profile?.role ?? ''
  const effectiveRole =
    organizationRole === 'owner'
      ? 'franchise'
      : appRole === 'salesperson' && isSecretaryCompanyRole(organizationRole)
        ? 'franchise_secretary'
        : appRole

  const roleSegment = getRoleRouteSegment(effectiveRole)
  if (!profile || !roleSegment || !canAccessDashboardAccount(profile)) {
    return null
  }

  const dashboardPermissions = await getEffectiveRolePermissionMap(effectiveRole, roleSegment)

  const { data: contact } = await supabase
    .from('contact_information')
    .select('primary_mobile')
    .eq('user_profile_id', profile.id)
    .maybeSingle<ContactRow>()

  const fullName = profile.full_name?.trim() || [profile.fname, profile.lname].filter(Boolean).join(' ') || user.email || 'HomesPH User'
  const completion = getProfileCompletionStatus(profile, {
    primary_mobile: contact?.primary_mobile ?? null,
  })

  const unreadInquiryCount = ['super_admin', 'admin'].includes(profile.role ?? '')
    ? (() => {
      return supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread')
    })()
    : Promise.resolve({ count: 0, error: null })

  const unreadInquiryResult = await unreadInquiryCount

  return {
    userId: user.id,
    profileId: profile.id,
    email: user.email ?? '',
    fullName,
    profileImageUrl: profile.profile_image_url,
    appRole,
    organizationRole,
    role: effectiveRole,
    roleSegment,
    profileComplete: completion.isComplete,
    profileCompletionSkipped: hasPersistedProfileCompletionSkip(user.user_metadata as UserProfileMetadata | undefined),
    missingProfileFields: completion.missingFields,
    unreadInquiryCount: unreadInquiryResult.count ?? 0,
    dashboardPermissions,
  }
}
