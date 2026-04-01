import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { ensureImageFile, getImageExtension, uploadPublicFile } from '@/lib/storage'
import type { AmenityInput, AmenityRecord, LocationInput, LocationRecord, PropertyTypeInput, PropertyTypeRecord } from '@/lib/content-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])
const AMENITY_VIEW_ROLES = new Set(['super_admin', 'admin', 'developer'])

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function trimText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed || null
}

function sanitizeBaseInput<T extends { name: string; description: string }>(input: T) {
  return {
    name: input.name.trim(),
    description: trimText(input.description),
  }
}

function sanitizeLocationInput(input: LocationInput) {
  return {
    title: input.title.trim(),
    slug: slugify(input.slug || input.title),
    logo_url: trimText(input.logo_url),
    description: trimText(input.description),
    meta_title: trimText(input.meta_title),
    meta_description: trimText(input.meta_description),
    meta_keywords: trimText(input.meta_keywords),
    is_active: Boolean(input.is_active),
  }
}

export async function requireContentAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getAmenities(): Promise<AmenityRecord[]> {
  const user = await getCurrentDashboardUser()
  if (!user || !AMENITY_VIEW_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user?.role ?? '') ?? '/dashboard')
  }

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('amenities').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AmenityRecord[]
}

export async function createAmenity(input: AmenityInput): Promise<AmenityRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('amenities').insert(sanitizeBaseInput(input)).select('*').single()
  if (error) throw new Error(error.message)
  return data as AmenityRecord
}

export async function updateAmenity(id: number, input: AmenityInput): Promise<AmenityRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('amenities').update(sanitizeBaseInput(input)).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as AmenityRecord
}

export async function deleteAmenity(id: number) {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('amenities').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getPropertyTypes(): Promise<PropertyTypeRecord[]> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('property_types').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PropertyTypeRecord[]
}

export async function createPropertyType(input: PropertyTypeInput): Promise<PropertyTypeRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('property_types').insert(sanitizeBaseInput(input)).select('*').single()
  if (error) throw new Error(error.message)
  return data as PropertyTypeRecord
}

export async function updatePropertyType(id: number, input: PropertyTypeInput): Promise<PropertyTypeRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('property_types').update(sanitizeBaseInput(input)).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as PropertyTypeRecord
}

export async function deletePropertyType(id: number) {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('property_types').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getContentLocations(): Promise<LocationRecord[]> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('site_locations').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as LocationRecord[]
}

async function maybeUploadLocationLogo(file: File | null, slug: string) {
  if (!file || file.size === 0) {
    return null
  }

  ensureImageFile(file, 10)
  const safeSlug = slugify(slug) || `location-${Date.now()}`
  const extension = getImageExtension(file)
  return uploadPublicFile({
    file,
    path: `locations/${safeSlug}/logo.${extension}`,
    cacheControl: '3600',
    upsert: true,
  })
}

export async function createContentLocation(input: LocationInput, logoFile?: File | null): Promise<LocationRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const payload = sanitizeLocationInput(input)
  const nextLogoUrl = await maybeUploadLocationLogo(logoFile ?? null, payload.slug)
  if (nextLogoUrl) {
    payload.logo_url = nextLogoUrl
  }

  const { data, error } = await admin.from('site_locations').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return data as LocationRecord
}

export async function updateContentLocation(id: number, input: LocationInput, logoFile?: File | null): Promise<LocationRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const payload = sanitizeLocationInput(input)
  const nextLogoUrl = await maybeUploadLocationLogo(logoFile ?? null, payload.slug)
  if (nextLogoUrl) {
    payload.logo_url = nextLogoUrl
  }

  const { data, error } = await admin.from('site_locations').update(payload).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as LocationRecord
}

export async function deleteContentLocation(id: number) {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('site_locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleContentLocationStatus(id: number, isActive: boolean): Promise<LocationRecord> {
  await requireContentAccess()
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.from('site_locations').update({ is_active: isActive }).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as LocationRecord
}