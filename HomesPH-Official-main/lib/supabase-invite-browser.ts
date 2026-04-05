import type { SupabaseClient } from '@supabase/supabase-js'

function getHashParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  return new URLSearchParams(hash)
}

export function hasInviteAuthHash() {
  const hashParams = getHashParams()

  return (
    Boolean(hashParams.get('access_token')) &&
    Boolean(hashParams.get('refresh_token')) &&
    hashParams.get('type') === 'invite'
  )
}

export async function applyInviteSessionFromHash(client: SupabaseClient) {
  const hashParams = getHashParams()
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  if (!accessToken || !refreshToken || hashParams.get('type') !== 'invite') {
    return false
  }

  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    throw error
  }

  if (typeof window !== 'undefined') {
    const nextUrl = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(window.history.state, '', nextUrl)
  }

  return true
}
