import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export type CompanySystemRole = 'owner' | 'agent' | 'main_secretary' | 'suboffice_secretary'
export type StoredCompanySystemRole = CompanySystemRole | 'secretary'

type AdminClient = ReturnType<typeof createAdminSupabaseClient>

type CompanyInvitationRepairRow = {
  email: string
  id: string
  invited_role: string
  status: string
}

type ContactLookupRow = {
  email: string | null
  user_profile_id: string
}

type CompanyMemberLookupRow = {
  company_id?: number
  system_role?: string | null
  user_profile_id: string
}

type PreferredMembershipRow = {
  company_id: number
  system_role: string | null
}

type PreferredMembershipCompanyRow = {
  company_name?: string | null
  id: number
  user_profile_id?: string | null
  parent_company_id: number | null
}

export type PreferredCompanyMembership = {
  companyId: number
  officeIsSuboffice: boolean
  organizationRole: CompanySystemRole
  systemRole: string | null
}

export type SecretaryCompanyScope = {
  companyId: number
  companyName: string
  officeIsSuboffice: boolean
  organizationRole: CompanySystemRole
  parentCompanyId: number
  scopeCompanyIds: number[]
}

export function normalizeCompanySystemRole(
  role: string | null | undefined,
  options?: { officeIsSuboffice?: boolean | null },
): CompanySystemRole {
  switch (role) {
    case 'owner':
      return 'owner'
    case 'main_secretary':
      return 'main_secretary'
    case 'suboffice_secretary':
      return 'suboffice_secretary'
    case 'secretary':
      return options?.officeIsSuboffice ? 'suboffice_secretary' : 'main_secretary'
    default:
      return 'agent'
  }
}

export function isSecretaryCompanyRole(role: string | null | undefined) {
  return ['secretary', 'main_secretary', 'suboffice_secretary'].includes(role ?? '')
}

export function isMainSecretaryCompanyRole(role: string | null | undefined) {
  return normalizeCompanySystemRole(role, { officeIsSuboffice: false }) === 'main_secretary'
}

export function isSubofficeSecretaryCompanyRole(role: string | null | undefined) {
  return normalizeCompanySystemRole(role, { officeIsSuboffice: true }) === 'suboffice_secretary'
}

export function getCompanySystemRolePriority(role: string | null | undefined, officeIsSuboffice?: boolean | null) {
  switch (normalizeCompanySystemRole(role, { officeIsSuboffice })) {
    case 'owner':
      return 0
    case 'main_secretary':
      return 1
    case 'suboffice_secretary':
      return 2
    default:
      return 3
  }
}

export function getCompanySystemRoleLabel(role: string | null | undefined, officeIsSuboffice?: boolean | null) {
  switch (normalizeCompanySystemRole(role, { officeIsSuboffice })) {
    case 'owner':
      return 'Franchise Owner'
    case 'main_secretary':
      return 'Main Secretary'
    case 'suboffice_secretary':
      return 'Suboffice Secretary'
    default:
      return 'Agent'
  }
}

export function mapRoleToCompanySystemRole(role: string | null | undefined): CompanySystemRole {
  if (role === 'franchise') {
    return 'owner'
  }

  return 'agent'
}

