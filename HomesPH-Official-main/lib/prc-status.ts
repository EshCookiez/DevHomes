export const PRC_STATUS_NOT_SUBMITTED = 'not_submitted'
export const PRC_STATUS_PENDING_VERIFICATION = 'pending_verification'
export const PRC_STATUS_VERIFIED = 'verified'
export const PRC_STATUS_REJECTED = 'rejected'

export const PRC_STATUS_VALUES = [
  PRC_STATUS_NOT_SUBMITTED,
  PRC_STATUS_PENDING_VERIFICATION,
  PRC_STATUS_VERIFIED,
  PRC_STATUS_REJECTED,
] as const

export type PrcStatus = (typeof PRC_STATUS_VALUES)[number]

export interface PrcStateShape {
  prc_number?: string | null
  prc_rejection_reason?: string | null
  prc_reviewed_at?: string | null
  prc_reviewed_by?: string | null
  prc_status?: string | null
  role?: string | null
}

const PRC_STATE_COLUMNS = ['prc_status', 'prc_reviewed_at', 'prc_reviewed_by', 'prc_rejection_reason']

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function roleUsesPrcVerification(role: string | null | undefined) {
  return role === 'franchise' || role === 'salesperson'
}

export function isPrcStatus(value: string | null | undefined): value is PrcStatus {
  return PRC_STATUS_VALUES.includes(value as PrcStatus)
}

export function isMissingPrcStateColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return PRC_STATE_COLUMNS.some((column) => message.includes(column)) && (message.includes('column') || message.includes('schema cache'))
}

export function normalizePrcStatus(
  status: string | null | undefined,
  role: string | null | undefined,
  prcNumber: string | null | undefined,
): PrcStatus {
  if (!roleUsesPrcVerification(role)) {
    return PRC_STATUS_NOT_SUBMITTED
  }

  if (isPrcStatus(status)) {
    return status
  }

  return trimToNull(prcNumber) ? PRC_STATUS_PENDING_VERIFICATION : PRC_STATUS_NOT_SUBMITTED
}

export function withNormalizedPrcState<T extends PrcStateShape>(record: T) {
  return {
    ...record,
    prc_number: trimToNull(record.prc_number),
    prc_rejection_reason: trimToNull(record.prc_rejection_reason),
    prc_reviewed_at: record.prc_reviewed_at ?? null,
    prc_reviewed_by: record.prc_reviewed_by ?? null,
    prc_status: normalizePrcStatus(record.prc_status, record.role, record.prc_number),
  }
}

export function getPrcStatusLabel(
  status: string | null | undefined,
  role: string | null | undefined,
  prcNumber: string | null | undefined,
) {
  switch (normalizePrcStatus(status, role, prcNumber)) {
    case PRC_STATUS_PENDING_VERIFICATION:
      return 'Pending Verification'
    case PRC_STATUS_VERIFIED:
      return 'Verified'
    case PRC_STATUS_REJECTED:
      return 'Rejected'
    default:
      return roleUsesPrcVerification(role) ? 'Not Submitted' : 'Not Required'
  }
}

export function getPrcStatusDescription(
  status: string | null | undefined,
  role: string | null | undefined,
  prcNumber: string | null | undefined,
  rejectionReason?: string | null,
) {
  const normalizedStatus = normalizePrcStatus(status, role, prcNumber)

  if (normalizedStatus === PRC_STATUS_PENDING_VERIFICATION) {
    return 'PRC verification is handled separately by platform admin.'
  }

  if (normalizedStatus === PRC_STATUS_VERIFIED) {
    return 'PRC details have been verified by platform admin.'
  }

  if (normalizedStatus === PRC_STATUS_REJECTED) {
    const reason = trimToNull(rejectionReason)
    return reason ? `PRC verification was rejected. Reason: ${reason}` : 'PRC verification was rejected.'
  }

  return roleUsesPrcVerification(role)
    ? 'No PRC number was submitted yet.'
    : 'This role does not require PRC verification.'
}
