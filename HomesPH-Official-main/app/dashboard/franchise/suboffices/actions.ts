'use server'

import { revalidatePath } from 'next/cache'
import { ACCOUNT_STATUS_APPROVED, normalizeAccountStatus } from '@/lib/account-status'
import {
  getCompanySystemRoleLabel,
  normalizeCompanySystemRole,
} from '@/lib/company-members'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type CompanyRow = {
  company_name: string | null
  id: number
  parent_company_id?: number | null
}

type AddressRow = {
  city: string | null
  company_id: number
  full_address: string | null
  latitude: number | null
  longitude: number | null
  place_id: string | null
  state: string | null
  street: string | null
  zip_code: string | null
}

type MembershipRow = {
  id?: number
  company_id: number
  system_role: string | null
  user_profile_id: string
}

type ProfileRow = {
  account_status: string | null
  fname: string | null
  full_name: string | null
  id: string
  is_active: boolean | null
  lname: string | null
}

export type SubofficeAssignableMember = {
  id: string
  name: string
  officeLabel: string
  roleLabel: string
}

async function getMyCompany() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const admin = createAdminSupabaseClient()
  const profileResult = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string }>()

  if (profileResult.error || !profileResult.data) {
    return null
  }

  const ownedCompanyResult = await admin
    .from('company_profiles')
    .select('id, company_name')
    .eq('user_profile_id', profileResult.data.id)
    .is('parent_company_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ company_name: string | null; id: number }>()

  if (ownedCompanyResult.error) {
    throw new Error(ownedCompanyResult.error.message)
  }

  if (ownedCompanyResult.data) {
    return {
      companyId: ownedCompanyResult.data.id,
      companyName: ownedCompanyResult.data.company_name?.trim() || '',
      profileId: profileResult.data.id,
    }
  }

  const ownerMembershipResult = await admin
    .from('company_members')
    .select('company_id')
    .eq('user_profile_id', profileResult.data.id)
    .eq('system_role', 'owner')
    .limit(1)
    .maybeSingle<{ company_id: number }>()

  if (ownerMembershipResult.error || !ownerMembershipResult.data?.company_id) {
    return null
  }

  const fallbackCompanyResult = await admin
    .from('company_profiles')
    .select('id, company_name')
    .eq('id', ownerMembershipResult.data.company_id)
    .is('parent_company_id', null)
    .maybeSingle<{ company_name: string | null; id: number }>()

  if (fallbackCompanyResult.error || !fallbackCompanyResult.data) {
    return null
  }

  return {
    companyId: fallbackCompanyResult.data.id,
    companyName: fallbackCompanyResult.data.company_name?.trim() || '',
    profileId: profileResult.data.id,
  }
}

function buildFullName(profile: ProfileRow | null | undefined) {
  if (!profile) {
    return 'Unknown Member'
  }

  return (
    profile.full_name?.trim() ||
    [profile.fname, profile.lname].filter(Boolean).join(' ').trim() ||
    'Unknown Member'
  )
}

async function getFranchiseScope() {
  const context = await getMyCompany()
  if (!context) {
    return null
  }

  const admin = createAdminSupabaseClient()
  const duplicateRootsResult = context.companyName
    ? await admin
        .from('company_profiles')
        .select('id')
        .eq('company_name', context.companyName)
        .is('parent_company_id', null)
        .neq('id', context.companyId)
        .is('user_profile_id', null)
        .returns<CompanyRow[]>()
    : { data: [], error: null }

  if (duplicateRootsResult.error) {
    throw new Error(duplicateRootsResult.error.message)
  }

  const subofficeResult = await admin
    .from('company_profiles')
    .select('id')
    .eq('parent_company_id', context.companyId)
    .returns<CompanyRow[]>()

  if (subofficeResult.error) {
    throw new Error(subofficeResult.error.message)
  }

  const duplicateRootIds = (duplicateRootsResult.data ?? []).map((row) => row.id)
  const subofficeIds = (subofficeResult.data ?? []).map((row) => row.id)

  return {
    ...context,
    duplicateRootIds,
    scopeCompanyIds: [context.companyId, ...duplicateRootIds, ...subofficeIds],
    subofficeIds,
  }
}

