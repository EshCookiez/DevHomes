import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.RENTPH_API_URL ?? 'https://rent.ph/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  try {
    const res = await fetch(`${BASE}/property/${slug}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Not found', status: res.status },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
