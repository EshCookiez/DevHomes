import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, ArrowLeft, Clock3 } from 'lucide-react'
import CorrectionResubmissionForm from '@/components/auth/CorrectionResubmissionForm'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'
import { ACCOUNT_STATUS_PENDING_APPROVAL, normalizeAccountStatus } from '@/lib/account-status'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface CorrectionProfileRow {
  account_status: string | null
  fname: string | null
  id: string
  is_active: boolean | null
  lname: string | null
  prc_number: string | null
  rejection_reason: string | null
  role: string | null
}

interface CorrectionContactRow {
  email: string | null
  primary_mobile: string | null
}

interface CorrectionDocumentRow {
  file_name: string | null
  file_url: string | null
}

export const metadata: Metadata = {
  title: 'Application Correction | HomesPH',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountCorrectionPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?notice=correction-requested')
  }

  const admin = createAdminSupabaseClient()
  const { data: profile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, fname, lname, role, prc_number, account_status, is_active, rejection_reason')
    .eq('user_id', user.id)
    .maybeSingle<CorrectionProfileRow>()

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (!profile) {
    redirect('/login')
  }

  const [contactResult, documentResult] = await Promise.all([
    admin
      .from('contact_information')
      .select('email, primary_mobile')
      .eq('user_profile_id', profile.id)
      .maybeSingle<CorrectionContactRow>(),
    admin
      .from('user_documents')
      .select('file_name, file_url')
      .eq('user_profile_id', profile.id)
      .eq('document_type', 'valid_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<CorrectionDocumentRow>(),
  ])

  if (contactResult.error) {
    throw new Error(contactResult.error.message)
  }

  if (documentResult.error) {
    throw new Error(documentResult.error.message)
  }

  const normalizedStatus = normalizeAccountStatus(profile.account_status, profile.is_active)
  const dashboardPath = getDashboardPathForRole(profile.role)

  if (normalizedStatus !== ACCOUNT_STATUS_PENDING_APPROVAL && dashboardPath) {
    redirect(dashboardPath)
  }

  const correctionNote = profile.rejection_reason?.trim() ?? ''
  const contact = contactResult.data
  const currentDocument = documentResult.data

  return (
    <RegistrationPageShell>
      {correctionNote ? (
        <CorrectionResubmissionForm
          correctionNote={correctionNote}
          currentDocumentName={currentDocument?.file_name}
          currentDocumentUrl={currentDocument?.file_url}
          email={contact?.email?.trim() || user.email || 'Not available'}
          initialFname={profile.fname?.trim() || ''}
          initialLname={profile.lname?.trim() || ''}
          initialPhone={contact?.primary_mobile?.trim() || ''}
          initialPrcNumber={profile.prc_number}
          role={profile.role ?? 'salesperson'}
        />
      ) : (
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 text-slate-500">
            <Clock3 size={18} />
            <p className="text-xs font-black uppercase tracking-[0.2em]">No active correction request</p>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Your application is already back in review.</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            There are no open correction notes on your account right now. If you already resubmitted, the franchise office
            will review your updated documents next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} className="mr-2" />
              Back to Login
            </Link>
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>If you expected a correction note here, ask your franchise office to resend the request.</span>
            </div>
          </div>
        </div>
      )}
    </RegistrationPageShell>
  )
}
