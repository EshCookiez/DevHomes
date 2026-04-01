'use client'

import { useState } from 'react'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import DashboardNavLoader from './DashboardNavLoader'
import { DashboardUserProvider } from './DashboardUserProvider'
import type { DashboardUser } from '@/lib/auth/types'

export default function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: DashboardUser
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <DashboardUserProvider user={user}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <DashboardTopbar onMenuToggle={() => setCollapsed(v => !v)} />
          <main className="flex-1 overflow-y-auto relative">
            <DashboardNavLoader />
            {children}
          </main>
        </div>
      </div>
    </DashboardUserProvider>
  )
}
