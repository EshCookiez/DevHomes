'use server'

import { revalidatePath } from 'next/cache'
import { saveRolePermissionSettings } from '@/lib/role-permissions-admin'
import type { RolePermissionSaveEntry } from '@/lib/role-permissions-types'

interface ActionResult {
  success: boolean
  message: string
}

export async function saveRolePermissionsAction(roleName: string, entries: RolePermissionSaveEntry[]): Promise<ActionResult> {
  try {
    const result = await saveRolePermissionSettings(roleName, entries)
    revalidatePath('/dashboard/role-permissions')
    return {
      success: true,
      message: `Saved ${result.count} page permission rows for ${roleName.replace(/_/g, ' ')}.`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to save role permissions.',
    }
  }
}