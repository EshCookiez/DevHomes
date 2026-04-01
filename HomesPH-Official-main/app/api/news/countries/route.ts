import { NextResponse } from 'next/server'

const BASE_URL = process.env.HOMESPH_NEWS_BASE_URL!
const API_KEY = process.env.HOMESPH_NEWS_API_KEY!

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/countries`, {
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
      { error: 'Failed to fetch countries', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
