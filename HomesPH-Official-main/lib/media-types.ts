import type { StorageProvider } from '@/lib/storage'

export type MediaViewMode = 'grid' | 'list'
export type MediaFileFilter = 'all' | 'images' | 'documents' | 'videos'

export interface MediaFileRecord {
  id: string
  path: string
  name: string
  folder: string
  extension: string
  size: number
  uploadedAt: string | null
  url: string
  mimeType: string | null
  provider: Exclude<StorageProvider, 'auto'>
  category: 'image' | 'document' | 'video' | 'other'
  previewable: boolean
}

export interface MediaFolderRecord {
  path: string
  name: string
  parentPath: string | null
  fileCount: number
}

export interface MediaLibrarySnapshot {
  provider: Exclude<StorageProvider, 'auto'>
  files: MediaFileRecord[]
  folders: MediaFolderRecord[]
  rootFolders: MediaFolderRecord[]
}