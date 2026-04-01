import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getRoleModuleDefinitions, getRolePermissionLevel, permissionLevelToActions, type DashboardModuleKey, type DashboardPermissionMap } from '@/lib/dashboard-permissions'

interface RolePermissionRow {
  page_key: DashboardModuleKey
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_manage: boolean
}

function isMissingPermissionsTable(message: string | undefined) {
  const normalized = message?.toLowerCase() ?? ''
  return normalized.includes('role_page_action_permissions') && (normalized.includes('does not exist') || normalized.includes('schema cache'))
}

function getDefaultRoleActions(roleSegment: string | null, pageKey: DashboardModuleKey) {
  return permissionLevelToActions(getRolePermissionLevel(roleSegment, pageKey))
}

function toPermissionMap(rows: RolePermissionRow[]): DashboardPermissionMap {
  return Object.fromEntries(rows.map((row) => [
    row.page_key,
    {
      view: row.can_view,
      create: row.can_create,
      edit: row.can_edit,
      delete: row.can_delete,
      manage: row.can_manage,
    },
  ])) as DashboardPermissionMap
}

export async function getEffectiveRolePermissionMap(roleName: string, roleSegment: string | null): Promise<DashboardPermissionMap> {
  if (!roleSegment) return {}

  const defaultEntries = getRoleModuleDefinitions(roleSegment).map((page) => [page.moduleKey, getDefaultRoleActions(roleSegment, page.moduleKey)] as const)
  const defaultMap = Object.fromEntries(defaultEntries) as DashboardPermissionMap

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('role_page_action_permissions')
    .select('page_key,can_view,can_create,can_edit,can_delete,can_manage')
    .eq('role_name', roleName)

  if (error) {
    if (isMissingPermissionsTable(error.message)) {
      return defaultMap
    }

    throw new Error(error.message)
  }

  return {
    ...defaultMap,
    ...toPermissionMap((data ?? []) as RolePermissionRow[]),
  }
}