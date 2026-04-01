import type { SiteLocationInput, SiteLocationRecord } from '@/lib/settings-types'

export interface ContentBaseRecord {
  id: number
  name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AmenityInput {
  name: string
  description: string
}

export interface PropertyTypeInput {
  name: string
  description: string
}

export type AmenityRecord = ContentBaseRecord
export type PropertyTypeRecord = ContentBaseRecord
export type LocationRecord = SiteLocationRecord
export type LocationInput = SiteLocationInput