async function setSubofficeSecretaryAssignment(args: {
  admin: ReturnType<typeof createAdminSupabaseClient>
  officeId: number
  scopeCompanyIds: number[]
  secretaryProfileId: string | null
}) {
  const { admin, officeId, scopeCompanyIds, secretaryProfileId } = args

  const officeMembersResult = await admin
    .from('company_members')
    .select('id, company_id, system_role, user_profile_id')
    .eq('company_id', officeId)
    .returns<MembershipRow[]>()

  if (officeMembersResult.error) {
    throw new Error(officeMembersResult.error.message)
  }

  const officeMembers = officeMembersResult.data ?? []
  const secretaryRowsToDemote = officeMembers.filter(
    (member) =>
      normalizeCompanySystemRole(member.system_role, { officeIsSuboffice: true }) === 'suboffice_secretary' &&
      member.user_profile_id !== secretaryProfileId &&
      member.id,
  )

  if (secretaryRowsToDemote.length) {
    const { error: demoteError } = await admin
      .from('company_members')
      .update({ system_role: 'agent' })
      .in(
        'id',
        secretaryRowsToDemote
          .map((member) => member.id)
          .filter((value): value is number => typeof value === 'number'),
      )

    if (demoteError) {
      throw new Error(demoteError.message)
    }
  }

  if (!secretaryProfileId) {
    return
  }

  const membershipCheckResult = await admin
    .from('company_members')
    .select('company_id, system_role, user_profile_id')
    .eq('user_profile_id', secretaryProfileId)
    .in('company_id', scopeCompanyIds)
    .returns<MembershipRow[]>()

  if (membershipCheckResult.error) {
    throw new Error(membershipCheckResult.error.message)
  }

  const eligibleMembership = (membershipCheckResult.data ?? []).find((membership) =>
    normalizeCompanySystemRole(membership.system_role, { officeIsSuboffice: membership.company_id !== officeId }) === 'suboffice_secretary',
  )

  if (!eligibleMembership) {
    throw new Error('Only members promoted to Suboffice Secretary can be assigned here. Promote them from My Team first.')
  }

  const { error: clearExistingMembershipsError } = await admin
    .from('company_members')
    .delete()
    .eq('user_profile_id', secretaryProfileId)
    .in('company_id', scopeCompanyIds)

  if (clearExistingMembershipsError) {
    throw new Error(clearExistingMembershipsError.message)
  }

  const { error: insertSecretaryError } = await admin
    .from('company_members')
    .insert({
      company_id: officeId,
      system_role: 'suboffice_secretary',
      user_profile_id: secretaryProfileId,
    })

  if (insertSecretaryError) {
    throw new Error(insertSecretaryError.message)
  }
}

