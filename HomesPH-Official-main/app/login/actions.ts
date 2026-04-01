'use server'

import {
  canAccessDashboardAccount,
  getInactiveAccountMessage,
} from '@/lib/account-status'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getUserProfileWithAccountStateFallback } from '@/lib/auth/profile-query'
import type { LoginFormState } from '@/lib/auth/types'

const INVALID_CREDENTIALS = 'Invalid email or password.'
const PROFILE_NOT_FOUND = 'Your account does not have an assigned dashboard role yet.'
const EMAIL_NOT_CONFIRMED = 'Please verify your email before logging in.'
const TOO_MANY_ATTEMPTS = 'Too many login attempts. Please wait a moment and try again.'
const PROFILE_LOOKUP_FAILED = 'We could not load your dashboard profile. Please try again.'
const SIGN_IN_FAILED = 'Unable to sign in right now. Please try again.'

function getLoginErrorMessage(message: string | undefined) {
  const normalized = message?.toLowerCase() ?? ''

  if (!normalized) return INVALID_CREDENTIALS
  if (normalized.includes('invalid login credentials') || normalized.includes('invalid email or password')) return INVALID_CREDENTIALS
  if (normalized.includes('email not confirmed') || normalized.includes('email address not confirmed')) return EMAIL_NOT_CONFIRMED
  if (normalized.includes('too many requests') || normalized.includes('rate limit')) return TOO_MANY_ATTEMPTS

  return message ?? SIGN_IN_FAILED
}

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: getLoginErrorMessage(error.message) }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    await supabase.auth.signOut()
    return { error: getLoginErrorMessage(userError?.message) }
  }

  const { data: profile, error: profileError } = await getUserProfileWithAccountStateFallback<{
    role: string | null
    rejection_reason?: string | null
  }>({
    supabase,
    userId: user.id,
    selectWithAccountState: 'role,is_active,account_status,rejection_reason',
    selectWithoutAccountState: 'role,is_active',
  })

  if (profileError) {
    await supabase.auth.signOut()
    return { error: PROFILE_LOOKUP_FAILED }
  }

  if (profile && !canAccessDashboardAccount(profile)) {
    await supabase.auth.signOut()
    return {
      error: getInactiveAccountMessage(profile.account_status, profile.is_active, profile.rejection_reason),
    }
  }

  const destination = getDashboardPathForRole(profile?.role)

  if (!destination) {
    await supabase.auth.signOut()
    return { error: PROFILE_NOT_FOUND }
  }

  redirect(destination)
}
