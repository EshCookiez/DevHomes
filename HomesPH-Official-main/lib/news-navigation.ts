function formatToken(token: string, index: number) {
  const lower = token.toLowerCase()

  if (lower === 'bgc') return 'BGC'
  if (lower === 'cdo') return 'CDO'
  if (index > 0 && ['de', 'del', 'of', 'and', 'the'].includes(lower)) return lower

  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`
}

export function formatLocationForNews(value?: string | null) {
  const decoded = decodeURIComponent(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!decoded) return undefined
  if (decoded.toLowerCase() === 'all') return undefined
  if (/[A-Z]/.test(decoded)) return decoded

  return decoded
    .split(' ')
    .map((token, index) => formatToken(token, index))
    .join(' ')
}

export function buildNewsHref(location?: string | null) {
  const formattedLocation = formatLocationForNews(location)
  return formattedLocation
    ? `/${buildNewsPathSlug(formattedLocation)}/news`
    : '/news'
}

export function buildNewsPathSlug(location?: string | null) {
  const formattedLocation = formatLocationForNews(location)
  return (formattedLocation ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function buildContextHomeHref(location?: string | null) {
  const decoded = decodeURIComponent(valueOrEmpty(location))
    .trim()
    .replace(/^\/+|\/+$/g, '')

  return decoded ? `/${encodeURIComponent(decoded)}` : '/'
}

function valueOrEmpty(value?: string | null) {
  return value ?? ''
}
