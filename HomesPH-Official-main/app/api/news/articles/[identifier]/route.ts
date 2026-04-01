import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.HOMESPH_NEWS_BASE_URL!
const API_KEY = process.env.HOMESPH_NEWS_API_KEY!

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params

  // Only allow safe identifier characters (UUID or slug)
  if (!/^[\w-]+$/.test(identifier)) {
    return NextResponse.json({ error: 'Invalid identifier' }, { status: 400 })
  }

  try {
    const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(identifier)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Site-Key': API_KEY,
      },
      next: { revalidate: 300 },
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

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
      { error: 'Failed to fetch article', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
