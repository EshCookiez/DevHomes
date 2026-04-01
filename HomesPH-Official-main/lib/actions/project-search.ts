'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export interface ProjectSuggestion {
  id: number
  name: string
  slug: string
  project_type: string | null
  price_range_min: number | null
  price_range_max: number | null
  main_image_url: string | null
  city: string | null
  province: string | null
  logo_url: string | null
  developer_name: string | null
}

export async function getProjectSuggestions(query: string): Promise<ProjectSuggestion[]> {
  if (!query || query.length < 2) return []

  const admin = createAdminSupabaseClient()
  
  // Search for projects by name, city, province, or developer name
  const { data, error } = await admin
    .from('projects')
    .select(`
      id,
      name,
      slug,
      project_type,
      price_range_min,
      price_range_max,
      main_image_url,
      city_municipality,
      province,
      developers_profiles (
        developer_name,
        logo_url
      )
    `)
    .or(`name.ilike.%${query}%,city_municipality.ilike.%${query}%,province.ilike.%${query}%`)
    .limit(5)

  if (error) {
    console.error('Error fetching project suggestions:', error)
    return []
  }

  return (data || []).map((project: any) => {
    const dev = project.developers_profiles
    
    return {
      id: Number(project.id),
      name: project.name,
      slug: project.slug,
      project_type: project.project_type,
      price_range_min: project.price_range_min ? Number(project.price_range_min) : null,
      price_range_max: project.price_range_max ? Number(project.price_range_max) : null,
      main_image_url: project.main_image_url,
      city: project.city_municipality,
      province: project.province,
      logo_url: dev?.logo_url || null,
      developer_name: dev?.developer_name || null
    }
  })
}
