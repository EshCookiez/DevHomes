'use server'

import { headers } from 'next/headers'
import {
  ACCOUNT_STATUS_PENDING_APPROVAL,
  isMissingAccountStateColumnError,
} from '@/lib/account-status'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type RegistrationRole = 'broker' | 'developer' | 'salesperson'

interface BaseRegistrationInput {
  role: RegistrationRole
  fname: string
  lname: string
  email: string
  phone: string
  password: string
}

interface BrokerRegistrationInput extends BaseRegistrationInput {
  role: 'broker' | 'salesperson'
  prcNumber?: string | null
}

interface DeveloperRegistrationInput extends BaseRegistrationInput {
  role: 'developer'
  companyName: string
}

export type RegisterAccountInput = BrokerRegistrationInput | DeveloperRegistrationInput

export interface RegisterAccountResult {
  success: boolean
  message: string
  email?: string
}

function trimValue(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildFullName(fname: string, lname: string) {
  return [fname, lname].filter(Boolean).join(' ').trim()
}

async function upsertContactInformation(admin: ReturnType<typeof createAdminSupabaseClient>, userProfileId: string, email: string, phone: string) {
  const { data: existingContact, error: contactLookupError } = await admin
    .from('contact_information')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ id: number }>()

  if (contactLookupError) {
    throw new Error(contactLookupError.message)
  }

  const payload = {
    user_profile_id: userProfileId,
    email,
    primary_mobile: phone,
  }

  if (existingContact?.id) {
    const { error } = await admin
      .from('contact_information')
      .update(payload)
      .eq('id', existingContact.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('contact_information')
    .insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}

async function upsertDeveloperProfile(admin: ReturnType<typeof createAdminSupabaseClient>, userProfileId: string, developerName: string) {
  const { data: existingDeveloper, error: developerLookupError } = await admin
    .from('developers_profiles')
    .select('id')
    .eq('user_profile_id', userProfileId)
    .maybeSingle<{ id: number }>()

  if (developerLookupError) {
    throw new Error(developerLookupError.message)
  }

  const payload = {
    user_profile_id: userProfileId,
    developer_name: developerName,
    is_active: false,
  }

  if (existingDeveloper?.id) {
    const { error } = await admin
      .from('developers_profiles')
      .update(payload)
      .eq('id', existingDeveloper.id)

    if (error) {
      if (error.message?.toLowerCase().includes('is_active')) {
        throw new Error('developers_profiles.is_active is required for approval-based registration. Apply the latest schema update first.')
      }

      throw new Error(error.message)
    }

    return
  }

  const { error } = await admin
    .from('developers_profiles')
    .insert(payload)

  if (error) {
    if (error.message?.toLowerCase().includes('is_active')) {
      throw new Error('developers_profiles.is_active is required for approval-based registration. Apply the latest schema update first.')
    }

    throw new Error(error.message)
  }
}

export async function registerAccountAction(input: RegisterAccountInput): Promise<RegisterAccountResult> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const normalizedOrigin = origin.replace(/\/$/, '')

  const fname = trimValue(input.fname)
  const lname = trimValue(input.lname)
  const email = trimValue(input.email).toLowerCase()
  const phone = trimValue(input.phone)
  const password = input.password

  if (!fname || !lname) {
    return { success: false, message: 'First name and last name are required.' }
  }

  if (!email) {
    return { success: false, message: 'Email is required.' }
  }

  if (!phone) {
    return { success: false, message: 'Phone number is required.' }
  }

  if (!password || password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' }
  }

  if (input.role === 'developer' && !trimValue(input.companyName)) {
    return { success: false, message: 'Company / developer name is required.' }
  }

  const supabase = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()
  const fullName = buildFullName(fname, lname)

  let licensedPrcNumber: string | null = null
  if (input.role === 'broker' || input.role === 'salesperson') {
    licensedPrcNumber = trimToNull(input.prcNumber)
  }

  const metadata = {
    first_name: fname,
    last_name: lname,
    full_name: fullName,
    phone,
    role: input.role,
    ...(input.role === 'developer' ? { company_name: trimValue(input.companyName) } : {}),
    prc_number: licensedPrcNumber,
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${normalizedOrigin}/login?notice=approval-pending`,
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  const authUser = data.user

  if (!authUser) {
    return { success: false, message: 'Unable to create user account.' }
  }

  if (Array.isArray(authUser.identities) && authUser.identities.length === 0) {
    return {
      success: false,
      message: 'An account with this email already exists or is awaiting confirmation.',
    }
  }

  try {
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .upsert({
        user_id: authUser.id,
        fname,
        lname,
        full_name: fullName,
        role: input.role,
        prc_number: licensedPrcNumber,
        is_active: false,
        account_status: ACCOUNT_STATUS_PENDING_APPROVAL,
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
      }, { onConflict: 'user_id' })
      .select('id')
      .single<{ id: string }>()

    if (profileError || !profile) {
      if (isMissingAccountStateColumnError(profileError)) {
        throw new Error('user_profiles.account_status and review fields are required for approval-based registration. Apply the latest schema update first.')
      }

      throw new Error(profileError?.message ?? 'Unable to create user profile.')
    }

    await upsertContactInformation(admin, profile.id, email, phone)

    if (input.role === 'developer') {
      await upsertDeveloperProfile(admin, profile.id, trimValue(input.companyName))
    }

    await supabase.auth.signOut()

    return {
      success: true,
      message: 'Account created. Verify your email to place your registration in the admin approval queue.',
      email,
    }
  } catch (persistError) {
    await admin.auth.admin.deleteUser(authUser.id)

    return {
      success: false,
      message: persistError instanceof Error ? persistError.message : 'Unable to finish registration.',
    }
  }
}