export async function fetchMySuboffices() {
  const context = await getMyCompany()
  if (!context) {
    return []
  }

  const admin = createAdminSupabaseClient()
  const subofficeResult = await admin
    .from('company_profiles')
    .select('id, company_name')
    .eq('parent_company_id', context.companyId)
    .order('created_at', { ascending: false })
    .returns<CompanyRow[]>()

  if (subofficeResult.error || !subofficeResult.data?.length) {
    return []
  }

  const suboffices = subofficeResult.data
  const subofficeIds = suboffices.map((office) => office.id)

  const [addressesResult, membershipsResult] = await Promise.all([
    admin
      .from('addresses')
      .select('company_id, full_address, street, city, state, zip_code, latitude, longitude, place_id')
      .in('company_id', subofficeIds),
    admin
      .from('company_members')
      .select('company_id, system_role, user_profile_id')
      .in('company_id', subofficeIds)
      .returns<MembershipRow[]>(),
  ])

  if (addressesResult.error) {
    throw new Error(addressesResult.error.message)
  }

  if (membershipsResult.error) {
    throw new Error(membershipsResult.error.message)
  }

  const profileIds = [...new Set((membershipsResult.data ?? []).map((member) => member.user_profile_id).filter(Boolean))]
  const profilesResult = profileIds.length
    ? await admin
        .from('user_profiles')
        .select('id, fname, lname, full_name, account_status, is_active')
        .in('id', profileIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null }

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  const addressMap = new Map<number, AddressRow>()
  for (const address of addressesResult.data ?? []) {
    if (!addressMap.has(address.company_id)) {
      addressMap.set(address.company_id, address)
    }
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
  const membersByOffice = new Map<number, MembershipRow[]>()

  for (const membership of membershipsResult.data ?? []) {
    const group = membersByOffice.get(membership.company_id) ?? []
    group.push(membership)
    membersByOffice.set(membership.company_id, group)
  }

  return suboffices.map((office) => {
    const address = addressMap.get(office.id)
    const officeMembers = membersByOffice.get(office.id) ?? []
    const secretaryMembership = officeMembers.find((member) =>
      normalizeCompanySystemRole(member.system_role, { officeIsSuboffice: true }) === 'suboffice_secretary',
    )
    const secretaryName = secretaryMembership ? buildFullName(profileMap.get(secretaryMembership.user_profile_id)) : null
    const activeMemberCount = officeMembers.filter((member) => {
      const profile = profileMap.get(member.user_profile_id)
      return normalizeAccountStatus(profile?.account_status, profile?.is_active) === ACCOUNT_STATUS_APPROVED
    }).length

    return {
      address: address
        ? {
            city: address.city ?? null,
            fullAddress: address.full_address ?? null,
            latitude: address.latitude ?? null,
            longitude: address.longitude ?? null,
            placeId: address.place_id ?? null,
            state: address.state ?? null,
            street: address.street ?? null,
            zipCode: address.zip_code ?? null,
          }
        : null,
      addressSummary:
        address?.full_address?.trim() ||
        [address?.city?.trim(), address?.state?.trim()].filter(Boolean).join(', ') ||
        null,
      id: String(office.id),
      memberCount: activeMemberCount,
      name: office.company_name?.trim() || 'Unnamed Suboffice',
      secretaryProfileId: secretaryMembership?.user_profile_id ?? null,
      secretaryName,
    }
  })
}

export async function fetchSubofficeAssignableMembers() {
  const context = await getFranchiseScope()
  if (!context) {
    return [] as SubofficeAssignableMember[]
  }

  const admin = createAdminSupabaseClient()
  const membershipsResult = await admin
    .from('company_members')
    .select('company_id, system_role, user_profile_id')
    .in('company_id', context.scopeCompanyIds)
    .in('system_role', ['suboffice_secretary', 'secretary'])
    .returns<MembershipRow[]>()

  if (membershipsResult.error) {
    throw new Error(membershipsResult.error.message)
  }

  const membershipRows = membershipsResult.data ?? []
  const profileIds = [...new Set(membershipRows.map((member) => member.user_profile_id).filter(Boolean))]
  if (!profileIds.length) {
    return [] as SubofficeAssignableMember[]
  }

  const officeIds = [...new Set(membershipRows.map((member) => member.company_id))]
  const [profilesResult, officesResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('id, fname, lname, full_name, account_status, is_active')
      .in('id', profileIds)
      .returns<ProfileRow[]>(),
    admin
      .from('company_profiles')
      .select('id, company_name')
      .in('id', officeIds)
      .returns<CompanyRow[]>(),
  ])

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  if (officesResult.error) {
    throw new Error(officesResult.error.message)
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
  const officeNameMap = new Map(
    (officesResult.data ?? []).map((office) => [office.id, office.company_name?.trim() || 'Unnamed Office']),
  )
  const assignableMembers = new Map<string, SubofficeAssignableMember>()

  for (const membership of membershipRows) {
    if (normalizeCompanySystemRole(membership.system_role, { officeIsSuboffice: membership.company_id !== context.companyId }) !== 'suboffice_secretary') {
      continue
    }

    if (assignableMembers.has(membership.user_profile_id)) {
      continue
    }

    const profile = profileMap.get(membership.user_profile_id)
    if (!profile) {
      continue
    }

    const normalizedStatus = normalizeAccountStatus(profile.account_status, profile.is_active)
    if (normalizedStatus !== ACCOUNT_STATUS_APPROVED) {
      continue
    }

    assignableMembers.set(membership.user_profile_id, {
      id: membership.user_profile_id,
      name: buildFullName(profile),
      officeLabel: membership.company_id === context.companyId
        ? 'Main Office'
        : officeNameMap.get(membership.company_id) || 'Suboffice',
      roleLabel: getCompanySystemRoleLabel(membership.system_role, membership.company_id !== context.companyId),
    })
  }

  return [...assignableMembers.values()].sort((left, right) => left.name.localeCompare(right.name))
}

export async function createSubofficeAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const fullAddress = String(formData.get('fullAddress') ?? '').trim()
  const street = String(formData.get('street') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const state = String(formData.get('state') ?? '').trim()
  const zipCode = String(formData.get('zipCode') ?? '').trim()
  const placeIdRaw = String(formData.get('placeId') ?? '').trim()
  const latitudeRaw = String(formData.get('latitude') ?? '').trim()
  const longitudeRaw = String(formData.get('longitude') ?? '').trim()
  const secretaryProfileIdRaw = String(formData.get('secretaryProfileId') ?? '').trim()
  const latitude = latitudeRaw ? Number(latitudeRaw) : null
  const longitude = longitudeRaw ? Number(longitudeRaw) : null
  const placeId = placeIdRaw || null
  const secretaryProfileId = secretaryProfileIdRaw || null

  if (!name) {
    return { message: 'Suboffice name is required.', success: false }
  }

  const context = await getFranchiseScope()
  if (!context) {
    return { message: 'You must have an active franchise profile to create suboffices.', success: false }
  }

  const admin = createAdminSupabaseClient()
  const { data: newOffice, error: insertError } = await admin
    .from('company_profiles')
    .insert({
      company_name: name,
      parent_company_id: context.companyId,
      user_profile_id: context.profileId,
    })
    .select('id')
    .maybeSingle<{ id: number }>()

  if (insertError || !newOffice) {
    return { message: insertError?.message || 'Failed to create suboffice.', success: false }
  }

  if (fullAddress || street || city || state || zipCode || placeId || latitude !== null || longitude !== null) {
    const { error: addressError } = await admin
      .from('addresses')
      .insert({
        city: city || null,
        company_id: newOffice.id,
        full_address: fullAddress || null,
        latitude,
        label: 'Branch Address',
        longitude,
        place_id: placeId,
        state: state || null,
        street: street || null,
        zip_code: zipCode || null,
      })

    if (addressError) {
      return { message: addressError.message, success: false }
    }
  }

  try {
    await setSubofficeSecretaryAssignment({
      admin,
      officeId: newOffice.id,
      scopeCompanyIds: [...context.scopeCompanyIds, newOffice.id],
      secretaryProfileId,
    })
  } catch (assignmentError: any) {
    return { message: assignmentError.message, success: false }
  }

  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/team')
  revalidatePath('/dashboard/franchise/suboffices')
  return { success: true }
}

export async function updateSubofficeAction(
  officeId: string,
  payload: {
    city: string
    fullAddress: string
    latitude: number | null
    longitude: number | null
    name: string
    placeId: string | null
    secretaryProfileId: string | null
    state: string
    street: string
    zipCode: string
  },
) {
  const context = await getFranchiseScope()
  if (!context) {
    return { message: 'Not authenticated.', success: false }
  }

  const admin = createAdminSupabaseClient()
  const numericOfficeId = Number(officeId)

  const ownershipResult = await admin
    .from('company_profiles')
    .select('id')
    .eq('id', numericOfficeId)
    .eq('parent_company_id', context.companyId)
    .maybeSingle<{ id: number }>()

  if (ownershipResult.error || !ownershipResult.data) {
    return { message: 'This suboffice is outside your franchise scope.', success: false }
  }

  const { error: profileError } = await admin
    .from('company_profiles')
    .update({ company_name: payload.name.trim() })
    .eq('id', numericOfficeId)

  if (profileError) {
    return { message: profileError.message, success: false }
  }

  const addressPayload = {
    city: payload.city.trim() || null,
    company_id: numericOfficeId,
    full_address: payload.fullAddress.trim() || null,
    latitude: payload.latitude,
    label: 'Branch Address',
    longitude: payload.longitude,
    place_id: payload.placeId,
    state: payload.state.trim() || null,
    street: payload.street.trim() || null,
    zip_code: payload.zipCode.trim() || null,
  }

  const { data: existingAddress, error: existingAddressError } = await admin
    .from('addresses')
    .select('id')
    .eq('company_id', numericOfficeId)
    .limit(1)
    .maybeSingle<{ id: number }>()

  if (existingAddressError) {
    return { message: existingAddressError.message, success: false }
  }

  if (existingAddress?.id) {
    const { error: addressUpdateError } = await admin
      .from('addresses')
      .update(addressPayload)
      .eq('id', existingAddress.id)

    if (addressUpdateError) {
      return { message: addressUpdateError.message, success: false }
    }
  } else {
    const { error: addressInsertError } = await admin
      .from('addresses')
      .insert(addressPayload)

    if (addressInsertError) {
      return { message: addressInsertError.message, success: false }
    }
  }

  try {
    await setSubofficeSecretaryAssignment({
      admin,
      officeId: numericOfficeId,
      scopeCompanyIds: context.scopeCompanyIds,
      secretaryProfileId: payload.secretaryProfileId,
    })
  } catch (assignmentError: any) {
    return { message: assignmentError.message, success: false }
  }

  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/team')
  revalidatePath('/dashboard/franchise/suboffices')
  return { success: true }
}
