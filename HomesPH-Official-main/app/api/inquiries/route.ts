import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { listing_id, project_id, name, email, phone, message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE = process.env.NEXT_SUPABASE_SERVICE_ROLE
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 })
    }

    // Build combined message with contact details (inquiries table has no separate name/email fields)
    const fullMessage = [
      `From: ${name.trim()} <${email.trim()}>`,
      phone ? `Phone: ${phone.trim()}` : null,
      '',
      message.trim(),
    ]
      .filter((l) => l !== null)
      .join('\n')

    const subject = `Inquiry from ${name.trim()}`

    const payload: Record<string, unknown> = {
      subject,
      message: fullMessage,
      status: 'unread',
    }
    if (listing_id && Number.isInteger(Number(listing_id))) {
      payload.listing_id = Number(listing_id)
    }
    if (project_id && Number.isInteger(Number(project_id))) {
      payload.project_id = Number(project_id)
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      } as Record<string, string>,
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Supabase inquiry insert error:', errBody)
      return NextResponse.json({ error: 'Failed to submit inquiry.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Inquiry route error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
