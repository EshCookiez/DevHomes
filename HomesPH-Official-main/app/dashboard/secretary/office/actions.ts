'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getPreferredCompanyMembershipForProfile } from '@/lib/company-members'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

async function getSecretaryOfficeContext() {
  const user = await getCurrentDashboardUser()
  if (!user || user.role !== 'franchise_secretary') {
    throw new Error('Only the Secretary can manage office details.')
  }

  const admin = createAdminSupabaseClient()
  const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
    allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
  })

  if (!membership?.companyId) {
    throw new Error('Secretary is not linked to an office.')
  }

  return {
    admin,
    companyId: membership.companyId,
    user,
  }
}

export async function fetchSecretaryOfficeDetails() {
  const { admin, companyId } = await getSecretaryOfficeContext()
  const [companyResult, addressResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('company_name')
      .eq('id', companyId)
      .maybeSingle<{ company_name: string | null }>(),
    admin
      .from('addresses')
      .select('id, full_address, street, city, state, zip_code, latitude, longitude, place_id')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle<{
        id: number
        full_address: string | null
        street: string | null
        city: string | null
        state: string | null
        zip_code: string | null
        latitude: number | null
        longitude: number | null
        place_id: string | null
      }>(),
  ])

  if (companyResult.error) {
    throw new Error(companyResult.error.message)
  }

  if (addressResult.error) {
    throw new Error(addressResult.error.message)
  }

  return {
    companyName: companyResult.data?.company_name?.trim() || '',
    addressId: addressResult.data?.id ?? null,
    fullAddress: addressResult.data?.full_address?.trim() || '',
    street: addressResult.data?.street?.trim() || '',
    city: addressResult.data?.city?.trim() || '',
    state: addressResult.data?.state?.trim() || '',
    zipCode: addressResult.data?.zip_code?.trim() || '',
    latitude: addressResult.data?.latitude ?? null,
    longitude: addressResult.data?.longitude ?? null,
    placeId: addressResult.data?.place_id?.trim() || '',
  }
}

export async function saveSecretaryOfficeDetailsAction(payload: {
  companyName: string
  fullAddress: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  placeId: string | null
}) {
  const { admin, companyId } = await getSecretaryOfficeContext()

  const { error: companyError } = await admin
    .from('company_profiles')
    .update({ company_name: payload.companyName.trim() || null })
    .eq('id', companyId)

  if (companyError) {
    throw new Error(companyError.message)
  }

  const addressPayload = {
    company_id: companyId,
    full_address: payload.fullAddress.trim() || null,
    street: payload.street.trim() || null,
    city: payload.city.trim() || null,
    state: payload.state.trim() || null,
    zip_code: payload.zipCode.trim() || null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    place_id: payload.placeId?.trim() || null,
    label: 'Office Address',
  }

  const { data: existingAddress, error: existingAddressError } = await admin
    .from('addresses')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)
    .maybeSingle<{ id: number }>()

  if (existingAddressError) {
    throw new Error(existingAddressError.message)
  }

  if (existingAddress?.id) {
    const { error: addressUpdateError } = await admin
      .from('addresses')
      .update(addressPayload)
      .eq('id', existingAddress.id)

    if (addressUpdateError) {
      throw new Error(addressUpdateError.message)
    }
  } else {
    const { error: addressInsertError } = await admin
      .from('addresses')
      .insert(addressPayload)

    if (addressInsertError) {
      throw new Error(addressInsertError.message)
    }
  }

  revalidatePath('/dashboard/secretary')
  revalidatePath('/dashboard/secretary/office')
  return { success: true, message: 'Office details updated.' }
}
