'use server'

import { revalidatePath } from 'next/cache'
import { createAmenity, updateAmenity, deleteAmenity, requireContentAccess } from '@/lib/content-admin'
import type { AmenityInput, AmenityRecord } from '@/lib/content-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

export async function createAmenityAction(input: AmenityInput): Promise<ActionResult<AmenityRecord>> {
  try {
    const data = await createAmenity(input)
    revalidatePath('/dashboard/developer/amenities')
    revalidatePath('/dashboard/amenities')
    return { success: true, message: 'Amenity created.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create amenity.' }
  }
}

export async function updateAmenityAction(id: number, input: AmenityInput): Promise<ActionResult<AmenityRecord>> {
  try {
    const data = await updateAmenity(id, input)
    revalidatePath('/dashboard/developer/amenities')
    revalidatePath('/dashboard/amenities')
    return { success: true, message: 'Amenity updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update amenity.' }
  }
}

export async function deleteAmenityAction(id: number): Promise<ActionResult> {
  try {
    await requireContentAccess()
    await deleteAmenity(id)
    revalidatePath('/dashboard/developer/amenities')
    revalidatePath('/dashboard/amenities')
    return { success: true, message: 'Amenity deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete amenity.' }
  }
}
