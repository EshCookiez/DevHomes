import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.HOMESPH_NEWS_BASE_URL!
const API_KEY = process.env.HOMESPH_NEWS_API_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const upstream = new URL(`${BASE_URL}/provinces`)
  const countryId = searchParams.get('country_id')
  if (countryId) upstream.searchParams.set('country_id', countryId)

  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Site-Key': API_KEY,
      },
      next: { revalidate: 3600 },
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
      { error: 'Failed to fetch provinces', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
