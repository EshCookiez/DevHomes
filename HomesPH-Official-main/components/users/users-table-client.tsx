'use client'

import dynamic from 'next/dynamic'
import type { ManagedUserRecord, UserRoleRecord } from '@/lib/users-types'

const UsersTable = dynamic(() => import('./users-table'), { ssr: false })

export default function UsersTableClient({
  initialUsers,
  roles,
}: {
  initialUsers: ManagedUserRecord[]
  roles: UserRoleRecord[]
}) {
  return <UsersTable initialUsers={initialUsers} roles={roles} />
}
