export type SettingPrimitive = string | boolean | number | null

export interface SiteSettingRecord {
  id: string
  key: string
  value: unknown
  description: string | null
  category: string | null
  updated_at: string | null
}

export interface SiteLocationRecord {
  id: number
  title: string
  slug: string
  logo_url: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface SiteLocationInput {
  title: string
  slug: string
  logo_url: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  is_active: boolean
}

export function extractSettingValue<T = SettingPrimitive>(value: unknown, fallback?: T): T | undefined {
  if (value && typeof value === 'object' && 'value' in value) {
    const nested = (value as { value?: T }).value
    return nested ?? fallback
  }

  if (value === undefined || value === null) {
    return fallback
  }

  return value as T
}
