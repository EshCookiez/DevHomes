import type { DashboardPermissionMap } from '@/lib/dashboard-permissions'

export interface DashboardUser {
  userId: string
  profileId: string
  email: string
  fullName: string
  profileImageUrl: string | null
  role: string
  roleSegment: string
  profileComplete: boolean
  missingProfileFields: string[]
  unreadInquiryCount: number
  dashboardPermissions: DashboardPermissionMap
}

export interface LoginFormState {
  error: string | null
}
