import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.HOMESPH_NEWS_BASE_URL!
const API_KEY = process.env.HOMESPH_NEWS_API_KEY!

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''

  try {
    let upstreamRes: Response

    if (contentType.includes('multipart/form-data')) {
      // Forward multipart bodies (includes optional logo file upload) as-is
      const formData = await request.formData()
      upstreamRes = await fetch(`${BASE_URL}/subscribe`, {
        method: 'POST',
        headers: { 'X-Site-Key': API_KEY },
        body: formData,
      })
    } else {
      // JSON body — validate required fields before proxying
      const body = await request.json()
      const { email, categories, countries } = body as Record<string, unknown>

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
      }
      if (!Array.isArray(categories) || categories.length === 0) {
        return NextResponse.json({ error: 'At least one category is required.' }, { status: 400 })
      }
      if (!Array.isArray(countries) || countries.length === 0) {
        return NextResponse.json({ error: 'At least one country is required.' }, { status: 400 })
      }

      upstreamRes = await fetch(`${BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Site-Key': API_KEY,
        },
        body: JSON.stringify(body),
      })
    }

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text()
      return NextResponse.json(
        { error: `Upstream error: ${upstreamRes.status}`, detail: text.substring(0, 200) },
        { status: upstreamRes.status }
      )
    }

    const data = await upstreamRes.json()
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to subscribe', detail: (err as Error).message },
      { status: 500 }
    )
  }
}
