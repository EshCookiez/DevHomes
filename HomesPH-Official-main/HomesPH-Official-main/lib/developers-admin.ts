import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { ensureImageFile, getImageExtension, uploadPublicFile, type StorageProvider } from '@/lib/storage'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type {
  AdminProjectRecord,
  DeveloperAddressInput,
  DeveloperAddressRecord,
  DeveloperContactInformationRecord,
  DeveloperContactInput,
  DeveloperContactPersonRecord,
  DeveloperDetailBundle,
  DeveloperFormInput,
  DeveloperProfileRecord,
  DeveloperProjectRecord,
  ManagedDeveloperRecord,
} from '@/lib/developers-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function sanitizeDeveloperInput(input: DeveloperFormInput) {
  const developerName = input.developer_name.trim()

  if (!developerName) {
    throw new Error('Developer name is required.')
  }

  return {
    developer_name: developerName,
    industry: trimToNull(input.industry),
    website_url: trimToNull(input.website_url),
    description: trimToNull(input.description),
  }
}

function buildContactFullName(input: DeveloperContactInput) {
  return [input.fname.trim(), input.mname.trim(), input.lname.trim()]
    .filter(Boolean)
    .join(' ')
    .trim() || null
}

function sanitizeContactInput(input: DeveloperContactInput) {
  const fname = input.fname.trim()
  const lname = input.lname.trim()

  if (!fname || !lname) {
    throw new Error('First name and last name are required.')
  }

  return {
    fname,
    mname: trimToNull(input.mname),
    lname,
    full_name: buildContactFullName(input),
    position: trimToNull(input.position),
    email: trimToNull(input.email),
    mobile_number: trimToNull(input.mobile_number),
    telephone: trimToNull(input.telephone),
  }
}

function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function sanitizeAddressInput(input: DeveloperAddressInput) {
  const label = input.label.trim()
  const street = input.street.trim()
  const city = input.city.trim()

  if (!label || !street || !city) {
    throw new Error('Label, street, and city are required.')
  }

  const fullAddress = [input.street, input.city, input.state, input.country, input.zip_code]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ')

  return {
    label,
    street,
    city,
    state: trimToNull(input.state),
    country: trimToNull(input.country) ?? 'Philippines',
    zip_code: trimToNull(input.zip_code),
    latitude: parseOptionalNumber(input.latitude),
    longitude: parseOptionalNumber(input.longitude),
    full_address: fullAddress || null,
  }
}

function isMissingActiveColumn(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return message.includes('is_active') && (message.includes('column') || message.includes('schema cache'))
}

function normalizeDeveloperActive<T extends DeveloperProfileRecord | DeveloperProfileRecord[] | null>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => ({ ...item, is_active: true })) as T
  }

  if (data && typeof data === 'object') {
    return { ...data, is_active: true } as T
  }

  return data
}

async function queryDevelopersProfiles<T>({
  buildWithActive,
  buildWithoutActive,
}: {
  buildWithActive: () => Promise<{ data: T | null; error: { message?: string } | null }>
  buildWithoutActive: () => Promise<{ data: T | null; error: { message?: string } | null }>
}) {
  const primary = await buildWithActive()

  if (!isMissingActiveColumn(primary.error)) {
    return primary
  }

  const fallback = await buildWithoutActive()
  return {
    data: normalizeDeveloperActive(fallback.data as any),
    error: fallback.error,
  }
}

