'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ReactNode } from 'react'

export default function LogoutButton({
  children,
  className,
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    if (loading) return

    setLoading(true)
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <button type="button" title={title} onClick={handleLogout} disabled={loading} className={className}>
      {children}
    </button>
  )
}
