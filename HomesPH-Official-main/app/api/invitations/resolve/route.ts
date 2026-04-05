import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user?.email) {
    return NextResponse.json({ token: null }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()
  const email = user.email.trim().toLowerCase()
  const { data, error } = await admin
    .from('company_invitations')
    .select('invitation_token, status, expires_at')
    .eq('email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ invitation_token: string | null; status: string; expires_at: string }>()

  if (error) {
    return NextResponse.json({ token: null, message: error.message }, { status: 500 })
  }

  const fallbackToken = typeof user.user_metadata?.invitation_token === 'string'
    ? user.user_metadata.invitation_token
    : null

  return NextResponse.json({
    token: data?.invitation_token ?? fallbackToken,
  })
}
