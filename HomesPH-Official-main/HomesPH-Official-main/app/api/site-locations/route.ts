import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json([], { status: 200 })

    const url = `${SUPABASE_URL}/rest/v1/site_locations?select=title,slug&is_active=eq.true&order=title.asc`
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
      } as Record<string, string>,
      next: { revalidate: 300 },
    })

    if (!res.ok) return NextResponse.json([], { status: 200 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json([], { status: 200 })
  }
}
