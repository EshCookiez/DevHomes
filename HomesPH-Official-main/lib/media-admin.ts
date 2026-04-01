import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createStorageFolder, deletePublicFile, listPublicFiles, type StorageProvider, uploadPublicFile } from '@/lib/storage'
import type { MediaFileRecord, MediaFolderRecord, MediaLibrarySnapshot } from '@/lib/media-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg'])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov'])
const DEFAULT_UPLOAD_FOLDER = 'media/uploads'

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function getExtension(name: string) {
  return name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : ''
}

function categorizeFile(name: string, mimeType: string | null) {
  const extension = getExtension(name)
  if (mimeType?.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (mimeType?.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) return 'video'
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document'
  return 'other'
}

function toFileRecord(file: { path: string; name: string; size: number; contentType: string | null; lastModified: string | null; publicUrl: string }, provider: 'supabase' | 's3'): MediaFileRecord {
  const normalizedPath = trimSlashes(file.path)
  const segments = normalizedPath.split('/')
  const category = categorizeFile(file.name, file.contentType)
  return {
    id: `${provider}:${normalizedPath}`,
    path: normalizedPath,
    name: file.name,
    folder: segments.slice(0, -1).join('/'),
    extension: getExtension(file.name),
    size: file.size,
    uploadedAt: file.lastModified,
    url: file.publicUrl,
    mimeType: file.contentType,
    provider,
    category,
    previewable: category === 'image',
  }
}

function buildFolderTree(folderPaths: Array<{ path: string; name: string }>, files: MediaFileRecord[]) {
  const counts = new Map<string, number>()

  for (const file of files) {
    const segments = file.folder.split('/').filter(Boolean)
    for (let index = 0; index < segments.length; index += 1) {
      const current = segments.slice(0, index + 1).join('/')
      counts.set(current, (counts.get(current) ?? 0) + 1)
    }
  }

  const folders: MediaFolderRecord[] = folderPaths.map((folder) => {
    const normalized = trimSlashes(folder.path)
    const parts = normalized.split('/')
    return {
      path: normalized,
      name: folder.name,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
      fileCount: counts.get(normalized) ?? 0,
    }
  }).sort((left, right) => left.path.localeCompare(right.path))

  return {
    folders,
    rootFolders: folders.filter((folder) => !folder.parentPath),
  }
}

function sanitizeFolderPath(parentFolder: string, folderName: string) {
  const normalizedParent = trimSlashes(parentFolder)
  const normalizedName = trimSlashes(folderName)
  if (!normalizedName) {
    throw new Error('Folder name is required.')
  }

  const safeName = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '')

  if (!safeName) {
    throw new Error('Folder name contains unsupported characters.')
  }

  return [normalizedParent, safeName].filter(Boolean).join('/')
}

function sanitizeUploadFolder(folderPath: string) {
  const normalized = trimSlashes(folderPath)
  return normalized || DEFAULT_UPLOAD_FOLDER
}

function buildUploadPath(folderPath: string, fileName: string) {
  const normalizedFolder = sanitizeUploadFolder(folderPath)
  const sanitizedFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')

  const dotIndex = sanitizedFileName.lastIndexOf('.')
  const namePart = dotIndex > 0 ? sanitizedFileName.slice(0, dotIndex) : sanitizedFileName
  const extensionPart = dotIndex > 0 ? sanitizedFileName.slice(dotIndex) : ''
  const uniqueName = `${namePart || 'file'}-${Date.now()}${extensionPart}`
  return `${normalizedFolder}/${uniqueName}`
}

export async function requireMediaAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getMediaLibrarySnapshot(provider: StorageProvider = 'auto'): Promise<MediaLibrarySnapshot> {
  await requireMediaAccess()
  const listing = await listPublicFiles(provider)
  const files = listing.files.map((file) => toFileRecord(file, listing.provider))
  const { folders, rootFolders } = buildFolderTree(listing.folders, files)

  return {
    provider: listing.provider,
    files,
    folders,
    rootFolders,
  }
}

export async function createMediaFolder(parentFolder: string, folderName: string, provider: StorageProvider = 'auto') {
  await requireMediaAccess()
  const path = sanitizeFolderPath(parentFolder, folderName)
  await createStorageFolder(path, provider)
  return path
}

export async function uploadMediaFiles(folderPath: string, files: File[], provider: StorageProvider = 'auto') {
  await requireMediaAccess()

  if (files.length === 0) {
    throw new Error('Please select at least one file to upload.')
  }

  const uploaded = await Promise.all(files.map(async (file) => {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error('One of the selected files is invalid.')
    }

    const path = buildUploadPath(folderPath, file.name)
    const url = await uploadPublicFile({ file, path, cacheControl: '3600', upsert: false, provider })
    return { path, url }
  }))

  return uploaded
}

export async function deleteMediaFile(path: string, provider: StorageProvider = 'auto') {
  await requireMediaAccess()
  const normalizedPath = trimSlashes(path)
  if (!normalizedPath) {
    throw new Error('File path is required.')
  }
  await deletePublicFile(normalizedPath, provider)
  return normalizedPath
}