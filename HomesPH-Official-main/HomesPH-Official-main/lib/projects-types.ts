import type { StorageProvider } from '@/lib/storage'

export interface DeveloperOptionRecord {
  id: number
  developer_name: string
}

export interface ProjectListRecord {
  id: number
  uuid: string
  name: string
  slug: string
  developer_id: number | null
  developer_name: string | null
  city_municipality: string | null
  province: string | null
  status: string | null
  currency: string | null
  price_range_min: number | null
  price_range_max: number | null
  main_image_url: string | null
  created_at: string | null
}

export interface ProjectRecord extends ProjectListRecord {
  lts_number: string | null
  lts_issued_date: string | null
  dhsud_registration_number: string | null
  project_type: string | null
  classification: string | null
  region: string | null
  barangay: string | null
  island_group: string | null
  address_details: string | null
  latitude: number | null
  longitude: number | null
  expected_completion_date: string | null
  turnover_date: string | null
  average_price: number | null
  vat_inclusive: boolean | null
  video_tour_url: string | null
  is_featured: boolean | null
  updated_at: string | null
}

export interface ProjectInput {
  name: string
  slug: string
  developer_id: string
  lts_number: string
  lts_issued_date: string
  dhsud_registration_number: string
  project_type: string
  classification: string
  region: string
  province: string
  city_municipality: string
  barangay: string
  island_group: string
  address_details: string
  latitude: string
  longitude: string
  status: string
  expected_completion_date: string
  turnover_date: string
  currency: string
  price_range_min: string
  price_range_max: string
  average_price: string
  vat_inclusive: boolean
  is_featured: boolean
  video_tour_url: string
}

export interface ProjectUnitRecord {
  id: number
  project_id: number
  unit_name: string | null
  unit_type: string
  floor_area_sqm: number | null
  lot_area_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  has_balcony: boolean | null
  has_parking: boolean | null
  is_furnished: string | null
  status: string | null
  is_rfo: boolean | null
  selling_price: number | null
  reservation_fee: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ProjectUnitInput {
  unit_name: string
  unit_type: string
  floor_area_sqm: string
  lot_area_sqm: string
  bedrooms: string
  bathrooms: string
  has_balcony: boolean
  has_parking: boolean
  is_furnished: string
  status: string
  is_rfo: boolean
  selling_price: string
  reservation_fee: string
}

export interface AmenityRecord {
  id: number
  name: string
  description: string | null
}

export interface ProjectGalleryRecord {
  id: number
  project_id: number
  image_url: string
  title: string | null
  description: string | null
  display_order: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ProjectGalleryInput {
  title: string
  description: string
  display_order: string
}

export interface ProjectAttachmentRecord {
  id: string
  project_id: number
  file_name: string
  file_url: string
  document_type: string | null
  metadata: Record<string, unknown> | null
  uploaded_at: string | null
}

export interface ProjectFaqRecord {
  id: number
  project_id: number | null
  question: string
  answer: string
  category: string | null
  display_order: number | null
  is_published: boolean | null
  created_at: string | null
}

export interface ProjectFaqInput {
  question: string
  answer: string
  category: string
  display_order: string
  is_published: boolean
}

export interface ProjectDetailBundle {
  project: ProjectRecord
  developers: DeveloperOptionRecord[]
  units: ProjectUnitRecord[]
  amenities: AmenityRecord[]
  selectedAmenityIds: number[]
  galleries: ProjectGalleryRecord[]
  attachments: ProjectAttachmentRecord[]
  faqs: ProjectFaqRecord[]
}

export interface ProjectUploadOptions {
  provider?: StorageProvider
}