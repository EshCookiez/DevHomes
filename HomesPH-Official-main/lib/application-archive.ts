export interface ApplicationArchiveShape {
  application_archived_at?: string | null
  application_archive_reason?: string | null
  archived_company_id?: number | null
  archived_contact_email?: string | null
}

const APPLICATION_ARCHIVE_COLUMNS = [
  'application_archived_at',
  'application_archive_reason',
  'archived_company_id',
  'archived_contact_email',
]

function sanitizeLocalPart(value: string) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  return sanitized || 'user'
}

export function isMissingApplicationArchiveColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? ''
  return APPLICATION_ARCHIVE_COLUMNS.some((column) => message.includes(column)) && (message.includes('column') || message.includes('schema cache'))
}

export function withApplicationArchiveState<T extends ApplicationArchiveShape>(record: T) {
  return {
    ...record,
    application_archived_at: record.application_archived_at ?? null,
    application_archive_reason: record.application_archive_reason ?? null,
    archived_company_id: typeof record.archived_company_id === 'number' ? record.archived_company_id : null,
    archived_contact_email: record.archived_contact_email?.trim() ?? null,
  }
}

export function isArchivedApplication(record: Pick<ApplicationArchiveShape, 'application_archived_at'> | null | undefined) {
  return Boolean(record?.application_archived_at)
}

export function getApplicationAuditEmail(currentEmail: string | null | undefined, archivedContactEmail: string | null | undefined) {
  return archivedContactEmail?.trim() || currentEmail?.trim() || ''
}

export function buildArchivedAuthEmail(email: string, profileId: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const [localPart] = normalizedEmail.split('@')
  const local = sanitizeLocalPart(localPart ?? 'user').slice(0, 24)
  const suffix = `${profileId.replace(/[^a-z0-9]/gi, '').slice(0, 8)}.${Date.now()}`
  return `${local}.archived.${suffix}@archived.homesph.invalid`
}
