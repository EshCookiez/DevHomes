export function slugifyText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function normalizeLocationSlug(value?: string | null): string {
  if (!value) return ''
  const normalized = slugifyText(value)
  return normalized === 'undefined' || normalized === 'null' ? '' : normalized
}

export function toListingSlug(title?: string | null, fallbackId?: number | null): string {
  const slug = slugifyText(title ?? '')
  if (slug) return slug
  if (fallbackId != null) return `listing-${fallbackId}`
  return 'listing'
}
