'use server'

import { revalidatePath } from 'next/cache'
import {
  createListing,
  deleteListing,
  removeListingGalleryItem,
  reorderListingGallery,
  setListingFeatured,
  setListingStatus,
  updateListing,
  updateListingGalleryItem,
  uploadListingGalleryImage,
} from '@/lib/listings-admin'
import type {
  ListingGalleryInput,
  ListingGalleryRecord,
  ListingInput,
  ListingListRecord,
  ListingRecord,
} from '@/lib/listings-types'
import type { StorageProvider } from '@/lib/storage'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateListingSurfaces(id?: number) {
  revalidatePath('/dashboard/listings')
  if (id) {
    revalidatePath(`/dashboard/listings/${id}`)
  }
}

export async function createListingAction(input: ListingInput): Promise<ActionResult<ListingListRecord>> {
  try {
    const data = await createListing(input)
    revalidateListingSurfaces(data.id)
    return { success: true, message: 'Listing created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create listing.' }
  }
}

export async function updateListingAction(id: number, input: ListingInput): Promise<ActionResult<ListingRecord>> {
  try {
    const data = await updateListing(id, input)
    revalidateListingSurfaces(id)
    return { success: true, message: 'Listing updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update listing.' }
  }
}

export async function deleteListingAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteListing(id)
    revalidateListingSurfaces(id)
    return { success: true, message: 'Listing deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete listing.' }
  }
}

export async function setListingFeaturedAction(id: number, isFeatured: boolean): Promise<ActionResult<ListingRecord>> {
  try {
    const data = await setListingFeatured(id, isFeatured)
    revalidateListingSurfaces(id)
    return { success: true, message: isFeatured ? 'Listing featured.' : 'Listing unfeatured.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update feature status.' }
  }
}

export async function setListingStatusAction(id: number, status: 'draft' | 'published' | 'archived'): Promise<ActionResult<ListingRecord>> {
  try {
    const data = await setListingStatus(id, status)
    revalidateListingSurfaces(id)
    return { success: true, message: `Listing ${status}.`, data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update listing status.' }
  }
}

export async function uploadListingGalleryImageAction(formData: FormData): Promise<ActionResult<ListingGalleryRecord>> {
  try {
    const file = formData.get('file')
    const listingId = Number(formData.get('listingId'))
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider
    const title = String(formData.get('title') ?? '')
    const description = String(formData.get('description') ?? '')

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose an image to upload.')
    }

    const data = await uploadListingGalleryImage(listingId, file, provider, { title, description, display_order: '' })
    revalidateListingSurfaces(listingId)
    return { success: true, message: 'Gallery image uploaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to upload gallery image.' }
  }
}

export async function updateListingGalleryItemAction(listingId: number, galleryId: number, input: ListingGalleryInput): Promise<ActionResult<ListingGalleryRecord>> {
  try {
    const data = await updateListingGalleryItem(listingId, galleryId, input)
    revalidateListingSurfaces(listingId)
    return { success: true, message: 'Gallery item updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update gallery item.' }
  }
}

export async function reorderListingGalleryAction(listingId: number, galleryIds: number[]): Promise<ActionResult<number[]>> {
  try {
    const data = await reorderListingGallery(listingId, galleryIds)
    revalidateListingSurfaces(listingId)
    return { success: true, message: 'Gallery order updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to reorder gallery.' }
  }
}

export async function deleteListingGalleryItemAction(listingId: number, galleryId: number): Promise<ActionResult> {
  try {
    await removeListingGalleryItem(listingId, galleryId)
    revalidateListingSurfaces(listingId)
    return { success: true, message: 'Gallery image deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete gallery image.' }
  }
}