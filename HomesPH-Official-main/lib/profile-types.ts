export interface UserProfileRecord {
  id: string
  user_id: string
  fname: string | null
  mname: string | null
  lname: string | null
  full_name: string | null
  gender: string | null
  birthday: string | null
  profile_image_url: string | null
  prc_number: string | null
  prc_rejection_reason: string | null
  prc_reviewed_at: string | null
  prc_reviewed_by: string | null
  prc_status: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

export interface ContactInformationRecord {
  id: number | null
  user_profile_id: string
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

export interface AddressRecord {
  id: number
  user_profile_id: string
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

export interface ProfileCompletionStatus {
  isComplete: boolean
  missingFields: string[]
}

export interface ProfileBundle {
  profile: UserProfileRecord
  contact: ContactInformationRecord
  addresses: AddressRecord[]
  lastLoginAt: string | null
  completion: ProfileCompletionStatus
}

export interface AddressInput {
  label: string
  street: string
  city: string
  state: string
  country: string
  zip_code: string
  latitude: string
  longitude: string
}

export interface ContactInput {
  primary_mobile: string
  secondary_mobile: string
  telephone: string
  email: string
  facebook_url: string
  twitter_url: string
  instagram_url: string
  linkedin_url: string
  website_url: string
}
