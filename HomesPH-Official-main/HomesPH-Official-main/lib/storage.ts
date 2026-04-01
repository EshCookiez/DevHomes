import 'server-only'

import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export type StorageProvider = 'auto' | 'supabase' | 's3'
export type ResolvedStorageProvider = Exclude<StorageProvider, 'auto'>

export interface StorageListFile {
  path: string
  name: string
  size: number
  contentType: string | null
  lastModified: string | null
  publicUrl: string
}

export interface StorageListFolder {
  path: string
  name: string
}

export interface StorageListingResult {
  provider: ResolvedStorageProvider
  files: StorageListFile[]
  folders: StorageListFolder[]
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export function getStorageBucket() {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET

  if (!bucket) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.')
  }

  return bucket
}

export function getS3Config() {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT
  const region = process.env.NEXT_PUBLIC_S3_REGION || 'auto'
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY

  if (!bucket || !endpoint) {
    return null
  }

  if (!accessKeyId || !secretAccessKey) {
    return {
      bucket,
      endpoint,
      region,
      accessKeyId: null,
      secretAccessKey: null,
    }
  }

  return {
    bucket,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
  }
}

function normalizeUrlPart(value: string) {
  return value.replace(/\/+$/, '')
}

export function getS3PublicUrl(endpoint: string, bucket: string, path: string) {
  const normalizedEndpoint = normalizeUrlPart(endpoint)
  const normalizedPath = path.replace(/^\/+/, '')
  return `${normalizedEndpoint}/${bucket}/${normalizedPath}`
}

export function resolveStorageProvider(provider: StorageProvider): ResolvedStorageProvider {
  if (provider !== 'auto') {
    return provider
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET) {
    return 'supabase'
  }

  if (getS3Config()) {
    return 's3'
  }

  throw new Error('No supported storage provider is configured.')
}

export function getPublicFileUrl(path: string, provider: StorageProvider = 'auto') {
  const resolvedProvider = resolveStorageProvider(provider)

  if (resolvedProvider === 's3') {
    const s3 = getS3Config()
    if (!s3) {
      throw new Error('S3 storage is not configured.')
    }

    return getS3PublicUrl(s3.endpoint, s3.bucket, path)
  }

  const bucket = getStorageBucket()
  const admin = createAdminSupabaseClient()
  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function splitPath(path: string) {
  return path.split('/').filter(Boolean)
}

function toFolderName(path: string) {
  const segments = splitPath(path)
  return segments[segments.length - 1] ?? path
}

function addFolderPath(map: Map<string, StorageListFolder>, path: string) {
  const normalized = path.replace(/^\/+|\/+$/g, '')
  if (!normalized) return
  if (!map.has(normalized)) {
    map.set(normalized, { path: normalized, name: toFolderName(normalized) })
  }
}

function addAncestorFolders(map: Map<string, StorageListFolder>, path: string) {
  const segments = splitPath(path)
  for (let index = 0; index < segments.length - 1; index += 1) {
    addFolderPath(map, segments.slice(0, index + 1).join('/'))
  }
}

function normalizePrefix(prefix: string) {
  return prefix.replace(/^\/+|\/+$/g, '')
}

function isPlaceholderFile(path: string) {
  return path.endsWith('/.keep') || path === '.keep'
}

async function listSupabaseFolderRecursive(prefix: string, folders: Map<string, StorageListFolder>, files: StorageListFile[]) {
  const admin = createAdminSupabaseClient()
  const bucket = getStorageBucket()
  const { data, error } = await admin.storage.from(bucket).list(prefix || undefined, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) {
    throw new Error(error.message)
  }

  for (const entry of (data ?? []) as Array<{ name: string; id?: string | null; updated_at?: string | null; created_at?: string | null; metadata?: { size?: number; mimetype?: string } | null }>) {
    const entryPath = [prefix, entry.name].filter(Boolean).join('/')
    const hasFileMetadata = Boolean(entry.id) || typeof entry.metadata?.size === 'number' || typeof entry.metadata?.mimetype === 'string'

    if (!hasFileMetadata) {
      addFolderPath(folders, entryPath)
      await listSupabaseFolderRecursive(entryPath, folders, files)
      continue
    }

    if (isPlaceholderFile(entryPath)) {
      addAncestorFolders(folders, entryPath)
      addFolderPath(folders, entryPath.replace(/\/\.keep$/, ''))
      continue
    }

    addAncestorFolders(folders, entryPath)
    files.push({
      path: entryPath,
      name: entry.name,
      size: Number(entry.metadata?.size ?? 0),
      contentType: entry.metadata?.mimetype ?? null,
      lastModified: entry.updated_at ?? entry.created_at ?? null,
      publicUrl: getPublicFileUrl(entryPath, 'supabase'),
    })
  }
}

async function listSupabaseFiles(): Promise<StorageListingResult> {
  const folders = new Map<string, StorageListFolder>()
  const files: StorageListFile[] = []
  await listSupabaseFolderRecursive('', folders, files)

  return {
    provider: 'supabase',
    files: files.sort((left, right) => (right.lastModified ?? '').localeCompare(left.lastModified ?? '') || left.name.localeCompare(right.name)),
    folders: Array.from(folders.values()).sort((left, right) => left.path.localeCompare(right.path)),
  }
}

async function listS3Files(): Promise<StorageListingResult> {
  const s3 = getS3Config()

  if (!s3?.accessKeyId || !s3.secretAccessKey) {
    throw new Error('S3 listing requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.')
  }

  const client = new S3Client({
    region: s3.region,
    endpoint: s3.endpoint,
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
    },
    forcePathStyle: true,
  })

  const folders = new Map<string, StorageListFolder>()
  const files: StorageListFile[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: s3.bucket,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }))

    for (const object of response.Contents ?? []) {
      const path = object.Key ?? ''
      if (!path) continue

      if (isPlaceholderFile(path)) {
        addAncestorFolders(folders, path)
        addFolderPath(folders, path.replace(/\/\.keep$/, ''))
        continue
      }

      addAncestorFolders(folders, path)
      files.push({
        path,
        name: toFolderName(path),
        size: Number(object.Size ?? 0),
        contentType: null,
        lastModified: object.LastModified?.toISOString() ?? null,
        publicUrl: getPublicFileUrl(path, 's3'),
      })
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return {
    provider: 's3',
    files: files.sort((left, right) => (right.lastModified ?? '').localeCompare(left.lastModified ?? '') || left.name.localeCompare(right.name)),
    folders: Array.from(folders.values()).sort((left, right) => left.path.localeCompare(right.path)),
  }
}

