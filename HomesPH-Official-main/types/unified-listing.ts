'use server-only does not apply here — this is a shared type file'

// Unified listing type that normalizes both HomesPH and RentPH data
export interface UnifiedListing {
  // identity
  id: string            // "homesph-{id}" | "rentph-{id}"
  source: 'homesph' | 'rentph'
  href: string          // navigation target
  slug?: string

  // display
  title: string
  price: number | null    // PHP
  priceLabel: string      // formatted, e.g. "₱ 2,500,000"
  priceSuffix?: string    // e.g. "/mo" for rent

  // location
  address: string
  city?: string
  province?: string

  // specs
  propertyType: string
  beds: number
  baths: number
  areaSqm: number

  // media
  coverImage: string
  gallery: string[]

  // badges
  isFeatured: boolean
  sourceLogo?: string   // only for rentph
  developerLogo?: string

  // agent
  agentName?: string
  agentTitle?: string
  agentAvatar?: string
  agentPhone?: string
  agentEmail?: string

  // meta
  createdAt?: string
}
