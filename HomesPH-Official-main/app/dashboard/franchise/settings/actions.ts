'use server'

import { revalidatePath } from 'next/cache'
import {
  getCompanySystemRoleLabel,
  normalizeCompanySystemRole,
} from '@/lib/company-members'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ProfileRow = {
  fname: string | null
  full_name: string | null
  id: string
  lname: string | null
  prc_number?: string | null
}

type ContactRow = {
  email: string | null
  user_profile_id: string
}

type MembershipRow = {
  company_id: number
  system_role: string | null
  user_profile_id: string
}

type CompanyScopeRow = {
  id: number
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
    .select('id, prc_number')
    .eq('user_id', user.id)
    .maybeSingle<{ id: string; prc_number: string | null }>()

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
      companyName: ownedCompanyResult.data.company_name ?? '',
      licenseNumber: profileResult.data.prc_number ?? '',
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
    companyName: fallbackCompanyResult.data.company_name ?? '',
    licenseNumber: profileResult.data.prc_number ?? '',
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

export async function fetchOrgSettings() {
  const company = await getMyCompany()
  const admin = createAdminSupabaseClient()

  if (!company) {
    return {
      address: null,
      availableMembers: [],
      companyId: '',
      companyName: '',
      currentSecretaryId: null,
      licenseNumber: '',
    }
  }

  const duplicateRootsResult = company.companyName.trim()
    ? await admin
        .from('company_profiles')
        .select('id')
        .eq('company_name', company.companyName.trim())
        .is('parent_company_id', null)
        .neq('id', company.companyId)
        .is('user_profile_id', null)
        .returns<CompanyScopeRow[]>()
    : { data: [], error: null }

  if (duplicateRootsResult.error) {
    throw new Error(duplicateRootsResult.error.message)
  }

  const memberScopeCompanyIds = [
    company.companyId,
    ...(duplicateRootsResult.data ?? []).map((row) => row.id),
  ]

  const [addressResult, memberRowsResult] = await Promise.all([
    admin
      .from('addresses')
      .select('id, full_address, street, city, state, zip_code, latitude, longitude, place_id')
      .eq('company_id', company.companyId)
      .limit(1)
      .maybeSingle(),
    admin
      .from('company_members')
      .select('company_id, user_profile_id, system_role')
      .in('company_id', memberScopeCompanyIds)
      .in('system_role', ['agent', 'main_secretary', 'suboffice_secretary', 'secretary'])
      .returns<MembershipRow[]>(),
  ])

  const memberRows = memberRowsResult.data ?? []
  const memberProfileIds = [...new Set(memberRows.map((row) => row.user_profile_id).filter(Boolean))]

  const [profilesResult, contactsResult] = memberProfileIds.length
    ? await Promise.all([
        admin
          .from('user_profiles')
          .select('id, fname, lname, full_name')
          .in('id', memberProfileIds)
          .returns<ProfileRow[]>(),
        admin
          .from('contact_information')
          .select('user_profile_id, email')
          .in('user_profile_id', memberProfileIds)
          .returns<ContactRow[]>(),
      ])
    : [{ data: [], error: null }, { data: [], error: null }]

  if (addressResult.error) {
    throw new Error(addressResult.error.message)
  }

  if (memberRowsResult.error) {
    throw new Error(memberRowsResult.error.message)
  }

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }

  if (contactsResult.error) {
    throw new Error(contactsResult.error.message)
  }

  const profileMap = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
  const contactMap = new Map((contactsResult.data ?? []).map((contact) => [contact.user_profile_id, contact]))
  const mainSecretaryMemberships = memberRows.filter((row) => {
    return row.company_id === company.companyId && normalizeCompanySystemRole(row.system_role, { officeIsSuboffice: false }) === 'main_secretary'
  })
  const currentSecretaryId = mainSecretaryMemberships[0]?.user_profile_id ?? null
  const availableMembers = mainSecretaryMemberships.map((row) => ({
    email: contactMap.get(row.user_profile_id)?.email?.trim() ?? '',
    id: row.user_profile_id,
    name: buildFullName(profileMap.get(row.user_profile_id)),
    roleLabel: getCompanySystemRoleLabel(row.system_role, false),
  }))

  return {
    address: addressResult.data ?? null,
    availableMembers,
    companyId: String(company.companyId),
    companyName: company.companyName,
    currentSecretaryId,
    licenseNumber: company.licenseNumber,
  }
}

