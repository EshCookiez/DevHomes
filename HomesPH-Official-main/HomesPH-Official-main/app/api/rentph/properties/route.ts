import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.RENTPH_API_URL ?? 'https://rent.ph/api'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const qs = searchParams.toString()

  try {
    const res = await fetch(`${BASE}/properties${qs ? `?${qs}` : ''}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'RentPH API error', status: res.status },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
