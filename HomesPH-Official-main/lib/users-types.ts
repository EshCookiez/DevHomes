import type { AccountStatus } from '@/lib/account-status'
import type { PrcStatus } from '@/lib/prc-status'

export interface UserRoleRecord {
  id: number
  role_name: string
  description: string | null
}

export interface ManagedUserRecord {
  id: string
  user_id: string
  fname: string | null
  mname: string | null
  lname: string | null
  full_name: string | null
  gender: string | null
  birthday: string | null
  profile_image_url: string | null
  prc_number: string | null
  prc_rejection_reason: string | null
  prc_reviewed_at: string | null
  prc_reviewed_by: string | null
  prc_status: PrcStatus
  role: string | null
  is_active: boolean | null
  account_status: AccountStatus
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  application_archived_at: string | null
  application_archive_reason: string | null
  archived_company_id: number | null
  archived_contact_email: string | null
  created_at: string | null
  updated_at: string | null
  email: string
  auth_created_at: string | null
  last_sign_in_at: string | null
}

export interface ManagedUserProfileInput {
  fname: string
  mname: string
  lname: string
  gender: string
  birthday: string
  role: string
}

export interface CreateManagedUserInput extends ManagedUserProfileInput {
  email: string
  password: string
}

export interface UsersDashboardData {
  users: ManagedUserRecord[]
  roles: UserRoleRecord[]
}