export async function requireDevelopersAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getDevelopers(): Promise<ManagedDeveloperRecord[]> {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const [{ data, error }, projectsResult] = await Promise.all([
    queryDevelopersProfiles<DeveloperProfileRecord[]>({
      buildWithActive: async () =>
        await admin
          .from('developers_profiles')
          .select('id,user_profile_id,developer_name,industry,website_url,description,logo_url,is_active,created_at,updated_at')
          .order('created_at', { ascending: false }),
      buildWithoutActive: async () =>
        await admin
          .from('developers_profiles')
          .select('id,user_profile_id,developer_name,industry,website_url,description,logo_url,created_at,updated_at')
          .order('created_at', { ascending: false }),
    }),
    admin.from('projects').select('id,developer_id'),
  ])

  if (error) {
    throw new Error(error.message)
  }

  if (projectsResult.error) {
    throw new Error(projectsResult.error.message)
  }

  const projectCounts = new Map<number, number>()
  for (const project of projectsResult.data ?? []) {
    const developerId = Number(project.developer_id)
    if (!developerId) continue
    projectCounts.set(developerId, (projectCounts.get(developerId) ?? 0) + 1)
  }

  return (data ?? []).map((developer: DeveloperProfileRecord) => ({
    ...developer,
    is_active: Boolean(developer.is_active ?? true),
    projectsCount: projectCounts.get(developer.id) ?? 0,
  }))
}

export async function getDeveloperById(id: number): Promise<DeveloperDetailBundle | null> {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const developerResult = await queryDevelopersProfiles<DeveloperProfileRecord>({
    buildWithActive: async () =>
      await admin
        .from('developers_profiles')
        .select('id,user_profile_id,developer_name,industry,website_url,description,logo_url,is_active,created_at,updated_at')
        .eq('id', id)
        .maybeSingle(),
    buildWithoutActive: async () =>
      await admin
        .from('developers_profiles')
        .select('id,user_profile_id,developer_name,industry,website_url,description,logo_url,created_at,updated_at')
        .eq('id', id)
        .maybeSingle(),
  })

  if (developerResult.error) {
    throw new Error(developerResult.error.message)
  }

  if (!developerResult.data) {
    return null
  }

  const [contactsResult, addressesResult, projectsResult, channelsResult] = await Promise.all([
    admin
      .from('developer_contact_persons')
      .select('*')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('addresses')
      .select('id,developer_id,label,full_address,street,city,state,country,zip_code,latitude,longitude,created_at,updated_at')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('projects')
      .select('id,name,slug,province,city_municipality,status,currency,price_range_min,price_range_max,created_at')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('contact_information')
      .select('id,primary_mobile,secondary_mobile,telephone,email,facebook_url,twitter_url,instagram_url,linkedin_url,website_url')
      .eq('developer_id', id)
      .maybeSingle(),
  ])

  if (contactsResult.error) throw new Error(contactsResult.error.message)
  if (addressesResult.error) throw new Error(addressesResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (channelsResult.error) throw new Error(channelsResult.error.message)

  return {
    developer: {
      ...developerResult.data,
      is_active: Boolean(developerResult.data.is_active ?? true),
      projectsCount: (projectsResult.data ?? []).length,
    },
    contacts: (contactsResult.data ?? []) as DeveloperContactPersonRecord[],
    addresses: (addressesResult.data ?? []) as DeveloperAddressRecord[],
    projects: (projectsResult.data ?? []) as DeveloperProjectRecord[],
    contactInformation: (channelsResult.data ?? null) as DeveloperContactInformationRecord | null,
  }
}

export async function createDeveloper(input: DeveloperFormInput) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const payload = sanitizeDeveloperInput(input)

  let result = await admin
    .from('developers_profiles')
    .insert({ ...payload, is_active: true })
    .select('id')
    .single<{ id: number }>()

  if (isMissingActiveColumn(result.error)) {
    result = await admin
      .from('developers_profiles')
      .insert(payload)
      .select('id')
      .single<{ id: number }>()
  }

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? 'Unable to create developer.')
  }

  const bundle = await getDeveloperById(result.data.id)
  if (!bundle) {
    throw new Error('Developer created but could not be retrieved.')
  }

  return bundle.developer
}

