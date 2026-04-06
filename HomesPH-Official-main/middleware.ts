import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SELECTED_LOCATION_COOKIE, SELECTED_LOCATION_COOKIE_MAX_AGE } from '@/lib/selected-location'
import { normalizeLocationSlug } from '@/lib/url-slugs'

const LOCATION_SCOPED_SEGMENTS = new Set(['buy', 'rent', 'projects', 'news'])
const STATIC_ROOT_SEGMENTS = new Set([
  'account',
  'auth',
  'buy',
  'dashboard',
  'developers',
  'favorites',
  'forgot-password',
  'join',
  'legal',
  'listings',
  'login',
  'mortgage',
  'news',
  'onboarding',
  'our-company',
  'projects',
  'registration',
  'rent',
  'restaurant',
  'search',
  'test',
  'tourism',
])

let cachedLocationSlugs: Set<string> | null = null
let cachedLocationSlugsAt = 0
const LOCATION_SLUG_CACHE_MS = 5 * 60 * 1000

function getPathLocationSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const first = normalizeLocationSlug(segments[0])
  if (!first || STATIC_ROOT_SEGMENTS.has(first)) return null

  if (segments.length === 1) return first

  const second = normalizeLocationSlug(segments[1])
  if (LOCATION_SCOPED_SEGMENTS.has(second)) return first

  return null
}

function replacePathLocation(pathname: string, locationSlug: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return `/${locationSlug}`

  if (segments.length === 1) {
    return `/${locationSlug}`
  }

  return `/${locationSlug}/${segments.slice(1).join('/')}`
}

async function getActiveLocationSlugs(): Promise<Set<string>> {
  const now = Date.now()
  if (cachedLocationSlugs && now - cachedLocationSlugsAt < LOCATION_SLUG_CACHE_MS) {
    return cachedLocationSlugs
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    cachedLocationSlugs = new Set<string>()
    cachedLocationSlugsAt = now
    return cachedLocationSlugs
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/site_locations?select=slug&is_active=eq.true`
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      cachedLocationSlugs = new Set<string>()
      cachedLocationSlugsAt = now
      return cachedLocationSlugs
    }

    const data = (await res.json()) as Array<{ slug?: string | null }>
    cachedLocationSlugs = new Set(
      data
        .map((item) => normalizeLocationSlug(item.slug))
        .filter(Boolean)
    )
    cachedLocationSlugsAt = now
    return cachedLocationSlugs
  } catch {
    cachedLocationSlugs = new Set<string>()
    cachedLocationSlugsAt = now
    return cachedLocationSlugs
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  const pathLocationSlug = getPathLocationSlug(pathname)
  const cookieLocationSlug = normalizeLocationSlug(request.cookies.get(SELECTED_LOCATION_COOKIE)?.value)

  if (pathLocationSlug) {
    if (cookieLocationSlug && cookieLocationSlug !== pathLocationSlug) {
      const url = request.nextUrl.clone()
      url.pathname = replacePathLocation(pathname, cookieLocationSlug)
      return NextResponse.redirect(url)
    }

    const validLocationSlugs = await getActiveLocationSlugs()
    if (validLocationSlugs.size > 0 && !validLocationSlugs.has(pathLocationSlug)) {
      const url = request.nextUrl.clone()
      url.pathname = cookieLocationSlug ? replacePathLocation(pathname, cookieLocationSlug) : '/'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/dashboard')) {
    const segments = pathname.split('/').filter(Boolean)

    // segments: ['dashboard', (role), (module), ...]
    const roleSegment = segments[1] || null
    const pageSegment = segments[2] || null

    if (roleSegment) {
      requestHeaders.set('x-dashboard-role-segment', roleSegment)
    }

    if (pageSegment) {
      requestHeaders.set('x-dashboard-page-segment', pageSegment)
    }
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  await supabase.auth.getUser()

  if (pathLocationSlug && !cookieLocationSlug) {
    response.cookies.set(SELECTED_LOCATION_COOKIE, encodeURIComponent(pathLocationSlug), {
      path: '/',
      maxAge: SELECTED_LOCATION_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|eot)$).*)',
  ],
}
