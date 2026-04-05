import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReviewProfileActions } from '@/components/profile/review-profile-actions'
import { getAccountStatusLabel, getSecretaryApplicationStatus, type AccountStatus } from '@/lib/account-status'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import {
  getPreferredCompanyMembershipForProfile,
  getSecretaryCompanyScopeForMembership,
} from '@/lib/company-members'
import { getPrcStatusDescription, getPrcStatusLabel } from '@/lib/prc-status'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

type ReviewableProfileRow = {
  account_status: string | null
  birthday: string | null
  created_at: string | null
  fname: string | null
  full_name: string | null
  gender: string | null
  id: string
  is_active: boolean | null
  lname: string | null
  prc_number: string | null
  prc_rejection_reason: string | null
  prc_reviewed_at: string | null
  prc_status: string | null
  profile_image_url: string | null
  rejection_reason: string | null
  reviewed_at: string | null
  role: string | null
  user_id: string
}

type ReviewableContactRow = {
  email: string | null
  primary_mobile: string | null
}

type ReviewableDocumentRow = {
  category: string | null
  created_at: string | null
  document_type: string | null
  file_name: string | null
  file_url: string | null
  id: string
}

function formatDate(value: string | null) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not available' : format(parsed, 'MMM d, yyyy')
}

function getInitials(profile: Pick<ReviewableProfileRow, 'full_name' | 'fname' | 'lname'>, email: string | null) {
  const source =
    profile.full_name?.trim() ||
    [profile.fname, profile.lname].filter(Boolean).join(' ').trim() ||
    email ||
    'HomesPH User'

  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getDocumentPreviewKind(document: Pick<ReviewableDocumentRow, 'file_name' | 'file_url'>) {
  const source = `${document.file_name ?? ''} ${document.file_url ?? ''}`.toLowerCase()

  if (/\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?|#|$)/.test(source)) {
    return 'image' as const
  }

  if (/\.pdf(\?|#|$)/.test(source)) {
    return 'pdf' as const
  }

  return 'none' as const
}

function getStatusBadgeClass(status: AccountStatus) {
  switch (status) {
    case 'pending_approval':
      return 'rounded-full border-amber-200 bg-amber-50 text-amber-700'
    case 'under_review':
      return 'rounded-full border-blue-200 bg-blue-50 text-blue-700'
    case 'correction_required':
      return 'rounded-full border-rose-200 bg-rose-50 text-rose-700'
    case 'rejected':
      return 'rounded-full border-rose-200 bg-rose-50 text-rose-700'
    case 'manually_disabled':
      return 'rounded-full border-slate-200 bg-slate-100 text-slate-600'
    default:
      return 'rounded-full border-emerald-200 bg-emerald-50 text-emerald-700'
  }
}

function getBackPath(role: string) {
  if (role === 'franchise_secretary') {
    return '/dashboard/secretary/applications'
  }

  if (role === 'franchise') {
    return '/dashboard/franchise/applications'
  }

  return '/dashboard/users'
}

async function getScopedReviewCompanyIds(user: Awaited<ReturnType<typeof getCurrentDashboardUser>>) {
  const admin = createAdminSupabaseClient()

  if (user?.role === 'franchise_secretary') {
    const membership = await getPreferredCompanyMembershipForProfile(admin, user.profileId, {
      allowedOrganizationRoles: ['main_secretary', 'suboffice_secretary'],
    })

    if (!membership) {
      return []
    }

    const scope = await getSecretaryCompanyScopeForMembership(admin, membership)
    return scope.scopeCompanyIds
  }

  const ownedCompanyResult = await admin
    .from('company_profiles')
    .select('id')
    .eq('user_profile_id', user?.profileId ?? '')
    .is('parent_company_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: number }>()

  if (ownedCompanyResult.error) {
    throw new Error(ownedCompanyResult.error.message)
  }

  let parentCompanyId = ownedCompanyResult.data?.id ?? null

  if (!parentCompanyId) {
    const ownerMembershipResult = await admin
      .from('company_members')
      .select('company_id')
      .eq('user_profile_id', user?.profileId ?? '')
      .eq('system_role', 'owner')
      .limit(1)
      .maybeSingle<{ company_id: number }>()

    if (ownerMembershipResult.error) {
      throw new Error(ownerMembershipResult.error.message)
    }

    if (!ownerMembershipResult.data?.company_id) {
      return []
    }

    parentCompanyId = ownerMembershipResult.data.company_id
  }

  const { data: parentCompany, error: parentCompanyError } = await admin
    .from('company_profiles')
    .select('id, company_name')
    .eq('id', parentCompanyId)
    .maybeSingle<{ id: number; company_name: string | null }>()

  if (parentCompanyError) {
    throw new Error(parentCompanyError.message)
  }

  const [subofficesResult, duplicateRootsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id')
      .eq('parent_company_id', parentCompanyId)
      .returns<Array<{ id: number }>>(),
    parentCompany?.company_name?.trim()
      ? admin
          .from('company_profiles')
          .select('id')
          .eq('company_name', parentCompany.company_name.trim())
          .is('parent_company_id', null)
          .neq('id', parentCompanyId)
          .is('user_profile_id', null)
          .returns<Array<{ id: number }>>()
      : Promise.resolve({ data: [], error: null }),
  ])

  if (subofficesResult.error) {
    throw new Error(subofficesResult.error.message)
  }

  if (duplicateRootsResult.error) {
    throw new Error(duplicateRootsResult.error.message)
  }

  return [
    parentCompanyId,
    ...(subofficesResult.data ?? []).map((office) => office.id),
    ...(duplicateRootsResult.data ?? []).map((office) => office.id),
  ]
}

async function canAccessReviewedProfile(profileId: string) {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (['super_admin', 'admin'].includes(user.role)) {
    return user
  }

  if (!['franchise', 'franchise_secretary'].includes(user.role)) {
    redirect(`/dashboard/${user.roleSegment}`)
  }

  const admin = createAdminSupabaseClient()
  const companyIds = await getScopedReviewCompanyIds(user)

  if (!companyIds.length) {
    notFound()
  }

  const { data: targetMemberships, error: targetMembershipError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .in('company_id', companyIds)
    .eq('user_profile_id', profileId)
    .limit(1)
    .returns<Array<{ user_profile_id: string }>>()

  if (targetMembershipError) {
    throw new Error(targetMembershipError.message)
  }

  if (!(targetMemberships ?? []).length) {
    notFound()
  }

  return user
}

async function getReviewedProfileBundle(profileId: string) {
  const admin = createAdminSupabaseClient()
  const [profileResult, contactResult, documentsResult] = await Promise.all([
    admin
      .from('user_profiles')
      .select('id, user_id, fname, lname, full_name, gender, birthday, prc_number, prc_status, prc_reviewed_at, prc_rejection_reason, profile_image_url, role, is_active, account_status, reviewed_at, rejection_reason, created_at')
      .eq('id', profileId)
      .maybeSingle<ReviewableProfileRow>(),
    admin
      .from('contact_information')
      .select('email, primary_mobile')
      .eq('user_profile_id', profileId)
      .maybeSingle<ReviewableContactRow>(),
    admin
      .from('user_documents')
      .select('id, document_type, category, file_name, file_url, created_at')
      .eq('user_profile_id', profileId)
      .order('created_at', { ascending: false })
      .returns<ReviewableDocumentRow[]>(),
  ])

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  if (!profileResult.data) {
    notFound()
  }

  if (contactResult.error) {
    throw new Error(contactResult.error.message)
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message)
  }

  return {
    contact: contactResult.data,
    documents: documentsResult.data ?? [],
    profile: profileResult.data,
  }
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default async function ReviewedProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  const currentUser = await canAccessReviewedProfile(profileId)
  const { profile, contact, documents } = await getReviewedProfileBundle(profileId)
  const normalizedStatus = getSecretaryApplicationStatus(profile)
  const email = contact?.email?.trim() || 'Not available'
  const phone = contact?.primary_mobile?.trim() || 'Not available'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href={getBackPath(currentUser.role)}>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
                <ArrowLeft size={14} className="mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Profile Review</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Review the invited agent profile and uploaded onboarding documents.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-5">
            <Avatar className="h-24 w-24 rounded-3xl">
              <AvatarImage src={profile.profile_image_url ?? undefined} alt={profile.full_name ?? email} />
              <AvatarFallback className="rounded-3xl bg-slate-900 text-xl font-bold text-white">
                {getInitials(profile, contact?.email ?? null)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                {profile.full_name?.trim() || [profile.fname, profile.lname].filter(Boolean).join(' ') || 'Unnamed User'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                  {(profile.role ?? 'unknown').replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline" className={getStatusBadgeClass(normalizedStatus)}>
                  {getAccountStatusLabel(normalizedStatus, profile.is_active)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="md:ml-6 md:self-start">
            <ReviewProfileActions
              accountStatus={normalizedStatus}
              applicantName={profile.full_name?.trim() || [profile.fname, profile.lname].filter(Boolean).join(' ') || 'This applicant'}
              profileId={profile.id}
              viewerOrganizationRole={currentUser.organizationRole}
              viewerRole={currentUser.role}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Core profile information captured during invitation registration. Gender and birthday are completed later in profile setup, not in the invite form.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailCard icon={Mail} label="Email" value={email} />
              <DetailCard icon={Phone} label="Primary Mobile" value={phone} />
              <DetailCard icon={ShieldCheck} label="Role" value={(profile.role ?? 'Not assigned').replace(/_/g, ' ')} />
              <DetailCard icon={ShieldCheck} label="Account Status" value={getAccountStatusLabel(normalizedStatus, profile.is_active)} />
              <DetailCard icon={FileText} label="PRC Number" value={profile.prc_number?.trim() || 'Not provided'} />
              <DetailCard icon={ShieldCheck} label="PRC Status" value={getPrcStatusLabel(profile.prc_status, profile.role, profile.prc_number)} />
              <DetailCard icon={CalendarDays} label="Registered" value={formatDate(profile.created_at)} />
              <DetailCard icon={CalendarDays} label="Last Reviewed" value={formatDate(profile.reviewed_at)} />
              <DetailCard icon={CalendarDays} label="PRC Reviewed" value={formatDate(profile.prc_reviewed_at)} />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>PRC Verification</CardTitle>
              <CardDescription>
                Team approval and PRC verification are handled separately. Platform admin verifies the submitted PRC details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                {getPrcStatusDescription(profile.prc_status, profile.role, profile.prc_number, profile.prc_rejection_reason)}
              </p>
              {profile.prc_rejection_reason ? (
                <p className="mt-3 text-sm text-rose-700">
                  <span className="font-semibold">PRC note:</span> {profile.prc_rejection_reason}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {profile.rejection_reason ? (
            <Card className="border-rose-200 bg-rose-50 shadow-sm">
              <CardHeader>
              <CardTitle className="text-rose-900">Correction Notes</CardTitle>
              <CardDescription className="text-rose-700">
                  These notes were recorded during the latest secretary or franchise owner review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-rose-800">{profile.rejection_reason}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Uploaded identity and onboarding documents for this applicant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              documents.map((document) => (
                <div key={document.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        <FileText size={14} />
                        {(document.document_type ?? 'document').replace(/_/g, ' ')}
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                        {document.file_name ?? 'Uploaded file'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.category ? `${document.category} • ` : ''}{formatDate(document.created_at)}
                      </p>
                    </div>
                    {document.file_url ? (
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="rounded-lg border-slate-200">
                          <ExternalLink size={14} className="mr-2" />
                          Open
                        </Button>
                      </a>
                    ) : null}
                  </div>
                  {document.file_url && getDocumentPreviewKind(document) === 'image' ? (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={document.file_url}
                        alt={document.file_name ?? 'Document preview'}
                        className="h-56 w-full object-cover"
                      />
                    </a>
                  ) : null}
                  {document.file_url && getDocumentPreviewKind(document) === 'pdf' ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <iframe
                        title={document.file_name ?? 'Document preview'}
                        src={`${document.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="h-72 w-full"
                      />
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
