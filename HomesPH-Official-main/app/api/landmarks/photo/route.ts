import { NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function isSafePhotoRef(ref: string): boolean {
  return /^[A-Za-z0-9_\-\.]+$/.test(ref)
}

export async function GET(request: Request) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Missing Google API key' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const photoRef = searchParams.get('photoRef')
    const maxwidth = searchParams.get('maxwidth') || '480'

    if (!photoRef || !isSafePhotoRef(photoRef)) {
      return NextResponse.json({ error: 'Invalid photo reference' }, { status: 400 })
    }

    const widthNum = Number(maxwidth)
    const safeMaxWidth = Number.isFinite(widthNum) ? Math.min(Math.max(widthNum, 100), 1200) : 480

    const url = new URL('https://maps.googleapis.com/maps/api/place/photo')
    url.searchParams.set('photoreference', photoRef)
    url.searchParams.set('maxwidth', String(safeMaxWidth))
    url.searchParams.set('key', GOOGLE_API_KEY)

    const response = await fetch(url.toString(), { cache: 'no-store', redirect: 'follow' })
    if (!response.ok) {
      return NextResponse.json({ error: 'Photo fetch failed' }, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('landmarks photo API error', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
