import 'server-only'

import { redirect } from 'next/navigation'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { ensureImageFile, getImageExtension, uploadPublicFile } from '@/lib/storage'
import type { SettingPrimitive, SiteLocationInput, SiteLocationRecord, SiteSettingRecord } from '@/lib/settings-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])

function normalizeSettingPayload(value: unknown) {
  return typeof value === 'object' && value !== null && 'value' in (value as Record<string, unknown>)
    ? value
    : { value }
}

function sanitizeLocationInput(input: SiteLocationInput): SiteLocationInput {
  return {
    title: input.title.trim(),
    slug: input.slug.trim(),
    logo_url: input.logo_url?.trim() || null,
    description: input.description?.trim() || null,
    meta_title: input.meta_title?.trim() || null,
    meta_description: input.meta_description?.trim() || null,
    meta_keywords: input.meta_keywords?.trim() || null,
    is_active: Boolean(input.is_active),
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function requireSettingsAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect('/dashboard')
  }

  return user
}

export async function getSiteSettings(): Promise<SiteSettingRecord[]> {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as SiteSettingRecord[]
}

export async function updateSiteSetting({
  key,
  value,
  description,
  category,
}: {
  key: string
  value: SettingPrimitive | string[] | Record<string, unknown>
  description?: string | null
  category?: string | null
}) {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const payload = {
    key,
    value: normalizeSettingPayload(value),
    description: description ?? null,
    category: category ?? 'general',
  }

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'key' })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as SiteSettingRecord
}

export async function getLocations(): Promise<SiteLocationRecord[]> {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('site_locations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as SiteLocationRecord[]
}

export async function createLocation(input: SiteLocationInput) {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('site_locations')
    .insert(sanitizeLocationInput(input))
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as SiteLocationRecord
}

export async function uploadLocationLogo(file: File, slug: string) {
  await requireSettingsAccess()

  ensureImageFile(file, 10)

  const safeSlug = slugify(slug) || `location-${Date.now()}`
  const extension = getImageExtension(file)
  const path = `settings/locations/${safeSlug}-${Date.now()}.${extension}`

  const logoUrl = await uploadPublicFile({
    file,
    path,
    cacheControl: '3600',
    upsert: false,
  })

  return { logoUrl }
}

export async function updateLocation(id: number, input: SiteLocationInput) {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('site_locations')
    .update(sanitizeLocationInput(input))
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as SiteLocationRecord
}

export async function deleteLocation(id: number) {
  await requireSettingsAccess()

  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('site_locations')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
