import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.HOMESPH_NEWS_API_URL!
const API_KEY = process.env.HOMESPH_NEWS_API_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const location = searchParams.get('location')
  const page = searchParams.get('page') ?? '1'
  const limit = searchParams.get('limit') ?? '20'

  const upstream = new URL(API_URL)
  upstream.searchParams.set('page', page)
  upstream.searchParams.set('limit', limit)
  if (category) upstream.searchParams.set('category', category)
  if (location) upstream.searchParams.set('location', location)

  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Site-Key': API_KEY,
      },
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Upstream error: ${res.status}`, detail: text.substring(0, 200) },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch articles', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
