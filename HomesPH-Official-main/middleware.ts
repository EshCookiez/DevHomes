import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const segments = pathname.split('/').filter(Boolean)
    
    // segments: ['dashboard', (role), (module), ...]
    const roleSegment = segments[1] || null
    const pageSegment = segments[2] || null

    const requestHeaders = new Headers(request.headers)
    
    if (roleSegment) {
      requestHeaders.set('x-dashboard-role-segment', roleSegment)
    }
    
    if (pageSegment) {
      requestHeaders.set('x-dashboard-page-segment', pageSegment)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*'],
}
