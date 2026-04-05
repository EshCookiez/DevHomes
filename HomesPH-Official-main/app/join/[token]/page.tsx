import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import RegistrationForm from '@/components/auth/RegistrationForm'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'
import type { RegistrationRole } from '@/app/registration/actions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'

interface JoinPageParams {
  token: string
}

interface JoinPageProps {
  params: JoinPageParams | Promise<JoinPageParams>
}

const VALID_INVITED_ROLES = new Set([
  'developer',
  'salesperson',
  'ambassador',
  'franchise',
  'franchise_secretary',
])

export const metadata: Metadata = {
  title: 'Join HomesPH',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

async function getInvitation(token: string) {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('company_invitations')
    .select('email, invited_role, status, expires_at')
    .eq('invitation_token', token)
    .maybeSingle<{
      email: string
      invited_role: string
      status: string
      expires_at: string
    }>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminSupabaseClient()
  const normalizedEmail = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(error.message)
    }

    const existingAuthUser =
      data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ?? null

    if (existingAuthUser) {
      return existingAuthUser
    }

    if (data.users.length < perPage) {
      break
    }

    page += 1
  }

  return null
}

async function findExistingInviteProfile(email: string | null | undefined) {
  if (!email?.trim()) {
    return null
  }

  const admin = createAdminSupabaseClient()
  const normalizedEmail = email.trim().toLowerCase()
  const existingAuthUser = await findAuthUserByEmail(normalizedEmail)

  if (!existingAuthUser) {
    return null
  }

  const { data: contact, error: contactError } = await admin
    .from('contact_information')
    .select('user_profile_id')
    .eq('email', normalizedEmail)
    .maybeSingle<{ user_profile_id: string }>()

  if (contactError) {
    throw new Error(contactError.message)
  }

  if (!contact?.user_profile_id) {
    return null
  }

  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, full_name, account_status')
    .eq('id', contact.user_profile_id)
    .maybeSingle<{ account_status: string | null; full_name: string | null; id: string }>()

  if (profileError) {
    throw new Error(profileError.message)
  }

  return profile ?? null
}

export default async function JoinPage({ params }: JoinPageProps) {
  const resolvedParams = await params
  const invitation = await getInvitation(resolvedParams.token)
  const existingProfile = await findExistingInviteProfile(invitation?.email)
  const isExpired = invitation ? new Date(invitation.expires_at).getTime() < Date.now() : true
  const isPending = invitation?.status === 'pending'
  const invitedRole = invitation?.invited_role
  const safeRole: RegistrationRole =
    invitedRole && VALID_INVITED_ROLES.has(invitedRole) ? (invitedRole as RegistrationRole) : 'salesperson'

  return (
    <RegistrationPageShell>
      {invitation && isPending && !isExpired ? (
        <Suspense
          fallback={
            <div className="flex h-96 w-full max-w-lg items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              Loading registration...
            </div>
          }
        >
          <RegistrationForm
            invitationToken={resolvedParams.token}
            initialRole={safeRole}
            invitedEmail={invitation.email}
          />
        </Suspense>
      ) : invitation?.status === 'accepted' && existingProfile ? (
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
            {existingProfile.account_status === 'pending_approval' ? 'Registration received' : 'Invitation already used'}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {existingProfile.account_status === 'pending_approval'
              ? 'Your registration has already been submitted.'
              : 'This email already has an application.'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {existingProfile.account_status === 'pending_approval'
              ? `${existingProfile.full_name?.trim() || invitation.email} already used this invite. No email verification is needed. Your franchise office and owner will review it next.`
              : `${existingProfile.full_name?.trim() || invitation.email} already has a HomesPH account or pending application linked to this invite. Sign in with that email instead of registering again.`}
          </p>
          <div className="mt-6">
            <Button asChild className="rounded-xl bg-[#0c1f4a] hover:bg-[#163880]">
              <Link href="/login?notice=invite-registration-submitted">Go to Login</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Invitation unavailable</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">This invite link is no longer valid.</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The invitation may have expired, been cancelled, or already been accepted. Ask your franchise office to
            send a fresh invite.
          </p>
        </div>
      )}
    </RegistrationPageShell>
  )
}
