import { cache } from 'react'

export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  [key: string]: string | undefined
}

export interface ParsedSiteSettings {
  siteTitle: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  socialLinks: SocialLinks
  footerLinks: { label: string; href: string }[]
  logoUrl: string
}

const LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png'

export const DEFAULTS: ParsedSiteSettings = {
  siteTitle: 'HomesPH',
  siteDescription:
    'Your Home Starts Here — Browse houses, condos & investment properties across the Philippines.',
  contactEmail: 'info@homesph.com',
  contactPhone: '+63 912 345 6789',
  socialLinks: {},
  footerLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-and-conditions' },
  ],
  logoUrl: LOGO_URL,
}

function parse(v: unknown): unknown {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return v
    }
  }
  return v
}

const getRawSiteSettings = cache(async (): Promise<Record<string, unknown>> => {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE
    if (!SUPABASE_URL || !SERVICE_ROLE) return {}

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?select=key,value`,
      {
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          'Content-Type': 'application/json',
        } as Record<string, string>,
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return {}

    const rows: { key: string; value: unknown }[] = await res.json()
    const raw: Record<string, unknown> = {}
    for (const row of rows) {
      raw[row.key] = row.value
    }

    return raw
  } catch {
    return {}
  }
})

export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T | undefined> {
  const raw = await getRawSiteSettings()
  const value = parse(raw[key]) as T | undefined
  return value ?? fallback
}

/**
 * Fetches site settings directly from Supabase.
 * Wrapped in React cache() so multiple callers in the same request
 * (e.g. generateMetadata + page component) share a single fetch.
 */
export const getSiteSettings = cache(async (): Promise<ParsedSiteSettings> => {
  try {
    const raw = await getRawSiteSettings()

    return {
      siteTitle: (parse(raw.site_title) as string) ?? DEFAULTS.siteTitle,
      siteDescription:
        (parse(raw.site_description) as string) ?? DEFAULTS.siteDescription,
      contactEmail:
        (parse(raw.contact_email) as string) ?? DEFAULTS.contactEmail,
      contactPhone:
        (parse(raw.contact_phone) as string) ?? DEFAULTS.contactPhone,
      socialLinks:
        (parse(raw.social_links) as SocialLinks) ?? DEFAULTS.socialLinks,
      footerLinks:
        (parse(raw.footer_links) as { label: string; href: string }[]) ??
        DEFAULTS.footerLinks,
      logoUrl: (parse(raw.logo_url) as string) ?? DEFAULTS.logoUrl,
    }
  } catch {
    return DEFAULTS
  }
})
