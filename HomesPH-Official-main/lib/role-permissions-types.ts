import type { DashboardActionKey, DashboardModuleKey } from '@/lib/dashboard-permissions'

export type RoleActionFlags = Record<DashboardActionKey, boolean>

export interface RolePermissionMatrixEntry {
  pageKey: DashboardModuleKey
  pageLabel: string
  pagePath: string
  actions: RoleActionFlags
  source: 'default' | 'database'
}

export interface RolePermissionRoleRecord {
  roleName: string
  roleLabel: string
  roleSegment: string | null
  description: string | null
  pages: RolePermissionMatrixEntry[]
}

export interface RolePermissionSaveEntry {
  pageKey: DashboardModuleKey
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManage: boolean
}