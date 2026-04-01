'use server'

import { revalidatePath } from 'next/cache'
import { createLocation, deleteLocation, updateLocation, updateSiteSetting, uploadLocationLogo } from '@/lib/settings-admin'
import type { SettingPrimitive, SiteLocationInput, SiteLocationRecord } from '@/lib/settings-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateSettingsSurfaces() {
  revalidatePath('/dashboard/settings')
  revalidatePath('/')
  revalidatePath('/login')
}

export async function saveSettingsAction(entries: Array<{
  key: string
  value: SettingPrimitive | string[] | Record<string, unknown>
  description?: string | null
  category?: string | null
}>): Promise<ActionResult> {
  try {
    for (const entry of entries) {
      await updateSiteSetting(entry)
    }

    revalidateSettingsSurfaces()
    return { success: true, message: 'Settings saved successfully.' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to save settings.',
    }
  }
}

export async function createLocationAction(input: SiteLocationInput): Promise<ActionResult<SiteLocationRecord>> {
  try {
    const data = await createLocation(input)
    revalidateSettingsSurfaces()
    return { success: true, message: 'Location created.', data }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to create location.',
    }
  }
}

export async function uploadLocationLogoAction(formData: FormData): Promise<ActionResult<{ logoUrl: string }>> {
  try {
    const file = formData.get('file')
    const slug = String(formData.get('slug') ?? '')

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose an image to upload.')
    }

    if (!slug.trim()) {
      throw new Error('A location slug is required before uploading a logo.')
    }

    const data = await uploadLocationLogo(file, slug)
    return { success: true, message: 'Logo uploaded successfully.', data }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to upload logo.',
    }
  }
}

export async function updateLocationAction(id: number, input: SiteLocationInput): Promise<ActionResult<SiteLocationRecord>> {
  try {
    const data = await updateLocation(id, input)
    revalidateSettingsSurfaces()
    return { success: true, message: 'Location updated.', data }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to update location.',
    }
  }
}

export async function toggleLocationStatusAction(id: number, input: SiteLocationInput): Promise<ActionResult<SiteLocationRecord>> {
  try {
    const data = await updateLocation(id, input)
    revalidateSettingsSurfaces()
    return {
      success: true,
      message: data.is_active ? 'Location activated.' : 'Location deactivated.',
      data,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to change location status.',
    }
  }
}

export async function deleteLocationAction(id: number): Promise<ActionResult> {
  try {
    await deleteLocation(id)
    revalidateSettingsSurfaces()
    return { success: true, message: 'Location deleted.' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to delete location.',
    }
  }
}
