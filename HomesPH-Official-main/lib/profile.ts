import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { getProfileCompletionStatus } from '@/lib/profile-completion'
import { ensureImageFile, getImageExtension, uploadPublicFile } from '@/lib/storage'
import type {
  AddressInput,
  AddressRecord,
  ContactInformationRecord,
  ContactInput,
  ProfileBundle,
  UserProfileRecord,
} from '@/lib/profile-types'

const EMPTY_CONTACT = (profileId: string): ContactInformationRecord => ({
  id: null,
  user_profile_id: profileId,
  primary_mobile: null,
  secondary_mobile: null,
  telephone: null,
  email: null,
  facebook_url: null,
  twitter_url: null,
  instagram_url: null,
  linkedin_url: null,
  website_url: null,
})

function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function requireAuthenticatedProfile() {
  const dashboardUser = await getCurrentDashboardUser()
  if (!dashboardUser) return null

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return { dashboardUser, authUser: user }
}

export async function getCurrentProfileBundle(): Promise<ProfileBundle | null> {
  const session = await requireAuthenticatedProfile()
  if (!session) return null

  const admin = createAdminSupabaseClient()
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.authUser.id)
    .maybeSingle<UserProfileRecord>()

  if (profileError || !profile) {
    return null
  }

  const [{ data: contact }, { data: addresses }] = await Promise.all([
    admin
      .from('contact_information')
      .select('*')
      .eq('user_profile_id', profile.id)
      .maybeSingle<ContactInformationRecord>(),
    admin
      .from('addresses')
      .select('*')
      .eq('user_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .returns<AddressRecord[]>(),
  ])

  const resolvedContact = contact ?? EMPTY_CONTACT(profile.id)
  const completion = getProfileCompletionStatus(profile, resolvedContact)

  return {
    profile,
    contact: resolvedContact,
    addresses: addresses ?? [],
    lastLoginAt: session.authUser.last_sign_in_at ?? null,
    completion,
  }
}

export async function updateBasicProfile(input: { fname: string; mname: string; lname: string }) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const fname = input.fname.trim()
  const mname = trimToNull(input.mname)
  const lname = input.lname.trim()
  const fullName = [fname, lname].filter(Boolean).join(' ').trim()

  const { data, error } = await admin
    .from('user_profiles')
    .update({ fname, mname, lname, full_name: fullName })
    .eq('id', bundle.profile.id)
    .select('*')
    .single<UserProfileRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function updatePersonalProfile(input: { gender: string; birthday: string | null }) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('user_profiles')
    .update({
      gender: trimToNull(input.gender),
      birthday: input.birthday || null,
    })
    .eq('id', bundle.profile.id)
    .select('*')
    .single<UserProfileRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function updateProfileImage(profileImageUrl: string) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('user_profiles')
    .update({ profile_image_url: profileImageUrl })
    .eq('id', bundle.profile.id)
    .select('*')
    .single<UserProfileRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function uploadProfileImage(file: File) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  ensureImageFile(file, 5)

  const extension = getImageExtension(file)
  const path = `profiles/${bundle.profile.user_id}/avatar-${Date.now()}.${extension}`
  const profileImageUrl = await uploadPublicFile({
    file,
    path,
    cacheControl: '3600',
    upsert: true,
  })

  await updateProfileImage(profileImageUrl)

  return { profileImageUrl }
}

export async function upsertContactInformation(input: ContactInput) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const payload = {
    user_profile_id: bundle.profile.id,
    primary_mobile: trimToNull(input.primary_mobile),
    secondary_mobile: trimToNull(input.secondary_mobile),
    telephone: trimToNull(input.telephone),
    email: trimToNull(input.email),
    facebook_url: trimToNull(input.facebook_url),
    twitter_url: trimToNull(input.twitter_url),
    instagram_url: trimToNull(input.instagram_url),
    linkedin_url: trimToNull(input.linkedin_url),
    website_url: trimToNull(input.website_url),
  }

  if (bundle.contact.id) {
    const { data, error } = await admin
      .from('contact_information')
      .update(payload)
      .eq('id', bundle.contact.id)
      .select('*')
      .single<ContactInformationRecord>()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('contact_information')
    .insert(payload)
    .select('*')
    .single<ContactInformationRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function saveAddress(id: number | null, input: AddressInput) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const fullAddress = [input.street, input.city, input.state, input.country, input.zip_code]
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ')

  const payload = {
    user_profile_id: bundle.profile.id,
    label: trimToNull(input.label),
    street: trimToNull(input.street),
    city: trimToNull(input.city),
    state: trimToNull(input.state),
    country: trimToNull(input.country) ?? 'Philippines',
    zip_code: trimToNull(input.zip_code),
    latitude: parseOptionalNumber(input.latitude),
    longitude: parseOptionalNumber(input.longitude),
    full_address: fullAddress || null,
  }

  if (id) {
    const { data, error } = await admin
      .from('addresses')
      .update(payload)
      .eq('id', id)
      .eq('user_profile_id', bundle.profile.id)
      .select('*')
      .single<AddressRecord>()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await admin
    .from('addresses')
    .insert(payload)
    .select('*')
    .single<AddressRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function removeAddress(id: number) {
  const bundle = await getCurrentProfileBundle()
  if (!bundle) throw new Error('Unauthenticated.')

  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_profile_id', bundle.profile.id)

  if (error) throw new Error(error.message)
}

export async function updatePassword(password: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export async function sendPasswordReset(email: string) {
  const supabase = await createServerSupabaseClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw new Error(error.message)
}
