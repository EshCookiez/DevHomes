'use server'

import { revalidatePath } from 'next/cache'
import {
  createAmenity,
  createContentLocation,
  createPropertyType,
  deleteAmenity,
  deleteContentLocation,
  deletePropertyType,
  toggleContentLocationStatus,
  updateAmenity,
  updateContentLocation,
  updatePropertyType,
} from '@/lib/content-admin'
import type { AmenityInput, AmenityRecord, LocationInput, LocationRecord, PropertyTypeInput, PropertyTypeRecord } from '@/lib/content-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateContentRoutes() {
  revalidatePath('/dashboard/amenities')
  revalidatePath('/dashboard/property-types')
  revalidatePath('/dashboard/locations')
  revalidatePath('/dashboard/settings')
}

export async function createAmenityAction(input: AmenityInput): Promise<ActionResult<AmenityRecord>> {
  try {
    const data = await createAmenity(input)
    revalidateContentRoutes()
    return { success: true, message: 'Amenity created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create amenity.' }
  }
}

export async function updateAmenityAction(id: number, input: AmenityInput): Promise<ActionResult<AmenityRecord>> {
  try {
    const data = await updateAmenity(id, input)
    revalidateContentRoutes()
    return { success: true, message: 'Amenity updated successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update amenity.' }
  }
}

export async function deleteAmenityAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteAmenity(id)
    revalidateContentRoutes()
    return { success: true, message: 'Amenity deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete amenity.' }
  }
}

export async function createPropertyTypeAction(input: PropertyTypeInput): Promise<ActionResult<PropertyTypeRecord>> {
  try {
    const data = await createPropertyType(input)
    revalidateContentRoutes()
    return { success: true, message: 'Property type created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create property type.' }
  }
}

export async function updatePropertyTypeAction(id: number, input: PropertyTypeInput): Promise<ActionResult<PropertyTypeRecord>> {
  try {
    const data = await updatePropertyType(id, input)
    revalidateContentRoutes()
    return { success: true, message: 'Property type updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update property type.' }
  }
}

export async function deletePropertyTypeAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deletePropertyType(id)
    revalidateContentRoutes()
    return { success: true, message: 'Property type deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete property type.' }
  }
}

function getLocationInput(formData: FormData): LocationInput {
  return {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    logo_url: String(formData.get('logo_url') ?? '') || null,
    description: String(formData.get('description') ?? '') || null,
    meta_title: String(formData.get('meta_title') ?? '') || null,
    meta_description: String(formData.get('meta_description') ?? '') || null,
    meta_keywords: String(formData.get('meta_keywords') ?? '') || null,
    is_active: String(formData.get('is_active') ?? 'true') === 'true',
  }
}

export async function createLocationAction(formData: FormData): Promise<ActionResult<LocationRecord>> {
  try {
    const file = formData.get('logo')
    const data = await createContentLocation(getLocationInput(formData), file instanceof File && file.size > 0 ? file : null)
    revalidateContentRoutes()
    return { success: true, message: 'Location created.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create location.' }
  }
}

export async function updateLocationAction(id: number, formData: FormData): Promise<ActionResult<LocationRecord>> {
  try {
    const file = formData.get('logo')
    const data = await updateContentLocation(id, getLocationInput(formData), file instanceof File && file.size > 0 ? file : null)
    revalidateContentRoutes()
    return { success: true, message: 'Location updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update location.' }
  }
}

export async function toggleLocationStatusAction(id: number, isActive: boolean): Promise<ActionResult<LocationRecord>> {
  try {
    const data = await toggleContentLocationStatus(id, isActive)
    revalidateContentRoutes()
    return { success: true, message: `Location ${isActive ? 'activated' : 'deactivated'}.`, data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update location status.' }
  }
}

export async function deleteLocationAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteContentLocation(id)
    revalidateContentRoutes()
    return { success: true, message: 'Location deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete location.' }
  }
}