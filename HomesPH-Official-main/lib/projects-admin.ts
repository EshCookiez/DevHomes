import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { canPerformDashboardAction, type DashboardActionKey } from '@/lib/dashboard-permissions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { ensureImageFile, getImageExtension, uploadPublicFile, type StorageProvider } from '@/lib/storage'
import type {
  AmenityRecord,
  DeveloperOptionRecord,
  ProjectAttachmentRecord,
  ProjectDetailBundle,
  ProjectFaqInput,
  ProjectFaqRecord,
  ProjectGalleryInput,
  ProjectGalleryRecord,
  ProjectInput,
  ProjectListRecord,
  ProjectRecord,
  ProjectUnitInput,
  ProjectUnitRecord,
} from '@/lib/projects-types'

const PRIVILEGED_ROLES = new Set(['super_admin', 'admin'])

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

function parseDeveloperId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeProjectInput(input: ProjectInput) {
  const name = input.name.trim()
  const slug = input.slug.trim()
  const status = input.status.trim()

  if (!name || !slug || !status) {
    throw new Error('Project name, slug, and status are required.')
  }

  return {
    name,
    slug,
    developer_id: parseDeveloperId(input.developer_id),
    lts_number: trimToNull(input.lts_number),
    lts_issued_date: trimToNull(input.lts_issued_date),
    dhsud_registration_number: trimToNull(input.dhsud_registration_number),
    project_type: trimToNull(input.project_type),
    classification: trimToNull(input.classification),
    region: trimToNull(input.region),
    province: trimToNull(input.province),
    city_municipality: trimToNull(input.city_municipality),
    barangay: trimToNull(input.barangay),
    island_group: trimToNull(input.island_group),
    address_details: trimToNull(input.address_details),
    latitude: parseOptionalNumber(input.latitude),
    longitude: parseOptionalNumber(input.longitude),
    status,
    expected_completion_date: trimToNull(input.expected_completion_date),
    turnover_date: trimToNull(input.turnover_date),
    currency: trimToNull(input.currency) ?? 'PHP',
    price_range_min: parseOptionalNumber(input.price_range_min),
    price_range_max: parseOptionalNumber(input.price_range_max),
    average_price: parseOptionalNumber(input.average_price),
    vat_inclusive: Boolean(input.vat_inclusive),
    is_featured: Boolean(input.is_featured),
    video_tour_url: trimToNull(input.video_tour_url),
  }
}

function sanitizeUnitInput(input: ProjectUnitInput) {
  const unitType = input.unit_type.trim()
  if (!unitType) {
    throw new Error('Unit type is required.')
  }

  return {
    unit_name: trimToNull(input.unit_name),
    unit_type: unitType,
    floor_area_sqm: parseOptionalNumber(input.floor_area_sqm),
    lot_area_sqm: parseOptionalNumber(input.lot_area_sqm),
    bedrooms: parseOptionalInteger(input.bedrooms) ?? 0,
    bathrooms: parseOptionalInteger(input.bathrooms) ?? 0,
    has_balcony: Boolean(input.has_balcony),
    has_parking: Boolean(input.has_parking),
    is_furnished: trimToNull(input.is_furnished),
    status: trimToNull(input.status),
    is_rfo: Boolean(input.is_rfo),
    selling_price: parseOptionalNumber(input.selling_price),
    reservation_fee: parseOptionalNumber(input.reservation_fee),
  }
}

function sanitizeGalleryInput(input: ProjectGalleryInput) {
  return {
    title: trimToNull(input.title),
    description: trimToNull(input.description),
    display_order: parseOptionalInteger(input.display_order) ?? 0,
  }
}

function sanitizeFaqInput(input: ProjectFaqInput) {
  const question = input.question.trim()
  const answer = input.answer.trim()

  if (!question || !answer) {
    throw new Error('Question and answer are required.')
  }

  return {
    question,
    answer,
    category: trimToNull(input.category),
    display_order: parseOptionalInteger(input.display_order) ?? 0,
    is_published: Boolean(input.is_published),
  }
}

function mapDevelopers(data: Array<{ id: number; developer_name: string }>) {
  return data.map((item) => ({ id: item.id, developer_name: item.developer_name }))
}

