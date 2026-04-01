import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type PublicProjectUnit = {
  id: number
  unit_type: string
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
}

export type PublicProject = {
  id: number
  name: string
  slug: string
  project_type: string | null
  status: string
  province: string | null
  city_municipality: string | null
  price_range_min: number | null
  price_range_max: number | null
  main_image_url: string | null
  video_tour_url: string | null
  is_featured: boolean
  created_at: string
  latitude: number | null
  longitude: number | null
  developers_profiles: { logo_url: string | null; developer_name: string } | null
  project_units: PublicProjectUnit[]
  project_amenities: { amenities: { name: string } | null }[]
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      slug,
      project_type,
      status,
      province,
      city_municipality,
      price_range_min,
      price_range_max,
      main_image_url,
      video_tour_url,
      is_featured,
      created_at,
      latitude,
      longitude,
      developers_profiles (
        logo_url,
        developer_name
      ),
      project_units (
        id,
        unit_type,
        bedrooms,
        bathrooms,
        floor_area_sqm
      ),
      project_amenities (
        amenities (
          name
        )
      )
    `)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch public projects:', error.message)
    return []
  }

  return (data ?? []) as unknown as PublicProject[]
}
