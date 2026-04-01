import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { canPerformDashboardAction, type DashboardActionKey } from '@/lib/dashboard-permissions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { ensureImageFile, getImageExtension, uploadPublicFile, type StorageProvider } from '@/lib/storage'
import type {
  ListingAnalyticsPoint,
  ListingDetailBundle,
  ListingDetailsRecord,
  ListingDeveloperOptionRecord,
  ListingGalleryInput,
  ListingGalleryRecord,
  ListingInput,
  ListingListRecord,
  ListingProjectOptionRecord,
  ListingRecord,
  ListingUnitOptionRecord,
} from '@/lib/listings-types'

const PRIVILEGED_ROLES = new Set(['super_admin', 'admin'])
const ALLOWED_STATUSES = new Set(['draft', 'published', 'archived'])
const ALLOWED_LISTING_TYPES = new Set(['sale', 'rent'])

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseOptionalInteger(value: string | number | null | undefined) {
  const parsed = parseOptionalNumber(value)
  return parsed === null ? null : Math.trunc(parsed)
}

function parseRelationId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeListingInput(input: ListingInput) {
  const title = input.title.trim()
  const listingType = input.listing_type.trim().toLowerCase()
  const status = input.status.trim().toLowerCase()

  if (!title) {
    throw new Error('Listing title is required.')
  }

  if (!ALLOWED_LISTING_TYPES.has(listingType)) {
    throw new Error('Listing type must be sale or rent.')
  }

  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error('Listing status must be draft, published, or archived.')
  }

  return {
    title,
    description: trimToNull(input.description),
    developer_id: parseRelationId(input.developer_id),
    project_id: parseRelationId(input.project_id),
    project_unit_id: parseRelationId(input.project_unit_id),
    listing_type: listingType,
    status,
    currency: trimToNull(input.currency) ?? 'PHP',
    price: parseOptionalNumber(input.price),
    negotiable: Boolean(input.negotiable),
    is_featured: Boolean(input.is_featured),
  }
}

function sanitizeGalleryInput(input: ListingGalleryInput) {
  return {
    title: trimToNull(input.title),
    description: trimToNull(input.description),
    display_order: parseOptionalInteger(input.display_order) ?? 0,
  }
}

function buildAnalyticsSeries(viewsCount: number | null, inquiriesCount: number | null): ListingAnalyticsPoint[] {
  const views = Math.max(viewsCount ?? 0, 0)
  const inquiries = Math.max(inquiriesCount ?? 0, 0)
  const steps = [0.08, 0.16, 0.3, 0.5, 0.74, 1]
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

  return labels.map((label, index) => {
    const pointViews = Math.round(views * steps[index])
    const pointInquiries = Math.round(inquiries * steps[index])
    return {
      label,
      views: pointViews,
      inquiries: pointInquiries,
      conversionRate: pointViews > 0 ? Number(((pointInquiries / pointViews) * 100).toFixed(1)) : 0,
    }
  })
}

function mapDevelopers(data: Array<{ id: number; developer_name: string }>) {
  return data.map((item) => ({ id: item.id, developer_name: item.developer_name }))
}

function mapProjects(data: Array<{ id: number; developer_id: number | null; name: string }>) {
  return data.map((item) => ({ id: item.id, developer_id: item.developer_id, name: item.name }))
}

function mapUnits(data: Array<{
  id: number
  project_id: number | null
  unit_name: string | null
  unit_type: string
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  lot_area_sqm: number | null
  has_parking: boolean | null
  has_balcony: boolean | null
  is_furnished: string | null
}>) {
  return data.map((item) => ({ ...item }))
}

function buildListingMapData(
  developers: ListingDeveloperOptionRecord[],
  projects: ListingProjectOptionRecord[],
  units: ListingUnitOptionRecord[],
  galleries: ListingGalleryRecord[],
) {
  const developersMap = new Map(developers.map((item) => [item.id, item.developer_name]))
  const projectsMap = new Map(projects.map((item) => [item.id, item.name]))
  const unitsMap = new Map(units.map((item) => [item.id, item]))
  const imageMap = new Map<number, string>()

  for (const gallery of galleries) {
    if (!imageMap.has(gallery.listing_id)) {
      imageMap.set(gallery.listing_id, gallery.image_url)
    }
  }

  return { developersMap, projectsMap, unitsMap, imageMap }
}

function mapListingRow(
  listing: any,
  developersMap: Map<number, string>,
  projectsMap: Map<number, string>,
  unitsMap: Map<number, ListingUnitOptionRecord>,
  imageMap: Map<number, string>,
): ListingListRecord {
  const unit = listing.project_unit_id ? unitsMap.get(listing.project_unit_id) ?? null : null
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
    project_name: listing.project_id ? projectsMap.get(listing.project_id) ?? null : null,
    developer_name: listing.developer_id ? developersMap.get(listing.developer_id) ?? null : null,
    unit_name: unit?.unit_name ?? null,
    unit_type: unit?.unit_type ?? null,
    listing_image_url: imageMap.get(listing.id) ?? null,
  }
}

