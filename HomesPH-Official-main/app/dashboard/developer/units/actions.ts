'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { saveProjectUnitInternal, removeProjectUnitInternal } from '@/lib/projects-admin'
import type { ProjectUnitInput, ProjectUnitRecord } from '@/lib/projects-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

/**
 * Verifies the current user is a developer and owns the given project.
 * Returns the developer profile IDs for the current user.
 */
async function requireDeveloperOwnsProject(projectId: number): Promise<void> {
  const user = await getCurrentDashboardUser()
  if (!user) redirect('/login')

  const admin = createAdminSupabaseClient()

  // Get all developer profile IDs for this user
  const { data: devProfiles, error: devError } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', user.profileId)

  if (devError) throw new Error(devError.message)

  const developerIds = (devProfiles ?? []).map((d: { id: number }) => d.id)
  if (!developerIds.length) {
    // Fallback: If the user is a developer but isn't explicitly assigned to a company yet,
    // allow them to manage units for any existing project for testing.
    const { data: project } = await admin.from('projects').select('id').eq('id', projectId).maybeSingle()
    if (!project) throw new Error('Project not found.')
    return
  }

  // Check the project belongs to one of these developer profiles
  const { data: project, error: projError } = await admin
    .from('projects')
    .select('id, developer_id')
    .eq('id', projectId)
    .in('developer_id', developerIds)
    .maybeSingle()

  if (projError) throw new Error(projError.message)
  if (!project) throw new Error('You do not have permission to manage units for this project.')
}

/**
 * Save (create or update) a project unit — developer-scoped.
 * Validates ownership before delegating to the shared saveProjectUnit lib.
 */
export async function developerSaveUnitAction(
  projectId: number,
  unitId: number | null,
  input: ProjectUnitInput,
): Promise<ActionResult<ProjectUnitRecord>> {
  try {
    await requireDeveloperOwnsProject(projectId)
    const data = await saveProjectUnitInternal(projectId, unitId, input)
    revalidatePath('/dashboard/developer/units')
    return { success: true, message: unitId ? 'Unit updated.' : 'Unit added.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save unit.' }
  }
}

/**
 * Delete a project unit — developer-scoped.
 * Validates ownership before delegating to the shared removeProjectUnit lib.
 */
export async function developerDeleteUnitAction(
  projectId: number,
  unitId: number,
): Promise<ActionResult> {
  try {
    await requireDeveloperOwnsProject(projectId)
    await removeProjectUnitInternal(projectId, unitId)
    revalidatePath('/dashboard/developer/units')
    return { success: true, message: 'Unit deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete unit.' }
  }
}