function mapProjectList(project: any, developersMap: Map<number, string>): ProjectListRecord {
  return {
    id: project.id,
    uuid: project.uuid,
    name: project.name,
    slug: project.slug,
    developer_id: project.developer_id,
    developer_name: project.developer_id ? developersMap.get(project.developer_id) ?? null : null,
    city_municipality: project.city_municipality,
    province: project.province,
    status: project.status,
    currency: project.currency,
    price_range_min: project.price_range_min,
    price_range_max: project.price_range_max,
    main_image_url: project.main_image_url,
    created_at: project.created_at,
  }
}

export async function requireProjectsAccess(action: DashboardActionKey = 'view') {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!PRIVILEGED_ROLES.has(user.role) && !canPerformDashboardAction(user.roleSegment, 'projects', action, user.dashboardPermissions)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getDeveloperOptions(): Promise<DeveloperOptionRecord[]> {
  await requireProjectsAccess()

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('developers_profiles')
    .select('id,developer_name')
    .order('developer_name', { ascending: true })

  if (error) throw new Error(error.message)
  return mapDevelopers((data ?? []) as Array<{ id: number; developer_name: string }>)
}

export async function getProjects(): Promise<ProjectListRecord[]> {
  await requireProjectsAccess()

  const admin = createAdminSupabaseClient()
  const [{ data: projects, error: projectsError }, developers] = await Promise.all([
    admin
      .from('projects')
      .select('id,uuid,name,slug,developer_id,city_municipality,province,status,currency,price_range_min,price_range_max,main_image_url,created_at')
      .order('created_at', { ascending: false }),
    getDeveloperOptions(),
  ])

  if (projectsError) throw new Error(projectsError.message)

  const developersMap = new Map(developers.map((item) => [item.id, item.developer_name]))
  return (projects ?? []).map((project) => mapProjectList(project, developersMap))
}

export async function getProjectById(id: number): Promise<ProjectDetailBundle | null> {
  await requireProjectsAccess()

  const admin = createAdminSupabaseClient()
  const [projectResult, developers, unitsResult, amenitiesResult, selectedAmenitiesResult, galleriesResult, attachmentsResult, faqsResult] = await Promise.all([
    admin
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle<ProjectRecord>(),
    getDeveloperOptions(),
    admin
      .from('project_units')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('amenities')
      .select('id,name,description')
      .order('name', { ascending: true }),
    admin
      .from('project_amenities')
      .select('amenity_id')
      .eq('project_id', id),
    admin
      .from('project_galleries')
      .select('*')
      .eq('project_id', id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('project_attachments')
      .select('*')
      .eq('project_id', id)
      .order('uploaded_at', { ascending: false }),
    admin
      .from('faqs')
      .select('*')
      .eq('project_id', id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  if (projectResult.error) throw new Error(projectResult.error.message)
  if (!projectResult.data) return null
  if (unitsResult.error) throw new Error(unitsResult.error.message)
  if (amenitiesResult.error) throw new Error(amenitiesResult.error.message)
  if (selectedAmenitiesResult.error) throw new Error(selectedAmenitiesResult.error.message)
  if (galleriesResult.error) throw new Error(galleriesResult.error.message)
  if (attachmentsResult.error) throw new Error(attachmentsResult.error.message)
  if (faqsResult.error) throw new Error(faqsResult.error.message)

  const developerMap = new Map(developers.map((item) => [item.id, item.developer_name]))
  const project = {
    ...projectResult.data,
    developer_name: projectResult.data.developer_id ? developerMap.get(projectResult.data.developer_id) ?? null : null,
  } as ProjectRecord

  return {
    project,
    developers,
    units: (unitsResult.data ?? []) as ProjectUnitRecord[],
    amenities: (amenitiesResult.data ?? []) as AmenityRecord[],
    selectedAmenityIds: (selectedAmenitiesResult.data ?? []).map((item: { amenity_id: number }) => item.amenity_id),
    galleries: (galleriesResult.data ?? []) as ProjectGalleryRecord[],
    attachments: (attachmentsResult.data ?? []) as ProjectAttachmentRecord[],
    faqs: (faqsResult.data ?? []) as ProjectFaqRecord[],
  }
}

async function getProjectListItemById(id: number) {
  const [projectResult, developers] = await Promise.all([
    createAdminSupabaseClient()
      .from('projects')
      .select('id,uuid,name,slug,developer_id,city_municipality,province,status,currency,price_range_min,price_range_max,main_image_url,created_at')
      .eq('id', id)
      .maybeSingle(),
    getDeveloperOptions(),
  ])

  if (projectResult.error || !projectResult.data) {
    throw new Error(projectResult.error?.message ?? 'Project not found.')
  }

  const developersMap = new Map(developers.map((item) => [item.id, item.developer_name]))
  return mapProjectList(projectResult.data, developersMap)
}

export async function createProject(input: ProjectInput) {
  await requireProjectsAccess('create')

  const admin = createAdminSupabaseClient()
  const payload = sanitizeProjectInput(input)
  const { data, error } = await admin
    .from('projects')
    .insert(payload)
    .select('id')
    .single<{ id: number }>()

  if (error || !data) throw new Error(error?.message ?? 'Unable to create project.')
  return await getProjectListItemById(data.id)
}

export async function updateProject(id: number, input: ProjectInput) {
  await requireProjectsAccess('edit')

  const admin = createAdminSupabaseClient()
  const payload = sanitizeProjectInput(input)
  const { error } = await admin
    .from('projects')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)

  const bundle = await getProjectById(id)
  if (!bundle) throw new Error('Project not found.')
  return bundle.project
}

export async function deleteProject(id: number) {
  await requireProjectsAccess('delete')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadProjectMainImage(id: number, file: File, provider: StorageProvider = 'auto') {
  await requireProjectsAccess('edit')
  ensureImageFile(file, 10)

  const extension = getImageExtension(file)
  const mainImageUrl = await uploadPublicFile({
    file,
    path: `projects/${id}/main-${Date.now()}.${extension}`,
    cacheControl: '3600',
    upsert: true,
    provider,
  })

  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('projects').update({ main_image_url: mainImageUrl }).eq('id', id)
  if (error) throw new Error(error.message)

  const bundle = await getProjectById(id)
  if (!bundle) throw new Error('Project not found.')
  return bundle.project
}

export async function saveProjectUnit(projectId: number, unitId: number | null, input: ProjectUnitInput) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const payload = { project_id: projectId, ...sanitizeUnitInput(input) }

  if (unitId) {
    const { data, error } = await admin
      .from('project_units')
      .update(payload)
      .eq('id', unitId)
      .eq('project_id', projectId)
      .select('*')
      .single<ProjectUnitRecord>()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('project_units')
    .insert(payload)
    .select('*')
    .single<ProjectUnitRecord>()
  if (error) throw new Error(error.message)
  return data
}

export async function removeProjectUnit(projectId: number, unitId: number) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('project_units').delete().eq('id', unitId).eq('project_id', projectId)
  if (error) throw new Error(error.message)
}

/**
 * Save a project unit without the admin access guard.
 * ONLY call this after verifying project ownership in the calling action.
 */
export async function saveProjectUnitInternal(projectId: number, unitId: number | null, input: ProjectUnitInput) {
  const admin = createAdminSupabaseClient()
  const payload = { project_id: projectId, ...sanitizeUnitInput(input) }

  if (unitId) {
    const { data, error } = await admin
      .from('project_units')
      .update(payload)
      .eq('id', unitId)
      .eq('project_id', projectId)
      .select('*')
      .single<ProjectUnitRecord>()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('project_units')
    .insert(payload)
    .select('*')
    .single<ProjectUnitRecord>()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Remove a project unit without the admin access guard.
 * ONLY call this after verifying project ownership in the calling action.
 */
export async function removeProjectUnitInternal(projectId: number, unitId: number) {
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('project_units').delete().eq('id', unitId).eq('project_id', projectId)
  if (error) throw new Error(error.message)
}

export async function updateProjectAmenities(projectId: number, amenityIds: number[]) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error: deleteError } = await admin.from('project_amenities').delete().eq('project_id', projectId)
  if (deleteError) throw new Error(deleteError.message)

  if (amenityIds.length > 0) {
    const { error: insertError } = await admin
      .from('project_amenities')
      .insert(amenityIds.map((amenityId) => ({ project_id: projectId, amenity_id: amenityId })))
    if (insertError) throw new Error(insertError.message)
  }

  return amenityIds
}

export async function uploadProjectGalleryImage(projectId: number, file: File, provider: StorageProvider = 'auto', input?: Partial<ProjectGalleryInput>) {
  await requireProjectsAccess('manage')
  ensureImageFile(file, 10)
  const admin = createAdminSupabaseClient()
  const extension = getImageExtension(file)
  const imageUrl = await uploadPublicFile({
    file,
    path: `projects/${projectId}/gallery-${Date.now()}.${extension}`,
    cacheControl: '3600',
    upsert: false,
    provider,
  })

  const { data: latest } = await admin
    .from('project_galleries')
    .select('display_order')
    .eq('project_id', projectId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle<{ display_order: number | null }>()

  const payload = sanitizeGalleryInput({
    title: input?.title ?? '',
    description: input?.description ?? '',
    display_order: String((latest?.display_order ?? -1) + 1),
  })

  const { data, error } = await admin
    .from('project_galleries')
    .insert({ project_id: projectId, image_url: imageUrl, ...payload })
    .select('*')
    .single<ProjectGalleryRecord>()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProjectGalleryItem(projectId: number, galleryId: number, input: ProjectGalleryInput) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const payload = sanitizeGalleryInput(input)
  const { data, error } = await admin
    .from('project_galleries')
    .update(payload)
    .eq('id', galleryId)
    .eq('project_id', projectId)
    .select('*')
    .single<ProjectGalleryRecord>()
  if (error) throw new Error(error.message)
  return data
}

export async function reorderProjectGallery(projectId: number, galleryIds: number[]) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()

  for (const [index, galleryId] of galleryIds.entries()) {
    const { error } = await admin
      .from('project_galleries')
      .update({ display_order: index })
      .eq('id', galleryId)
      .eq('project_id', projectId)
    if (error) throw new Error(error.message)
  }

  return galleryIds
}

export async function removeProjectGalleryItem(projectId: number, galleryId: number) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('project_galleries').delete().eq('id', galleryId).eq('project_id', projectId)
  if (error) throw new Error(error.message)
}

export async function uploadProjectAttachment(projectId: number, file: File, provider: StorageProvider = 'auto', fileName: string, documentType: string) {
  await requireProjectsAccess('manage')

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : null
  const path = `projects/${projectId}/documents/${Date.now()}${extension ? `.${extension}` : ''}`
  const fileUrl = await uploadPublicFile({
    file,
    path,
    cacheControl: '3600',
    upsert: false,
    provider,
  })

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('project_attachments')
    .insert({
      project_id: projectId,
      file_name: fileName.trim() || file.name,
      file_url: fileUrl,
      document_type: trimToNull(documentType),
      metadata: {},
    })
    .select('*')
    .single<ProjectAttachmentRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function removeProjectAttachment(projectId: number, attachmentId: string) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('project_attachments').delete().eq('id', attachmentId).eq('project_id', projectId)
  if (error) throw new Error(error.message)
}

export async function saveProjectFaq(projectId: number, faqId: number | null, input: ProjectFaqInput) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const payload = { project_id: projectId, ...sanitizeFaqInput(input) }

  if (faqId) {
    const { data, error } = await admin
      .from('faqs')
      .update(payload)
      .eq('id', faqId)
      .eq('project_id', projectId)
      .select('*')
      .single<ProjectFaqRecord>()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('faqs')
    .insert(payload)
    .select('*')
    .single<ProjectFaqRecord>()
  if (error) throw new Error(error.message)
  return data
}

export async function removeProjectFaq(projectId: number, faqId: number) {
  await requireProjectsAccess('manage')
  const admin = createAdminSupabaseClient()
  const { error } = await admin.from('faqs').delete().eq('id', faqId).eq('project_id', projectId)
  if (error) throw new Error(error.message)
}