import type { StorageProvider } from '@/lib/storage'

export interface ListingDeveloperOptionRecord {
  id: number
  developer_name: string
}

export interface ListingProjectOptionRecord {
  id: number
  developer_id: number | null
  name: string
}

export interface ListingUnitOptionRecord {
  id: number
  project_id: number | null
  unit_name: string | null
  unit_type: string
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  lot_area_sqm: number | null
  has_parking: boolean | null
  has_balcony: boolean | null
  is_furnished: string | null
}

export interface ListingListRecord {
  id: number
  user_profile_id: string | null
  developer_id: number | null
  project_id: number | null
  project_unit_id: number | null
  title: string
  description: string | null
  listing_type: string | null
  status: string | null
  currency: string | null
  price: number | null
  negotiable: boolean | null
  is_featured: boolean | null
  views_count: number | null
  inquiries_count: number | null
  created_at: string | null
  updated_at: string | null
  project_name: string | null
  developer_name: string | null
  unit_name: string | null
  unit_type: string | null
  listing_image_url: string | null
}

export interface ListingRecord extends ListingListRecord {
  owner_name: string | null
}

export interface ListingInput {
  title: string
  description: string
  developer_id: string
  project_id: string
  project_unit_id: string
  listing_type: string
  status: string
  currency: string
  price: string
  negotiable: boolean
  is_featured: boolean
}

export interface ListingGalleryRecord {
  id: number
  listing_id: number
  image_url: string
  title: string | null
  description: string | null
  display_order: number | null
  created_at: string | null
}

export interface ListingGalleryInput {
  title: string
  description: string
  display_order: string
}

export interface ListingDetailsRecord {
  developer_name: string | null
  project_name: string | null
  unit_name: string | null
  unit_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  lot_area_sqm: number | null
  has_parking: boolean | null
  has_balcony: boolean | null
  is_furnished: string | null
}

export interface ListingAnalyticsPoint {
  [key: string]: any
  label: string
  views: number
  inquiries: number
  conversionRate: number
}

export interface ListingDetailBundle {
  listing: ListingRecord
  developers: ListingDeveloperOptionRecord[]
  projects: ListingProjectOptionRecord[]
  units: ListingUnitOptionRecord[]
  galleries: ListingGalleryRecord[]
  details: ListingDetailsRecord
  analyticsSeries: ListingAnalyticsPoint[]
}

export interface ListingUploadOptions {
  provider?: StorageProvider
}