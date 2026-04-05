'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  clearStaleBrowserSupabaseSession,
  ensureSupabaseBrowserSessionHealth,
  isInvalidRefreshTokenError,
  supabase,
} from '@/lib/supabase-browser'
import { applyInviteSessionFromHash, hasInviteAuthHash } from '@/lib/supabase-invite-browser'

export default function InviteRedirectHandler() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const redirectInvite = async () => {
      const hasAuthHash = hasInviteAuthHash()
      const hasAuthCode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code')

      try {
        if (!hasAuthHash && !hasAuthCode) {
          await ensureSupabaseBrowserSessionHealth(supabase)
          return
        }

        if (pathname.startsWith('/join/')) {
          return
        }

        if (hasAuthCode) {
          const authCode = new URLSearchParams(window.location.search).get('code')

          if (authCode) {
            const { error } = await supabase.auth.exchangeCodeForSession(authCode)

            if (error) {
              if (isInvalidRefreshTokenError(error)) {
                await clearStaleBrowserSupabaseSession(supabase)
              }

              return
            }
          }
        } else if (hasAuthHash) {
          await applyInviteSessionFromHash(supabase)
        } else {
          const { error } = await supabase.auth.getSession()

          if (error) {
            throw error
          }
        }

        const { data, error } = await supabase.auth.getUser()

        if (cancelled || error) {
          if (error && isInvalidRefreshTokenError(error)) {
            await clearStaleBrowserSupabaseSession(supabase)
          }

          return
        }

        let invitationToken = typeof data.user?.user_metadata?.invitation_token === 'string'
          ? data.user.user_metadata.invitation_token
          : null

        if (!invitationToken) {
          try {
            const response = await fetch('/api/invitations/resolve', {
              method: 'GET',
              cache: 'no-store',
              credentials: 'same-origin',
            })

            if (response.ok) {
              const payload = await response.json() as { token?: string | null }
              invitationToken = payload.token ?? null
            }
          } catch {
            invitationToken = null
          }
        }

        if (typeof invitationToken === 'string' && invitationToken.trim()) {
          router.replace(`/join/${invitationToken}`)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (isInvalidRefreshTokenError(error)) {
          await clearStaleBrowserSupabaseSession(supabase)
          return
        }

        console.error('Invite redirect handler failed.', error)
      }
    }

    void redirectInvite()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return null
}
