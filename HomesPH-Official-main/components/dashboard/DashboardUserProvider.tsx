'use client'

import { createContext, useContext } from 'react'
import type { DashboardUser } from '@/lib/auth/types'

const DashboardUserContext = createContext<DashboardUser | null>(null)

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser
  children: React.ReactNode
}) {
  return (
    <DashboardUserContext.Provider value={user}>
      {children}
    </DashboardUserContext.Provider>
  )
}

export function useDashboardUser() {
  const value = useContext(DashboardUserContext)

  if (!value) {
    throw new Error('useDashboardUser must be used within DashboardUserProvider')
  }

  return value
}
