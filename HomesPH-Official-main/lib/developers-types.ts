import type { StorageProvider } from '@/lib/storage'

export interface DeveloperProfileRecord {
  id: number
  user_profile_id: string | null
  developer_name: string
  industry: string | null
  website_url: string | null
  description: string | null
  logo_url: string | null
  is_active?: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface DeveloperContactPersonRecord {
  id: number
  developer_id: number
  fname: string | null
  mname: string | null
  lname: string | null
  full_name: string | null
  position: string | null
  email: string | null
  mobile_number: string | null
  telephone: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DeveloperAddressRecord {
  id: number
  developer_id: number | null
  label: string | null
  full_address: string | null
  street: string | null
  city: string | null
  state: string | null
  country: string | null
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  updated_at: string | null
}

export interface DeveloperProjectRecord {
  id: number
  name: string
  slug: string | null
  province: string | null
  city_municipality: string | null
  status: string | null
  currency: string | null
  price_range_min: number | null
  price_range_max: number | null
  created_at: string | null
}

export interface DeveloperContactInformationRecord {
  id: number | null
  primary_mobile: string | null
  secondary_mobile: string | null
  telephone: string | null
  email: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  website_url: string | null
}

export interface ManagedDeveloperRecord extends DeveloperProfileRecord {
  projectsCount: number
}

export interface DeveloperFormInput {
  developer_name: string
  industry: string
  website_url: string
  description: string
}

export interface DeveloperContactInput {
  fname: string
  mname: string
  lname: string
  position: string
  email: string
  mobile_number: string
  telephone: string
}

export interface DeveloperAddressInput {
  label: string
  street: string
  city: string
  state: string
  country: string
  zip_code: string
  latitude: string
  longitude: string
}

export interface DeveloperLogoUploadInput {
  developerId: number
  provider?: StorageProvider
}

export interface DeveloperDetailBundle {
  developer: ManagedDeveloperRecord
  contacts: DeveloperContactPersonRecord[]
  addresses: DeveloperAddressRecord[]
  projects: DeveloperProjectRecord[]
  contactInformation: DeveloperContactInformationRecord | null
}

export interface AdminProjectRecord extends DeveloperProjectRecord {
  developer_name: string | null
  address_details: string | null
  project_type: string | null
  classification: string | null
}