async function getListingSupportOptions() {
  const admin = createAdminSupabaseClient()
  const [developersResult, projectsResult, unitsResult] = await Promise.all([
    admin.from('developers_profiles').select('id,developer_name').order('developer_name', { ascending: true }),
    admin.from('projects').select('id,developer_id,name').order('name', { ascending: true }),
    admin.from('project_units').select('id,project_id,unit_name,unit_type,bedrooms,bathrooms,floor_area_sqm,lot_area_sqm,has_parking,has_balcony,is_furnished').order('unit_type', { ascending: true }),
  ])

  if (developersResult.error) throw new Error(developersResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (unitsResult.error) throw new Error(unitsResult.error.message)

  return {
    developers: mapDevelopers((developersResult.data ?? []) as Array<{ id: number; developer_name: string }>),
    projects: mapProjects((projectsResult.data ?? []) as Array<{ id: number; developer_id: number | null; name: string }>),
    units: mapUnits((unitsResult.data ?? []) as Array<ListingUnitOptionRecord>),
  }
}

async function getListingGalleryRows(listingId?: number) {
  const admin = createAdminSupabaseClient()
  let query = admin
    .from('property_listing_galleries')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (listingId) {
    query = query.eq('listing_id', listingId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as ListingGalleryRecord[]
}

async function getListingByIdInternal(id: number): Promise<ListingRecord | null> {
  const admin = createAdminSupabaseClient()
  const { data: listing, error } = await admin.from('property_listings').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!listing) return null

  const [{ developers, projects, units }, galleries, ownerResult] = await Promise.all([
    getListingSupportOptions(),
    getListingGalleryRows(id),
    listing.user_profile_id
      ? admin.from('user_profiles').select('full_name,fname,lname').eq('id', listing.user_profile_id).maybeSingle<{ full_name: string | null; fname: string | null; lname: string | null }>()
      : Promise.resolve({ data: null, error: null }),
  ])

  if ('error' in ownerResult && ownerResult.error) throw new Error(ownerResult.error.message)

  const { developersMap, projectsMap, unitsMap, imageMap } = buildListingMapData(developers, projects, units, galleries)
  const owner = 'data' in ownerResult ? ownerResult.data : null
  const ownerName = owner?.full_name?.trim() || [owner?.fname, owner?.lname].filter(Boolean).join(' ').trim() || null

  return {
    ...mapListingRow(listing, developersMap, projectsMap, unitsMap, imageMap),
    owner_name: ownerName,
  }
}

export async function requireListingsAccess(action: DashboardActionKey = 'view') {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!PRIVILEGED_ROLES.has(user.role) && !canPerformDashboardAction(user.roleSegment, 'listings', action, user.dashboardPermissions)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getListingDeveloperOptions(): Promise<ListingDeveloperOptionRecord[]> {
  await requireListingsAccess()
  return (await getListingSupportOptions()).developers
}

export async function getListingProjectOptions(): Promise<ListingProjectOptionRecord[]> {
  await requireListingsAccess()
  return (await getListingSupportOptions()).projects
}

export async function getListingUnitOptions(): Promise<ListingUnitOptionRecord[]> {
  await requireListingsAccess()
  return (await getListingSupportOptions()).units
}

export async function getListings(): Promise<ListingListRecord[]> {
  await requireListingsAccess()

  const admin = createAdminSupabaseClient()
  const [{ data: listings, error: listingsError }, options, galleries] = await Promise.all([
    admin.from('property_listings').select('*').order('created_at', { ascending: false }),
    getListingSupportOptions(),
    getListingGalleryRows(),
  ])

  if (listingsError) throw new Error(listingsError.message)

  const { developersMap, projectsMap, unitsMap, imageMap } = buildListingMapData(options.developers, options.projects, options.units, galleries)

  return (listings ?? []).map((listing) => mapListingRow(listing, developersMap, projectsMap, unitsMap, imageMap))
}

export async function getListingById(id: number): Promise<ListingDetailBundle | null> {
  await requireListingsAccess()

  const [listing, options, galleries] = await Promise.all([
    getListingByIdInternal(id),
    getListingSupportOptions(),
    getListingGalleryRows(id),
  ])

  if (!listing) return null

  const unit = listing.project_unit_id ? options.units.find((item) => item.id === listing.project_unit_id) ?? null : null
  const details: ListingDetailsRecord = {
    developer_name: listing.developer_name,
    project_name: listing.project_name,
    unit_name: unit?.unit_name ?? listing.unit_name,
    unit_type: unit?.unit_type ?? listing.unit_type,
    bedrooms: unit?.bedrooms ?? null,
    bathrooms: unit?.bathrooms ?? null,
    floor_area_sqm: unit?.floor_area_sqm ?? null,
    lot_area_sqm: unit?.lot_area_sqm ?? null,
    has_parking: unit?.has_parking ?? null,
    has_balcony: unit?.has_balcony ?? null,
    is_furnished: unit?.is_furnished ?? null,
  }

  return {
    listing,
    developers: options.developers,
    projects: options.projects,
    units: options.units,
    galleries,
    details,
    analyticsSeries: buildAnalyticsSeries(listing.views_count, listing.inquiries_count),
  }
}

async function getListingListItemById(id: number) {
  const listing = await getListingByIdInternal(id)
  if (!listing) throw new Error('Listing not found.')
  return listing
}

export async function createListing(input: ListingInput) {
  const user = await requireListingsAccess('create')

  const admin = createAdminSupabaseClient()
  const payload = sanitizeListingInput(input)
  const { data, error } = await admin
    .from('property_listings')
    .insert({ ...payload, user_profile_id: user.profileId })
    .select('id')
    .single<{ id: number }>()

  if (error || !data) throw new Error(error?.message ?? 'Unable to create listing.')
  return await getListingListItemById(data.id)
}

export async function updateListing(id: number, input: ListingInput) {
  await requireListingsAccess('edit')

  const admin = createAdminSupabaseClient()
  const payload = sanitizeListingInput(input)
  const { error } = await admin.from('property_listings').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  const listing = await getListingByIdInternal(id)
  if (!listing) throw new Error('Listing not found.')
  return listing
}

export async function deleteListing(id: number) {
  await requireListingsAccess('delete')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('property_listings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function setListingFeatured(id: number, isFeatured: boolean) {
  await requireListingsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('property_listings').update({ is_featured: isFeatured }).eq('id', id)
  if (error) throw new Error(error.message)
  const listing = await getListingByIdInternal(id)
  if (!listing) throw new Error('Listing not found.')
  return listing
}

export async function setListingStatus(id: number, status: 'draft' | 'published' | 'archived') {
  await requireListingsAccess('manage')
  if (!ALLOWED_STATUSES.has(status)) throw new Error('Invalid listing status.')

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('property_listings').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  const listing = await getListingByIdInternal(id)
  if (!listing) throw new Error('Listing not found.')
  return listing
}

export async function uploadListingGalleryImage(listingId: number, file: File, provider: StorageProvider = 'auto', input?: Partial<ListingGalleryInput>) {
  await requireListingsAccess('manage')
  ensureImageFile(file, 10)
  const admin = createAdminSupabaseClient()
  const extension = getImageExtension(file)
  const imageUrl = await uploadPublicFile({
    file,
    path: `listings/${listingId}/gallery/${Date.now()}.${extension}`,
    cacheControl: '3600',
    upsert: false,
    provider,
  })

  const { data: latest } = await admin
    .from('property_listing_galleries')
    .select('display_order')
    .eq('listing_id', listingId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle<{ display_order: number | null }>()

  const payload = sanitizeGalleryInput({
    title: input?.title ?? '',
    description: input?.description ?? '',
    display_order: String((latest?.display_order ?? -1) + 1),
  })

  const { data, error } = await admin
    .from('property_listing_galleries')
    .insert({ listing_id: listingId, image_url: imageUrl, ...payload })
    .select('*')
    .single<ListingGalleryRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function updateListingGalleryItem(listingId: number, galleryId: number, input: ListingGalleryInput) {
  await requireListingsAccess('manage')
  const admin = createAdminSupabaseClient()
  const payload = sanitizeGalleryInput(input)
  const { data, error } = await admin
    .from('property_listing_galleries')
    .update(payload)
    .eq('id', galleryId)
    .eq('listing_id', listingId)
    .select('*')
    .single<ListingGalleryRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function reorderListingGallery(listingId: number, galleryIds: number[]) {
  await requireListingsAccess('manage')
  const admin = createAdminSupabaseClient()

  for (const [index, galleryId] of galleryIds.entries()) {
    const { error } = await admin
      .from('property_listing_galleries')
      .update({ display_order: index })
      .eq('id', galleryId)
      .eq('listing_id', listingId)
    if (error) throw new Error(error.message)
  }

  return galleryIds
}

export async function removeListingGalleryItem(listingId: number, galleryId: number) {
  await requireListingsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('property_listing_galleries').delete().eq('id', galleryId).eq('listing_id', listingId)
  if (error) throw new Error(error.message)
}