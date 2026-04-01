import 'server-only'

import { canAccessDashboardAccount } from '@/lib/account-status'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserProfileWithAccountStateFallback } from '@/lib/auth/profile-query'
import { getRoleRouteSegment } from '@/lib/auth/roles'
import type { DashboardUser } from '@/lib/auth/types'
import { getProfileCompletionStatus } from '@/lib/profile-completion'
import { getEffectiveRolePermissionMap } from '@/lib/role-permissions-resolver'

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

  const roleSegment = getRoleRouteSegment(profile?.role)
  if (!profile || !roleSegment || !canAccessDashboardAccount(profile)) {
    return null
  }

  const dashboardPermissions = await getEffectiveRolePermissionMap(profile.role ?? '', roleSegment)

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
    role: profile.role ?? '',
    roleSegment,
    profileComplete: completion.isComplete,
    missingProfileFields: completion.missingFields,
    unreadInquiryCount: unreadInquiryResult.count ?? 0,
    dashboardPermissions,
  }
}
