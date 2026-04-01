'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export interface ListingSuggestion {
  id: number
  title: string
  price: number | null
  image_url: string | null
  project_name: string
  address: string
  logo_url: string | null
}

export async function getListingSuggestions(query: string): Promise<ListingSuggestion[]> {
  if (!query || query.length < 2) return []

  const admin = createAdminSupabaseClient()
  
  // 1. Search for projects that match the query (places)
  const { data: matchedProjects } = await admin
    .from('projects')
    .select('id')
    .or(`name.ilike.%${query}%,city_municipality.ilike.%${query}%,province.ilike.%${query}%,address_details.ilike.%${query}%`)
    .limit(10)

  const matchedProjectIds = matchedProjects?.map(p => p.id) || []

  // 2. Search for listings that match the title OR belong to matched projects
  let listingQuery = admin
    .from('property_listings')
    .select(`
      id,
      title,
      price,
      projects!inner (
        name,
        main_image_url,
        city_municipality,
        province,
        address_details,
        developers_profiles (
          logo_url
        )
      )
    `)

  if (matchedProjectIds.length > 0) {
    listingQuery = listingQuery.or(`title.ilike.%${query}%,project_id.in.(${matchedProjectIds.join(',')})`)
  } else {
    listingQuery = listingQuery.ilike('title', `%${query}%`)
  }

  const { data, error } = await listingQuery.limit(5)

  if (error) {
    console.error('Error fetching listing suggestions:', error)
    return []
  }

  return (data || []).map((listing: any) => {
    const project = listing.projects
    const developer = project?.developers_profiles
    
    return {
      id: Number(listing.id),
      title: listing.title,
      price: listing.price ? Number(listing.price) : null,
      image_url: project?.main_image_url || null,
      project_name: project?.name || '',
      address: project?.address_details || `${project?.city_municipality || ''}, ${project?.province || ''}`.trim().replace(/^,|,$/g, ''),
      logo_url: developer?.logo_url || null
    }
  })
}