export async function listPublicFiles(provider: StorageProvider = 'auto'): Promise<StorageListingResult> {
  const resolvedProvider = resolveStorageProvider(provider)
  return resolvedProvider === 's3' ? listS3Files() : listSupabaseFiles()
}

export function ensureImageFile(file: File, maxSizeInMb = 10) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file.')
  }

  if (file.size > maxSizeInMb * 1024 * 1024) {
    throw new Error(`Image must be ${maxSizeInMb}MB or smaller.`)
  }
}

export function getImageExtension(file: File) {
  const fromType = IMAGE_EXTENSIONS[file.type.toLowerCase()]
  if (fromType) {
    return fromType
  }

  const fileName = file.name.trim()
  const fromName = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : null
  return fromName || 'jpg'
}

export async function uploadPublicFile({
  file,
  path,
  cacheControl = '3600',
  upsert = false,
  provider = 'auto',
}: {
  file: File
  path: string
  cacheControl?: string
  upsert?: boolean
  provider?: StorageProvider
}) {
  const resolvedProvider = resolveStorageProvider(provider)
  const bytes = await file.arrayBuffer()

  if (resolvedProvider === 's3') {
    const s3 = getS3Config()

    if (!s3?.accessKeyId || !s3.secretAccessKey) {
      throw new Error('S3 upload requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (or AWS_* equivalents).')
    }

    const client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      forcePathStyle: true,
    })

    await client.send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: path,
      Body: Buffer.from(bytes),
      ContentType: file.type,
      CacheControl: cacheControl,
    }))

    return getS3PublicUrl(s3.endpoint, s3.bucket, path)
  }

  const bucket = getStorageBucket()
  const admin = createAdminSupabaseClient()

  const { error } = await admin.storage.from(bucket).upload(path, Buffer.from(bytes), {
    cacheControl,
    upsert,
    contentType: file.type,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deletePublicFile(path: string, provider: StorageProvider = 'auto') {
  const resolvedProvider = resolveStorageProvider(provider)

  if (resolvedProvider === 's3') {
    const s3 = getS3Config()

    if (!s3?.accessKeyId || !s3.secretAccessKey) {
      throw new Error('S3 deletion requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.')
    }

    const client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      forcePathStyle: true,
    })

    await client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: path }))
    return
  }

  const bucket = getStorageBucket()
  const admin = createAdminSupabaseClient()
  const { error } = await admin.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(error.message)
  }
}

export async function createStorageFolder(path: string, provider: StorageProvider = 'auto') {
  const normalizedPath = normalizePrefix(path)
  if (!normalizedPath) {
    throw new Error('Folder path is required.')
  }

  const resolvedProvider = resolveStorageProvider(provider)
  const key = `${normalizedPath}/.keep`

  if (resolvedProvider === 's3') {
    const s3 = getS3Config()

    if (!s3?.accessKeyId || !s3.secretAccessKey) {
      throw new Error('S3 folder creation requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.')
    }

    const client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
      forcePathStyle: true,
    })

    await client.send(new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: Buffer.from(''),
      ContentType: 'text/plain',
      CacheControl: 'no-cache',
    }))
    return
  }

  const bucket = getStorageBucket()
  const admin = createAdminSupabaseClient()
  const { error } = await admin.storage.from(bucket).upload(key, Buffer.from(''), {
    cacheControl: '0',
    upsert: true,
    contentType: 'text/plain',
  })

  if (error) {
    throw new Error(error.message)
  }
}