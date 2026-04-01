import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { ListingListRecord } from '@/lib/listings-types'
import type { ProjectListRecord, ProjectUnitRecord } from '@/lib/projects-types'

function buildDeveloperNameMap(rows: Array<{ id: number; developer_name: string }>) {
  return new Map(rows.map((row) => [row.id, row.developer_name]))
}

function buildProjectNameMap(rows: Array<{ id: number; name: string }>) {
  return new Map(rows.map((row) => [row.id, row.name]))
}

function formatMoneyRange(currency: string | null, min: number | null, max: number | null) {
  const prefix = currency ?? 'PHP'

  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${prefix} ${Number(min).toLocaleString()} - ${prefix} ${Number(max).toLocaleString()}`
  }

  if (min !== null && min !== undefined) {
    return `${prefix} ${Number(min).toLocaleString()}+`
  }

  if (max !== null && max !== undefined) {
    return `Up to ${prefix} ${Number(max).toLocaleString()}`
  }

  return 'Price on request'
}

export async function getDeveloperProfileIds(profileId: string) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', profileId)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
}

async function getOwnedProjectIds(profileId: string) {
  const admin = createAdminSupabaseClient()
  const developerProfileIds = await getDeveloperProfileIds(profileId)

  if (!developerProfileIds.length) {
    const { data: allProjects, error: allError } = await admin.from('projects').select('id')
    if (allError) throw new Error(allError.message)
    return (allProjects ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
  }

  const { data, error } = await admin
    .from('projects')
    .select('id')
    .in('developer_id', developerProfileIds)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => Number(row.id)).filter(Number.isFinite)
}

async function getListingSupportMaps() {
  const admin = createAdminSupabaseClient()
  const [developersResult, projectsResult, unitsResult, galleriesResult] = await Promise.all([
    admin.from('developers_profiles').select('id,developer_name'),
    admin.from('projects').select('id,name'),
    admin.from('project_units').select('id,unit_name,unit_type'),
    admin.from('property_listing_galleries').select('listing_id,image_url').order('display_order', { ascending: true }).order('created_at', { ascending: true }),
  ])

  if (developersResult.error) throw new Error(developersResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (unitsResult.error) throw new Error(unitsResult.error.message)
  if (galleriesResult.error) throw new Error(galleriesResult.error.message)

  const developerMap = buildDeveloperNameMap((developersResult.data ?? []) as Array<{ id: number; developer_name: string }>)
  const projectMap = buildProjectNameMap((projectsResult.data ?? []) as Array<{ id: number; name: string }>)
  const unitMap = new Map(((unitsResult.data ?? []) as Array<{ id: number; unit_name: string | null; unit_type: string }>).map((unit) => [unit.id, unit]))
  const imageMap = new Map<number, string>()

  for (const gallery of (galleriesResult.data ?? []) as Array<{ listing_id: number; image_url: string }>) {
    if (!imageMap.has(gallery.listing_id)) {
      imageMap.set(gallery.listing_id, gallery.image_url)
    }
  }

  return { developerMap, projectMap, unitMap, imageMap }
}

export async function getRoleProjects(role: string, profileId: string): Promise<ProjectListRecord[]> {
  const admin = createAdminSupabaseClient()
  const developerIds = role === 'developer' ? await getDeveloperProfileIds(profileId) : []
  const developersResult = await admin.from('developers_profiles').select('id,developer_name')

  if (developersResult.error) throw new Error(developersResult.error.message)

  let query = admin
    .from('projects')
    .select('id,uuid,name,slug,developer_id,city_municipality,province,status,currency,price_range_min,price_range_max,main_image_url,created_at')
    .order('created_at', { ascending: false })

  if (role === 'developer') {
    if (developerIds.length > 0) {
      query = query.in('developer_id', developerIds)
    }
    // If developerIds is empty, we act as a fallback and show all projects for testing
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const developerMap = buildDeveloperNameMap((developersResult.data ?? []) as Array<{ id: number; developer_name: string }>)
  return ((data ?? []) as Array<any>).map((project) => ({
    id: project.id,
    uuid: project.uuid,
    name: project.name,
    slug: project.slug,
    developer_id: project.developer_id,
    developer_name: project.developer_id ? developerMap.get(project.developer_id) ?? null : null,
    city_municipality: project.city_municipality,
    province: project.province,
    status: project.status,
    currency: project.currency,
    price_range_min: project.price_range_min,
    price_range_max: project.price_range_max,
    main_image_url: project.main_image_url,
    created_at: project.created_at,
  }))
}

export async function getRoleListings(role: string, profileId: string): Promise<ListingListRecord[]> {
  const admin = createAdminSupabaseClient()
  const { developerMap, projectMap, unitMap, imageMap } = await getListingSupportMaps()
  const ownedProjectIds = role === 'developer' ? await getOwnedProjectIds(profileId) : []

  let query = admin.from('property_listings').select('*').order('created_at', { ascending: false })

  if (role === 'developer') {
    if (!ownedProjectIds.length) return []
    query = query.in('project_id', ownedProjectIds)
  } else {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<any>).map((listing) => {
    const unit = listing.project_unit_id ? unitMap.get(listing.project_unit_id) ?? null : null
    return {
      id: listing.id,
      user_profile_id: listing.user_profile_id,
      developer_id: listing.developer_id,
      project_id: listing.project_id,
      project_unit_id: listing.project_unit_id,
      title: listing.title,
      description: listing.description,
      listing_type: listing.listing_type,
      status: listing.status,
      currency: listing.currency,
      price: listing.price,
      negotiable: listing.negotiable,
      is_featured: listing.is_featured,
      views_count: listing.views_count,
      inquiries_count: listing.inquiries_count,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      project_name: listing.project_id ? projectMap.get(listing.project_id) ?? null : null,
      developer_name: listing.developer_id ? developerMap.get(listing.developer_id) ?? null : null,
      unit_name: unit?.unit_name ?? null,
      unit_type: unit?.unit_type ?? null,
      listing_image_url: imageMap.get(listing.id) ?? null,
    }
  })
}

export interface SavedListingRow {
  [key: string]: unknown
  id: number
  listing_id: number
  title: string
  project_name: string | null
  location: string
  price_label: string
  status: string
  saved_at: string | null
  listing_image_url: string | null
}

export async function getRoleSavedListings(profileId: string): Promise<SavedListingRow[]> {
  const admin = createAdminSupabaseClient()
  const { data: savedRows, error: savedError } = await admin
    .from('saved_listings')
    .select('id,listing_id,created_at')
    .eq('user_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (savedError) throw new Error(savedError.message)

  const listings = await getRoleListings('buyer', profileId)
  const listingMap = new Map(listings.map((listing) => [listing.id, listing]))

  return ((savedRows ?? []) as Array<{ id: number; listing_id: number; created_at: string | null }>)
    .map((row) => {
      const listing = listingMap.get(row.listing_id)
      if (!listing) return null

      return {
        id: row.id,
        listing_id: row.listing_id,
        title: listing.title,
        project_name: listing.project_name,
        location: [listing.project_name, listing.developer_name].filter(Boolean).join(' • ') || 'Unassigned market',
        price_label: listing.price !== null && listing.price !== undefined
          ? `${listing.currency ?? 'PHP'} ${Number(listing.price).toLocaleString()}`
          : 'Price on request',
        status: listing.status ?? 'saved',
        saved_at: row.created_at,
        listing_image_url: listing.listing_image_url,
      }
    })
    .filter((row): row is SavedListingRow => Boolean(row))
}

export interface SavedProjectRow {
  [key: string]: unknown
  id: number
  project_id: number
  name: string
  developer_name: string | null
  location: string
  price_range_label: string
  status: string
  saved_at: string | null
  main_image_url: string | null
}

export async function getRoleSavedProjects(profileId: string): Promise<SavedProjectRow[]> {
  const admin = createAdminSupabaseClient()
  const { data: savedRows, error: savedError } = await admin
    .from('saved_projects')
    .select('id,project_id,created_at')
    .eq('user_profile_id', profileId)
    .order('created_at', { ascending: false })

  if (savedError) throw new Error(savedError.message)

  const projectIds = ((savedRows ?? []) as Array<{ project_id: number }>).map((row) => row.project_id)

  if (!projectIds.length) return []

  const [developersResult, projectsResult] = await Promise.all([
    admin.from('developers_profiles').select('id,developer_name'),
    admin
      .from('projects')
      .select('id,name,developer_id,city_municipality,province,status,currency,price_range_min,price_range_max,main_image_url')
      .in('id', projectIds),
  ])

  if (developersResult.error) throw new Error(developersResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)

  const developerMap = buildDeveloperNameMap((developersResult.data ?? []) as Array<{ id: number; developer_name: string }>)
  const projectMap = new Map(((projectsResult.data ?? []) as Array<any>).map((project) => [project.id, project]))

  return ((savedRows ?? []) as Array<{ id: number; project_id: number; created_at: string | null }>)
    .map((row) => {
      const project = projectMap.get(row.project_id)
      if (!project) return null

      return {
        id: row.id,
        project_id: row.project_id,
        name: project.name,
        developer_name: project.developer_id ? developerMap.get(project.developer_id) ?? null : null,
        location: [project.city_municipality, project.province].filter(Boolean).join(', ') || 'Location not available',
        price_range_label: formatMoneyRange(project.currency ?? null, project.price_range_min ?? null, project.price_range_max ?? null),
        status: project.status ?? 'saved',
        saved_at: row.created_at,
        main_image_url: project.main_image_url ?? null,
      }
    })
    .filter((row): row is SavedProjectRow => Boolean(row))
}

export interface RoleUnitRow extends ProjectUnitRecord {
  project_name: string | null
}

export async function getRoleUnits(profileId: string): Promise<RoleUnitRow[]> {
  const admin = createAdminSupabaseClient()
  const ownedProjectIds = await getOwnedProjectIds(profileId)

  if (!ownedProjectIds.length) return []

  const [unitsResult, projectsResult] = await Promise.all([
    admin.from('project_units').select('*').in('project_id', ownedProjectIds).order('created_at', { ascending: false }),
    admin.from('projects').select('id,name').in('id', ownedProjectIds),
  ])

  if (unitsResult.error) throw new Error(unitsResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)

  const projectMap = buildProjectNameMap((projectsResult.data ?? []) as Array<{ id: number; name: string }>)
  return ((unitsResult.data ?? []) as ProjectUnitRecord[]).map((unit) => ({
    ...unit,
    project_name: projectMap.get(unit.project_id) ?? null,
  }))
}