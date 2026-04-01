const REVALIDATE = 300

function getSupabaseFetchHeaders(): Record<string, string> | undefined {
  const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE
  if (!SERVICE_ROLE) return undefined

  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
  }
}

export async function getProjectsByProvince(provinceSlug: string, opts?: { limit?: number; featured?: boolean }) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return []
  const limit = opts?.limit ?? 6
  const featured = opts?.featured ?? false
  const featureFilter = featured ? `&is_featured=eq.true` : ''
  const url = `${SUPABASE_URL}/rest/v1/projects?select=id,uuid,name,slug,main_image_url,developer_id,province&province=ilike.${encodeURIComponent('%' + provinceSlug + '%')}${featureFilter}&order=id.desc&limit=${limit}`

  const headers = getSupabaseFetchHeaders()
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return []
  return res.json()
}

export async function getListingsByTypeAndProvince(provinceSlug: string, type: 'sale' | 'rent', limit = 12) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return []

  const projectsUrl = `${SUPABASE_URL}/rest/v1/projects?select=id&province=ilike.${encodeURIComponent('%' + provinceSlug + '%')}&order=id.desc&limit=500`
  const headers = getSupabaseFetchHeaders()
  const pRes = await fetch(projectsUrl, { headers, next: { revalidate: REVALIDATE } })
  if (!pRes.ok) return []
  const projects = await pRes.json()
  const ids = projects.map((p: any) => p.id)
  if (ids.length === 0) return []

  const inList = `project_id=in.(${ids.join(',')})`
  const url = `${SUPABASE_URL}/rest/v1/property_listings?select=id,title,listing_type,project_id,selling_price&listing_type=eq.${type}&status=eq.published&${inList}&order=id.desc&limit=${limit}`
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return []
  return res.json()
}

export async function getDevelopersByProvince(provinceSlug: string, limit = 8) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return []
  const headers = getSupabaseFetchHeaders()
  const projectsUrl = `${SUPABASE_URL}/rest/v1/projects?select=developer_id&id=not.is.null&province=ilike.${encodeURIComponent('%' + provinceSlug + '%')}&order=id.desc&limit=500`
  const pRes = await fetch(projectsUrl, { headers, next: { revalidate: REVALIDATE } })
  if (!pRes.ok) return []
  const projects = await pRes.json()
  const devIds = Array.from(new Set(projects.map((p: any) => p.developer_id).filter(Boolean)))
  if (devIds.length === 0) return []
  const url = `${SUPABASE_URL}/rest/v1/developers_profiles?select=id,developer_name,logo_url&id=in.(${devIds.join(',')})&order=id.desc&limit=${limit}`
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return []
  return res.json()
}

export async function getProjectBySlug(slug: string) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return null
  const headers = getSupabaseFetchHeaders()
  const url = `${SUPABASE_URL}/rest/v1/projects?select=*,developers_profiles(*),project_galleries(*),project_amenities(*),project_units(*)&slug=eq.${encodeURIComponent(slug)}&limit=1`
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

export async function getListingById(id: string) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return null
  const headers = getSupabaseFetchHeaders()
  const url = `${SUPABASE_URL}/rest/v1/property_listings?select=*,property_listing_galleries(*)&id=eq.${encodeURIComponent(id)}&limit=1`
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

export async function getSiteLocations() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!SUPABASE_URL) return []
  const headers = getSupabaseFetchHeaders()
  const url = `${SUPABASE_URL}/rest/v1/site_locations?select=id,title,slug,logo_url,description&is_active=eq.true&order=title.asc`
  const res = await fetch(url, { headers, next: { revalidate: REVALIDATE } })
  if (!res.ok) return []
  return res.json()
}
