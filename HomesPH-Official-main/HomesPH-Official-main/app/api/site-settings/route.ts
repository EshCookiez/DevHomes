import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE

async function fetchSettings() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error('Missing Supabase configuration')
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=key,value`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    } as Record<string, string>,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error: ${res.status} ${res.statusText} | ${text}`)
  }

  const rows: Array<{ key: string; value: unknown }> = await res.json()
  const out: Record<string, unknown> = {}
  for (const row of rows) {
    out[row.key] = row.value
  }
  return out
}

export async function GET() {
  try {
    const data = await fetchSettings()
    return NextResponse.json(data)
  } catch (error) {
    console.error('site-settings API error', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