export async function saveOrgAddressAction(payload: {
  companyId: string
  companyName: string
  fullAddress: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  placeId: string | null
  secretaryProfileId: string | null
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'Not authenticated.', success: false }
  }

  const admin = createAdminSupabaseClient()
  const companyId = Number(payload.companyId)
  const [subofficeIdsResult, duplicateRootsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id')
      .eq('parent_company_id', companyId)
      .returns<CompanyScopeRow[]>(),
    payload.companyName.trim()
      ? admin
          .from('company_profiles')
          .select('id')
          .eq('company_name', payload.companyName.trim())
          .is('parent_company_id', null)
          .neq('id', companyId)
          .is('user_profile_id', null)
          .returns<CompanyScopeRow[]>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (subofficeIdsResult.error) {
    return { message: subofficeIdsResult.error.message, success: false }
  }

  if (duplicateRootsResult.error) {
    return { message: duplicateRootsResult.error.message, success: false }
  }

  const scopeCompanyIds = [
    companyId,
    ...(subofficeIdsResult.data ?? []).map((row) => row.id),
    ...(duplicateRootsResult.data ?? []).map((row) => row.id),
  ]

  if (payload.companyName.trim()) {
    const { error: companyError } = await admin
      .from('company_profiles')
      .update({ company_name: payload.companyName.trim() })
      .eq('id', companyId)

    if (companyError) {
      return { message: companyError.message, success: false }
    }
  }

  const addressPayload = {
    city: payload.city.trim() || null,
    company_id: companyId,
    full_address: payload.fullAddress.trim() || null,
    label: 'Head Office',
    latitude: payload.latitude,
    longitude: payload.longitude,
    place_id: payload.placeId,
    state: payload.state.trim() || null,
    street: payload.street.trim() || null,
    zip_code: payload.zipCode.trim() || null,
  }

  const { data: existingAddress, error: existingAddressError } = await admin
    .from('addresses')
    .select('id')
    .eq('company_id', companyId)
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

  if (!payload.secretaryProfileId) {
    const { error: clearMainSecretaryError } = await admin
      .from('company_members')
      .update({ system_role: 'agent' })
      .eq('company_id', companyId)
      .in('system_role', ['main_secretary', 'secretary'])

    if (clearMainSecretaryError) {
      return { message: clearMainSecretaryError.message, success: false }
    }
  } else {
    const { data: selectedMemberships, error: selectedMembershipsError } = await admin
      .from('company_members')
      .select('company_id, system_role, user_profile_id')
      .eq('user_profile_id', payload.secretaryProfileId)
      .in('company_id', scopeCompanyIds)
      .returns<MembershipRow[]>()

    if (selectedMembershipsError) {
      return { message: selectedMembershipsError.message, success: false }
    }

    const secretaryMembership = (selectedMemberships ?? []).find((membership) =>
      normalizeCompanySystemRole(membership.system_role, { officeIsSuboffice: membership.company_id !== companyId }) === 'main_secretary',
    )

    if (!secretaryMembership) {
      return {
        message: 'Only members promoted to Main Secretary can be assigned here. Promote them from My Team first.',
        success: false,
      }
    }

    const { error: clearCurrentSecretaryError } = await admin
      .from('company_members')
      .update({ system_role: 'agent' })
      .eq('company_id', companyId)
      .in('system_role', ['main_secretary', 'secretary'])
      .neq('user_profile_id', payload.secretaryProfileId)

    if (clearCurrentSecretaryError) {
      return { message: clearCurrentSecretaryError.message, success: false }
    }

    const { error: removeSelectedMembershipsError } = await admin
      .from('company_members')
      .delete()
      .eq('user_profile_id', payload.secretaryProfileId)
      .in('company_id', scopeCompanyIds)

    if (removeSelectedMembershipsError) {
      return { message: removeSelectedMembershipsError.message, success: false }
    }

    const { error: mainSecretaryInsertError } = await admin
      .from('company_members')
      .insert({
        company_id: companyId,
        system_role: 'main_secretary',
        user_profile_id: payload.secretaryProfileId,
      })

    if (mainSecretaryInsertError) {
      return { message: mainSecretaryInsertError.message, success: false }
    }
  }

  revalidatePath('/dashboard/franchise')
  revalidatePath('/dashboard/franchise/settings')
  revalidatePath('/dashboard/franchise/suboffices')
  return { success: true }
}
