'use server'

import { revalidatePath } from 'next/cache'
import { createMediaFolder, deleteMediaFile, getMediaLibrarySnapshot, uploadMediaFiles } from '@/lib/media-admin'
import type { MediaLibrarySnapshot } from '@/lib/media-types'
import type { StorageProvider } from '@/lib/storage'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateMediaRoutes() {
  revalidatePath('/dashboard/media')
  revalidatePath('/dashboard/media-library')
}

export async function listMediaLibraryAction(provider: StorageProvider = 'auto'): Promise<ActionResult<MediaLibrarySnapshot>> {
  try {
    const data = await getMediaLibrarySnapshot(provider)
    return { success: true, message: 'Media library loaded.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to load media library.' }
  }
}

export async function uploadMediaFilesAction(formData: FormData): Promise<ActionResult<MediaLibrarySnapshot>> {
  try {
    const provider = String(formData.get('provider') ?? 'auto') as StorageProvider
    const folderPath = String(formData.get('folderPath') ?? 'media/uploads')
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0)

    await uploadMediaFiles(folderPath, files, provider)
    revalidateMediaRoutes()
    const data = await getMediaLibrarySnapshot(provider)
    return { success: true, message: files.length === 1 ? 'File uploaded successfully.' : `${files.length} files uploaded successfully.`, data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Upload failed.' }
  }
}

export async function createMediaFolderAction(parentFolder: string, folderName: string, provider: StorageProvider = 'auto'): Promise<ActionResult<MediaLibrarySnapshot>> {
  try {
    await createMediaFolder(parentFolder, folderName, provider)
    revalidateMediaRoutes()
    const data = await getMediaLibrarySnapshot(provider)
    return { success: true, message: 'Folder created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create folder.' }
  }
}

export async function deleteMediaFileAction(path: string, provider: StorageProvider = 'auto'): Promise<ActionResult<MediaLibrarySnapshot>> {
  try {
    await deleteMediaFile(path, provider)
    revalidateMediaRoutes()
    const data = await getMediaLibrarySnapshot(provider)
    return { success: true, message: 'File deleted.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete file.' }
  }
}