export async function getPreferredCompanyMembershipForProfile(
  admin: AdminClient,
  profileId: string,
  options?: {
    allowedOrganizationRoles?: CompanySystemRole[]
  },
) {
  const { data: memberships, error: membershipsError } = await admin
    .from('company_members')
    .select('company_id, system_role')
    .eq('user_profile_id', profileId)
    .returns<PreferredMembershipRow[]>()

  if (membershipsError) {
    throw new Error(membershipsError.message)
  }

  const uniqueCompanyIds = [...new Set((memberships ?? []).map((membership) => membership.company_id).filter(Boolean))]

  if (!uniqueCompanyIds.length) {
    return null
  }

  const { data: companies, error: companiesError } = await admin
    .from('company_profiles')
    .select('id, parent_company_id')
    .in('id', uniqueCompanyIds)
    .returns<PreferredMembershipCompanyRow[]>()

  if (companiesError) {
    throw new Error(companiesError.message)
  }

  const companyMap = new Map((companies ?? []).map((company) => [company.id, company]))
  const dedupedMemberships = new Map<number, PreferredCompanyMembership>()

  for (const membership of memberships ?? []) {
    const company = companyMap.get(membership.company_id)
    const officeIsSuboffice = Boolean(company?.parent_company_id)
    const organizationRole = normalizeCompanySystemRole(membership.system_role, { officeIsSuboffice })

    if (
      options?.allowedOrganizationRoles?.length &&
      !options.allowedOrganizationRoles.includes(organizationRole)
    ) {
      continue
    }

    const resolvedMembership: PreferredCompanyMembership = {
      companyId: membership.company_id,
      officeIsSuboffice,
      organizationRole,
      systemRole: membership.system_role,
    }

    const existingMembership = dedupedMemberships.get(membership.company_id)

    if (!existingMembership) {
      dedupedMemberships.set(membership.company_id, resolvedMembership)
      continue
    }

    const existingPriority = getCompanySystemRolePriority(existingMembership.systemRole, existingMembership.officeIsSuboffice)
    const nextPriority = getCompanySystemRolePriority(resolvedMembership.systemRole, resolvedMembership.officeIsSuboffice)

    if (nextPriority < existingPriority) {
      dedupedMemberships.set(membership.company_id, resolvedMembership)
    }
  }

  return [...dedupedMemberships.values()]
    .sort((left, right) => {
      const leftPriority = getCompanySystemRolePriority(left.systemRole, left.officeIsSuboffice)
      const rightPriority = getCompanySystemRolePriority(right.systemRole, right.officeIsSuboffice)

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.companyId - right.companyId
    })[0] ?? null
}