export async function updateDeveloper(id: number, input: DeveloperFormInput) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const payload = sanitizeDeveloperInput(input)
  const { error } = await admin
    .from('developers_profiles')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const bundle = await getDeveloperById(id)
  if (!bundle) {
    throw new Error('Developer not found.')
  }

  return bundle.developer
}

export async function uploadDeveloperLogo(id: number, file: File, provider: StorageProvider = 'auto') {
  await requireDevelopersAccess()
  ensureImageFile(file, 10)

  const extension = getImageExtension(file)
  const logoUrl = await uploadPublicFile({
    file,
    path: `developers/${id}/logo-${Date.now()}.${extension}`,
    cacheControl: '3600',
    upsert: true,
    provider,
  })

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('developers_profiles')
    .update({ logo_url: logoUrl })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  const bundle = await getDeveloperById(id)
  if (!bundle) {
    throw new Error('Developer not found.')
  }

  return bundle.developer
}

export async function setDeveloperActive(id: number, isActive: boolean) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('developers_profiles')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    if (isMissingActiveColumn(error)) {
      throw new Error('developers_profiles.is_active is required for activation controls. Apply the latest schema update first.')
    }

    throw new Error(error.message)
  }

  const bundle = await getDeveloperById(id)
  if (!bundle) {
    throw new Error('Developer not found.')
  }

  return bundle.developer
}

export async function deleteDeveloper(id: number) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('developers_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function saveDeveloperContact(developerId: number, contactId: number | null, input: DeveloperContactInput) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const payload = {
    developer_id: developerId,
    ...sanitizeContactInput(input),
  }

  if (contactId) {
    const { data, error } = await admin
      .from('developer_contact_persons')
      .update(payload)
      .eq('id', contactId)
      .eq('developer_id', developerId)
      .select('*')
      .single<DeveloperContactPersonRecord>()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('developer_contact_persons')
    .insert(payload)
    .select('*')
    .single<DeveloperContactPersonRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function removeDeveloperContact(developerId: number, contactId: number) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('developer_contact_persons')
    .delete()
    .eq('id', contactId)
    .eq('developer_id', developerId)

  if (error) throw new Error(error.message)
}

export async function saveDeveloperAddress(developerId: number, addressId: number | null, input: DeveloperAddressInput) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const payload = {
    developer_id: developerId,
    ...sanitizeAddressInput(input),
  }

  if (addressId) {
    const { data, error } = await admin
      .from('addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('developer_id', developerId)
      .select('id,developer_id,label,full_address,street,city,state,country,zip_code,latitude,longitude,created_at,updated_at')
      .single<DeveloperAddressRecord>()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('addresses')
    .insert(payload)
    .select('id,developer_id,label,full_address,street,city,state,country,zip_code,latitude,longitude,created_at,updated_at')
    .single<DeveloperAddressRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function removeDeveloperAddress(developerId: number, addressId: number) {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('developer_id', developerId)

  if (error) throw new Error(error.message)
}

export async function getProjectById(id: number): Promise<AdminProjectRecord | null> {
  await requireDevelopersAccess()

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('projects')
    .select('id,name,slug,province,city_municipality,status,currency,price_range_min,price_range_max,created_at,address_details,project_type,classification,developers_profiles(developer_name)')
    .eq('id', id)
    .maybeSingle<{
      id: number
      name: string
      slug: string | null
      province: string | null
      city_municipality: string | null
      status: string | null
      currency: string | null
      price_range_min: number | null
      price_range_max: number | null
      created_at: string | null
      address_details: string | null
      project_type: string | null
      classification: string | null
      developers_profiles: { developer_name: string | null } | null
    }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    province: data.province,
    city_municipality: data.city_municipality,
    status: data.status,
    currency: data.currency,
    price_range_min: data.price_range_min,
    price_range_max: data.price_range_max,
    created_at: data.created_at,
    address_details: data.address_details,
    project_type: data.project_type,
    classification: data.classification,
    developer_name: data.developers_profiles?.developer_name ?? null,
  }
}