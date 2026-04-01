import { createAdminSupabaseClient } from './lib/supabase/admin.js'

async function testSearch(query) {
  const admin = createAdminSupabaseClient()
  
  const { data, error } = await admin
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
    .or(`title.ilike.%${query}%,projects.name.ilike.%${query}%,projects.city_municipality.ilike.%${query}%,projects.province.ilike.%${query}%`)
    .limit(5)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Results:', JSON.stringify(data, null, 2))
  }
}

testSearch('Apartment') // or some known value