export async function getSecretaryCompanyScopeForMembership(
  admin: AdminClient,
  membership: PreferredCompanyMembership,
) {
  const { data: currentCompany, error: currentCompanyError } = await admin
    .from('company_profiles')
    .select('id, company_name, parent_company_id, user_profile_id')
    .eq('id', membership.companyId)
    .maybeSingle<PreferredMembershipCompanyRow>()

  if (currentCompanyError) {
    throw new Error(currentCompanyError.message)
  }

  if (!currentCompany) {
    throw new Error('Secretary office could not be found.')
  }

  const resolveCompanyById = async (companyId: number) => {
    const { data, error } = await admin
      .from('company_profiles')
      .select('id, company_name, parent_company_id, user_profile_id')
      .eq('id', companyId)
      .maybeSingle<PreferredMembershipCompanyRow>()

    if (error) {
      throw new Error(error.message)
    }

    return data ?? currentCompany
  }

  let parentCompanyId = currentCompany.parent_company_id ?? currentCompany.id
  let parentCompany =
    parentCompanyId === currentCompany.id
      ? currentCompany
      : await resolveCompanyById(parentCompanyId)

  if (!parentCompany.user_profile_id && parentCompany.company_name?.trim()) {
    const { data: canonicalRoots, error: canonicalRootsError } = await admin
      .from('company_profiles')
      .select('id, company_name, parent_company_id, user_profile_id')
      .eq('company_name', parentCompany.company_name.trim())
      .is('parent_company_id', null)
      .not('user_profile_id', 'is', null)
      .order('created_at', { ascending: true })
      .returns<PreferredMembershipCompanyRow[]>()

    if (canonicalRootsError) {
      throw new Error(canonicalRootsError.message)
    }

    const canonicalRoot = canonicalRoots?.[0]
    if (canonicalRoot?.id) {
      parentCompanyId = canonicalRoot.id
      parentCompany = canonicalRoot
    }
  }

  const baseCompanyName =
    parentCompany.company_name?.trim() ||
    currentCompany.company_name?.trim() ||
    'HomesPH Partner Office'

  if (!['owner', 'main_secretary'].includes(membership.organizationRole)) {
    return {
      companyId: membership.companyId,
      companyName: currentCompany.company_name?.trim() || baseCompanyName,
      officeIsSuboffice: membership.officeIsSuboffice,
      organizationRole: membership.organizationRole,
      parentCompanyId,
      scopeCompanyIds: [membership.companyId],
    } satisfies SecretaryCompanyScope
  }

  const [subofficesResult, duplicateRootsResult] = await Promise.all([
    admin
      .from('company_profiles')
      .select('id')
      .eq('parent_company_id', parentCompanyId)
      .returns<Array<{ id: number }>>(),
    baseCompanyName
      ? admin
          .from('company_profiles')
          .select('id')
          .eq('company_name', baseCompanyName)
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

  return {
    companyId: membership.companyId,
    companyName: baseCompanyName,
    officeIsSuboffice: membership.officeIsSuboffice,
    organizationRole: membership.organizationRole,
    parentCompanyId,
    scopeCompanyIds: [
      parentCompanyId,
      ...new Set([
        ...(subofficesResult.data ?? []).map((office) => office.id),
        ...(duplicateRootsResult.data ?? []).map((office) => office.id),
      ]),
    ],
  } satisfies SecretaryCompanyScope
}

export async function repairCompanyInvitationMemberships(admin: AdminClient, companyId: number) {
  const { data: invitations, error: invitationsError } = await admin
    .from('company_invitations')
    .select('id, email, invited_role, status')
    .eq('company_id', companyId)
    .in('status', ['pending', 'accepted'])
    .returns<CompanyInvitationRepairRow[]>()

  if (invitationsError) {
    throw new Error(invitationsError.message)
  }

  if (!invitations?.length) {
    return 0
  }

  const invitationByEmail = new Map<string, CompanyInvitationRepairRow>()

  for (const invitation of invitations) {
    const normalizedEmail = invitation.email.trim().toLowerCase()

    if (!normalizedEmail || invitationByEmail.has(normalizedEmail)) {
      continue
    }

    invitationByEmail.set(normalizedEmail, invitation)
  }

  const emails = [...invitationByEmail.keys()]
  if (!emails.length) {
    return 0
  }

  const { data: contacts, error: contactsError } = await admin
    .from('contact_information')
    .select('email, user_profile_id')
    .in('email', emails)
    .returns<ContactLookupRow[]>()

  if (contactsError) {
    throw new Error(contactsError.message)
  }

  if (!contacts?.length) {
    return 0
  }

  const profileIdByEmail = new Map<string, string>()

  for (const contact of contacts) {
    const normalizedEmail = contact.email?.trim().toLowerCase()

    if (!normalizedEmail || profileIdByEmail.has(normalizedEmail)) {
      continue
    }

    profileIdByEmail.set(normalizedEmail, contact.user_profile_id)
  }

  const profileIds = [...new Set([...profileIdByEmail.values()])]
  if (!profileIds.length) {
    return 0
  }

  const { data: existingMembers, error: membersError } = await admin
    .from('company_members')
    .select('user_profile_id')
    .eq('company_id', companyId)
    .in('user_profile_id', profileIds)
    .returns<CompanyMemberLookupRow[]>()

  if (membersError) {
    throw new Error(membersError.message)
  }

  const { data: anyCompanyMembers, error: anyCompanyMembersError } = await admin
    .from('company_members')
    .select('company_id, user_profile_id')
    .in('user_profile_id', profileIds)
    .returns<CompanyMemberLookupRow[]>()

  if (anyCompanyMembersError) {
    throw new Error(anyCompanyMembersError.message)
  }

  const linkedProfileIds = new Set((existingMembers ?? []).map((member) => member.user_profile_id))
  const linkedAnywhereProfileIds = new Set((anyCompanyMembers ?? []).map((member) => member.user_profile_id))
  const repairableInvitations = [...invitationByEmail.entries()]
    .map(([email, invitation]) => ({
      email,
      invitation,
      profileId: profileIdByEmail.get(email) ?? null,
    }))
    .filter((entry): entry is { email: string; invitation: CompanyInvitationRepairRow; profileId: string } => {
      const { profileId } = entry
      return typeof profileId === 'string' && !linkedProfileIds.has(profileId) && !linkedAnywhereProfileIds.has(profileId)
    })

  if (!repairableInvitations.length) {
    return 0
  }

  const { error: upsertError } = await admin
    .from('company_members')
    .upsert(
      repairableInvitations.map((entry) => ({
        company_id: companyId,
        user_profile_id: entry.profileId,
        system_role: mapRoleToCompanySystemRole(entry.invitation.invited_role),
      })),
      { onConflict: 'company_id,user_profile_id' },
    )

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const { error: updateError } = await admin
    .from('company_invitations')
    .update({ status: 'accepted' })
    .in(
      'id',
      repairableInvitations.map((entry) => entry.invitation.id),
    )

  if (updateError) {
    throw new Error(updateError.message)
  }

  return repairableInvitations.length
}
