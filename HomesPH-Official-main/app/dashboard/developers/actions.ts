'use server'

import { revalidatePath } from 'next/cache'
import {
  createDeveloper,
  deleteDeveloper,
  removeDeveloperAddress,
  removeDeveloperContact,
  saveDeveloperAddress,
  saveDeveloperContact,
  setDeveloperActive,
  updateDeveloper,
  uploadDeveloperLogo,
} from '@/lib/developers-admin'
import type {
  DeveloperAddressInput,
  DeveloperAddressRecord,
  DeveloperContactInput,
  DeveloperContactPersonRecord,
  DeveloperFormInput,
  ManagedDeveloperRecord,
} from '@/lib/developers-types'
import type { StorageProvider } from '@/lib/storage'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateDeveloperSurfaces(id?: number) {
  revalidatePath('/dashboard/developers')
  if (id) {
    revalidatePath(`/dashboard/developers/${id}`)
  }
}

export async function createDeveloperAction(input: DeveloperFormInput): Promise<ActionResult<ManagedDeveloperRecord>> {
  try {
    const data = await createDeveloper(input)
    revalidateDeveloperSurfaces(data.id)
    return { success: true, message: 'Developer created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create developer.' }
  }
}

export async function updateDeveloperAction(id: number, input: DeveloperFormInput): Promise<ActionResult<ManagedDeveloperRecord>> {
  try {
    const data = await updateDeveloper(id, input)
    revalidateDeveloperSurfaces(id)
    return { success: true, message: 'Developer updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update developer.' }
  }
}

export async function uploadDeveloperLogoAction(formData: FormData): Promise<ActionResult<ManagedDeveloperRecord>> {
  try {
    const file = formData.get('file')
    const developerId = Number(formData.get('developerId'))
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose a logo to upload.')
    }

    if (!Number.isFinite(developerId) || developerId <= 0) {
      throw new Error('Developer ID is required for logo upload.')
    }

    const data = await uploadDeveloperLogo(developerId, file, provider)
    revalidateDeveloperSurfaces(developerId)
    return { success: true, message: 'Developer logo uploaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to upload logo.' }
  }
}

export async function setDeveloperStatusAction(id: number, isActive: boolean): Promise<ActionResult<ManagedDeveloperRecord>> {
  try {
    const data = await setDeveloperActive(id, isActive)
    revalidateDeveloperSurfaces(id)
    return { success: true, message: isActive ? 'Developer activated.' : 'Developer deactivated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update developer status.' }
  }
}

export async function deleteDeveloperAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteDeveloper(id)
    revalidateDeveloperSurfaces(id)
    return { success: true, message: 'Developer deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete developer.' }
  }
}

export async function saveDeveloperContactAction(developerId: number, contactId: number | null, input: DeveloperContactInput): Promise<ActionResult<DeveloperContactPersonRecord>> {
  try {
    const data = await saveDeveloperContact(developerId, contactId, input)
    revalidateDeveloperSurfaces(developerId)
    return { success: true, message: contactId ? 'Contact person updated.' : 'Contact person added.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save contact person.' }
  }
}

export async function deleteDeveloperContactAction(developerId: number, contactId: number): Promise<ActionResult> {
  try {
    await removeDeveloperContact(developerId, contactId)
    revalidateDeveloperSurfaces(developerId)
    return { success: true, message: 'Contact person deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete contact person.' }
  }
}

export async function saveDeveloperAddressAction(developerId: number, addressId: number | null, input: DeveloperAddressInput): Promise<ActionResult<DeveloperAddressRecord>> {
  try {
    const data = await saveDeveloperAddress(developerId, addressId, input)
    revalidateDeveloperSurfaces(developerId)
    return { success: true, message: addressId ? 'Address updated.' : 'Address added.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save address.' }
  }
}

export async function deleteDeveloperAddressAction(developerId: number, addressId: number): Promise<ActionResult> {
  try {
    await removeDeveloperAddress(developerId, addressId)
    revalidateDeveloperSurfaces(developerId)
    return { success: true, message: 'Address deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete address.' }
  }
}