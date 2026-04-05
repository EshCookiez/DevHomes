export const ACCOUNT_STATUS_PENDING_APPROVAL = 'pending_approval'
export const ACCOUNT_STATUS_UNDER_REVIEW = 'under_review'
export const ACCOUNT_STATUS_CORRECTION_REQUIRED = 'correction_required'
export const ACCOUNT_STATUS_APPROVED = 'approved'
export const ACCOUNT_STATUS_REJECTED = 'rejected'
export const ACCOUNT_STATUS_MANUALLY_DISABLED = 'manually_disabled'

export const ACCOUNT_STATUS_VALUES = [
  ACCOUNT_STATUS_PENDING_APPROVAL,
  ACCOUNT_STATUS_UNDER_REVIEW,
  ACCOUNT_STATUS_CORRECTION_REQUIRED,
  ACCOUNT_STATUS_APPROVED,
  ACCOUNT_STATUS_REJECTED,
  ACCOUNT_STATUS_MANUALLY_DISABLED,
] as const

export type AccountStatus = (typeof ACCOUNT_STATUS_VALUES)[number]

export interface AccountStateShape {
  is_active?: boolean | null
  account_status?: string | null
  reviewed_at?: string | null
  reviewed_by?: string | null
  rejection_reason?: string | null
}

const ACCOUNT_STATE_COLUMNS = ['account_status', 'reviewed_at', 'reviewed_by', 'rejection_reason']

export function isAccountStatus(value: string | null | undefined): value is AccountStatus {
  return ACCOUNT_STATUS_VALUES.includes(value as AccountStatus)
}

export function isMissingAccountStateColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return ACCOUNT_STATE_COLUMNS.some((column) => message.includes(column)) && (message.includes('column') || message.includes('schema cache'))
}

export function normalizeAccountStatus(status: string | null | undefined, isActive: boolean | null | undefined): AccountStatus {
  if (status === ACCOUNT_STATUS_APPROVED) {
    return isActive === false ? ACCOUNT_STATUS_MANUALLY_DISABLED : ACCOUNT_STATUS_APPROVED
  }

  if (isAccountStatus(status)) {
    return status
  }

  return isActive === false ? ACCOUNT_STATUS_MANUALLY_DISABLED : ACCOUNT_STATUS_APPROVED
}

export function roleUsesTeamOwnerApproval(role: string | null | undefined) {
  return role === 'salesperson' || role === 'franchise_secretary'
}

export function withNormalizedAccountState<T extends AccountStateShape>(record: T) {
  const normalizedIsActive = record.is_active ?? true
  return {
    ...record,
    is_active: normalizedIsActive,
    account_status: normalizeAccountStatus(record.account_status, normalizedIsActive),
    reviewed_at: record.reviewed_at ?? null,
    reviewed_by: record.reviewed_by ?? null,
    rejection_reason: record.rejection_reason ?? null,
  }
}

export function canAccessDashboardAccount(state: Pick<AccountStateShape, 'is_active' | 'account_status'>) {
  return state.is_active !== false && normalizeAccountStatus(state.account_status, state.is_active) === ACCOUNT_STATUS_APPROVED
}

export function getSecretaryApplicationStatus(
  state: Pick<AccountStateShape, 'account_status' | 'is_active' | 'reviewed_at' | 'rejection_reason'>,
) {
  const normalizedStatus = normalizeAccountStatus(state.account_status, state.is_active)

  if (normalizedStatus !== ACCOUNT_STATUS_PENDING_APPROVAL) {
    return normalizedStatus
  }

  if (state.rejection_reason?.trim()) {
    return ACCOUNT_STATUS_CORRECTION_REQUIRED
  }

  if (state.reviewed_at) {
    return ACCOUNT_STATUS_UNDER_REVIEW
  }

  return ACCOUNT_STATUS_PENDING_APPROVAL
}

export function getAccountStatusLabel(status: string | null | undefined, isActive: boolean | null | undefined) {
  switch (normalizeAccountStatus(status, isActive)) {
    case ACCOUNT_STATUS_PENDING_APPROVAL:
      return 'Pending Approval'
    case ACCOUNT_STATUS_UNDER_REVIEW:
      return 'Under Review'
    case ACCOUNT_STATUS_CORRECTION_REQUIRED:
      return 'Correction Required'
    case ACCOUNT_STATUS_REJECTED:
      return 'Rejected'
    case ACCOUNT_STATUS_MANUALLY_DISABLED:
      return 'Disabled'
    default:
      return 'Approved'
  }
}

export function getInactiveAccountMessage(
  status: string | null | undefined,
  isActive: boolean | null | undefined,
  rejectionReason?: string | null,
) {
  const normalizedStatus = normalizeAccountStatus(status, isActive)

  if (normalizedStatus === ACCOUNT_STATUS_PENDING_APPROVAL) {
    const reason = rejectionReason?.trim()

    if (reason) {
      return `Your application needs corrections before approval. Correction note: ${reason}`
    }

    return 'Your email is verified and your account is waiting for review and final approval.'
  }

  if (normalizedStatus === ACCOUNT_STATUS_REJECTED) {
    const reason = rejectionReason?.trim()
    return reason
      ? `Your registration was not approved. Reason: ${reason}`
      : 'Your registration was not approved. Please contact HomesPH support for more information.'
  }

  return 'Your account is inactive. Please contact HomesPH support.'
}
