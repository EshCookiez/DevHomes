import 'server-only'

import { getRoleRouteSegment } from '@/lib/auth/roles'
import { getRoleModuleDefinitions, getRolePermissionLevel, getSupportedDashboardActions, permissionLevelToActions, ROLE_META, type DashboardActionPermissions, type DashboardModuleKey } from '@/lib/dashboard-permissions'
import { requireSettingsAccess } from '@/lib/settings-admin'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { RolePermissionRoleRecord, RolePermissionSaveEntry } from '@/lib/role-permissions-types'

interface UserRoleRow {
  role_name: string
  description: string | null
}

interface RolePermissionRow {
  role_name: string
  page_key: DashboardModuleKey
  page_label: string
  page_path: string | null
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

function formatRoleLabel(roleName: string, roleSegment: string | null) {
  if (roleSegment && ROLE_META[roleSegment]) {
    return ROLE_META[roleSegment].label
  }

  return roleName.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getDefaultRoleActions(roleSegment: string | null, pageKey: DashboardModuleKey) {
  return permissionLevelToActions(getRolePermissionLevel(roleSegment, pageKey))
}

function applySupportedActions(pageKey: DashboardModuleKey, actions: DashboardActionPermissions): DashboardActionPermissions {
  const supported = getSupportedDashboardActions(pageKey)
  return {
    view: supported.view && actions.view,
    create: supported.create && actions.create,
    edit: supported.edit && actions.edit,
    delete: supported.delete && actions.delete,
    manage: supported.manage && actions.manage,
  }
}

export async function getRolePermissionSettings(): Promise<RolePermissionRoleRecord[]> {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const [rolesResult, permissionResult] = await Promise.all([
    supabase.from('user_roles').select('role_name,description').order('id', { ascending: true }),
    supabase
      .from('role_page_action_permissions')
      .select('role_name,page_key,page_label,page_path,can_view,can_create,can_edit,can_delete,can_manage')
      .order('role_name', { ascending: true })
      .order('page_label', { ascending: true }),
  ])

  if (rolesResult.error) {
    throw new Error(rolesResult.error.message)
  }

  if (permissionResult.error && !isMissingPermissionsTable(permissionResult.error.message)) {
    throw new Error(permissionResult.error.message)
  }

  const permissionRows = (permissionResult.error ? [] : permissionResult.data ?? []) as RolePermissionRow[]
  const permissionMap = new Map(permissionRows.map((row) => [`${row.role_name}:${row.page_key}`, row]))

  return ((rolesResult.data ?? []) as UserRoleRow[]).map((role) => {
    const roleSegment = getRoleRouteSegment(role.role_name)
    const pages = roleSegment ? getRoleModuleDefinitions(roleSegment) : []

    return {
      roleName: role.role_name,
      roleLabel: formatRoleLabel(role.role_name, roleSegment),
      roleSegment,
      description: role.description,
      pages: pages.map((page) => {
        const existing = permissionMap.get(`${role.role_name}:${page.moduleKey}`)
        return {
          pageKey: page.moduleKey,
          pageLabel: existing?.page_label ?? page.label,
          pagePath: existing?.page_path ?? page.href,
          actions: applySupportedActions(page.moduleKey, existing
            ? {
                view: existing.can_view,
                create: existing.can_create,
                edit: existing.can_edit,
                delete: existing.can_delete,
                manage: existing.can_manage,
              }
            : getDefaultRoleActions(roleSegment, page.moduleKey)),
          source: existing ? 'database' : 'default',
        }
      }),
    }
  })
}

export async function saveRolePermissionSettings(roleName: string, entries: RolePermissionSaveEntry[]) {
  await requireSettingsAccess()

  const roleSegment = getRoleRouteSegment(roleName)
  if (!roleSegment) {
    throw new Error('Unsupported role for dashboard permission settings.')
  }

  const availablePages = getRoleModuleDefinitions(roleSegment)
  const pageMap = new Map(availablePages.map((page) => [page.moduleKey, page]))

  const payload = entries
    .filter((entry) => pageMap.has(entry.pageKey))
    .map((entry) => {
      const page = pageMap.get(entry.pageKey)
      const supported = getSupportedDashboardActions(entry.pageKey)
      return {
        role_name: roleName,
        page_key: entry.pageKey,
        page_label: page?.label ?? entry.pageKey,
        page_path: page?.href ?? null,
        can_view: supported.view && entry.canView,
        can_create: supported.create && entry.canCreate,
        can_edit: supported.edit && entry.canEdit,
        can_delete: supported.delete && entry.canDelete,
        can_manage: supported.manage && entry.canManage,
      }
    })

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('role_page_action_permissions')
    .upsert(payload, { onConflict: 'role_name,page_key' })

  if (error) {
    if (isMissingPermissionsTable(error.message)) {
      throw new Error('The role_page_action_permissions table is not available in Supabase yet.')
    }

    throw new Error(error.message)
  }

  return { count: payload.length }
}