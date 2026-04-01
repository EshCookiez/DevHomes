'use server'

import { revalidatePath } from 'next/cache'
import {
  createProject,
  deleteProject,
  removeProjectAttachment,
  removeProjectFaq,
  removeProjectGalleryItem,
  removeProjectUnit,
  reorderProjectGallery,
  saveProjectFaq,
  saveProjectUnit,
  updateProject,
  updateProjectAmenities,
  updateProjectGalleryItem,
  uploadProjectAttachment,
  uploadProjectGalleryImage,
  uploadProjectMainImage,
} from '@/lib/projects-admin'
import type {
  ProjectAttachmentRecord,
  ProjectFaqInput,
  ProjectFaqRecord,
  ProjectGalleryInput,
  ProjectGalleryRecord,
  ProjectInput,
  ProjectListRecord,
  ProjectRecord,
  ProjectUnitInput,
  ProjectUnitRecord,
} from '@/lib/projects-types'
import type { StorageProvider } from '@/lib/storage'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateProjectSurfaces(id?: number) {
  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/developer/projects')
  if (id) {
    revalidatePath(`/dashboard/projects/${id}`)
    revalidatePath(`/dashboard/developer/projects/${id}`)
  }
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult<ProjectListRecord>> {
  try {
    const data = await createProject(input)
    revalidateProjectSurfaces(data.id)
    return { success: true, message: 'Project created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create project.' }
  }
}

export async function updateProjectAction(id: number, input: ProjectInput): Promise<ActionResult<ProjectRecord>> {
  try {
    const data = await updateProject(id, input)
    revalidateProjectSurfaces(id)
    return { success: true, message: 'Project updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update project.' }
  }
}

export async function uploadProjectMainImageAction(formData: FormData): Promise<ActionResult<ProjectRecord>> {
  try {
    const file = formData.get('file')
    const projectId = Number(formData.get('projectId'))
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose an image to upload.')
    }

    const data = await uploadProjectMainImage(projectId, file, provider)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Main image uploaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to upload main image.' }
  }
}

export async function deleteProjectAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteProject(id)
    revalidateProjectSurfaces(id)
    return { success: true, message: 'Project deleted successfully.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete project.' }
  }
}

export async function saveProjectUnitAction(projectId: number, unitId: number | null, input: ProjectUnitInput): Promise<ActionResult<ProjectUnitRecord>> {
  try {
    const data = await saveProjectUnit(projectId, unitId, input)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: unitId ? 'Unit updated.' : 'Unit added.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save unit.' }
  }
}

export async function deleteProjectUnitAction(projectId: number, unitId: number): Promise<ActionResult> {
  try {
    await removeProjectUnit(projectId, unitId)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Unit deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete unit.' }
  }
}

export async function updateProjectAmenitiesAction(projectId: number, amenityIds: number[]): Promise<ActionResult<number[]>> {
  try {
    const data = await updateProjectAmenities(projectId, amenityIds)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Amenities updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update amenities.' }
  }
}

export async function uploadProjectGalleryImageAction(formData: FormData): Promise<ActionResult<ProjectGalleryRecord>> {
  try {
    const file = formData.get('file')
    const projectId = Number(formData.get('projectId'))
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider
    const title = String(formData.get('title') ?? '')
    const description = String(formData.get('description') ?? '')

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose an image to upload.')
    }

    const data = await uploadProjectGalleryImage(projectId, file, provider, { title, description, display_order: '' })
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Gallery image uploaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to upload gallery image.' }
  }
}

export async function updateProjectGalleryItemAction(projectId: number, galleryId: number, input: ProjectGalleryInput): Promise<ActionResult<ProjectGalleryRecord>> {
  try {
    const data = await updateProjectGalleryItem(projectId, galleryId, input)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Gallery item updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update gallery item.' }
  }
}

export async function reorderProjectGalleryAction(projectId: number, galleryIds: number[]): Promise<ActionResult<number[]>> {
  try {
    const data = await reorderProjectGallery(projectId, galleryIds)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Gallery order updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to reorder gallery.' }
  }
}

export async function deleteProjectGalleryItemAction(projectId: number, galleryId: number): Promise<ActionResult> {
  try {
    await removeProjectGalleryItem(projectId, galleryId)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Gallery image deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete gallery image.' }
  }
}

export async function uploadProjectAttachmentAction(formData: FormData): Promise<ActionResult<ProjectAttachmentRecord>> {
  try {
    const file = formData.get('file')
    const projectId = Number(formData.get('projectId'))
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider
    const fileName = String(formData.get('fileName') ?? '')
    const documentType = String(formData.get('documentType') ?? '')

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Please choose a file to upload.')
    }

    const data = await uploadProjectAttachment(projectId, file, provider, fileName, documentType)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Document uploaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to upload document.' }
  }
}

export async function deleteProjectAttachmentAction(projectId: number, attachmentId: string): Promise<ActionResult> {
  try {
    await removeProjectAttachment(projectId, attachmentId)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'Document deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete document.' }
  }
}

export async function saveProjectFaqAction(projectId: number, faqId: number | null, input: ProjectFaqInput): Promise<ActionResult<ProjectFaqRecord>> {
  try {
    const data = await saveProjectFaq(projectId, faqId, input)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: faqId ? 'FAQ updated.' : 'FAQ added.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to save FAQ.' }
  }
}

export async function deleteProjectFaqAction(projectId: number, faqId: number): Promise<ActionResult> {
  try {
    await removeProjectFaq(projectId, faqId)
    revalidateProjectSurfaces(projectId)
    return { success: true, message: 'FAQ deleted.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete FAQ.' }
  }
}