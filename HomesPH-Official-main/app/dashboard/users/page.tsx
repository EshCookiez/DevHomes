import { Clock3, ShieldCheck, UserPlus, UsersRound } from 'lucide-react'
import { ACCOUNT_STATUS_PENDING_APPROVAL } from '@/lib/account-status'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from '@/components/users/users-table'
import { getManagedUsers, getUserRoles, requireUsersAccess } from '@/lib/users-admin'

export default async function DashboardUsersPage() {
  await requireUsersAccess()

  const [users, roles] = await Promise.all([
    getManagedUsers(),
    getUserRoles(),
  ])

  const activeUsers = users.filter((user) => user.is_active).length
  const pendingUsers = users.filter((user) => user.account_status === ACCOUNT_STATUS_PENDING_APPROVAL).length
  const admins = users.filter((user) => ['super_admin', 'admin'].includes(user.role ?? '')).length

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Users Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage platform accounts, access roles, and account status for internal and external users.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UsersRound size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="text-2xl font-black tracking-tight text-slate-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="text-2xl font-black tracking-tight text-slate-900">{pendingUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Active Accounts</p>
              <p className="text-2xl font-black tracking-tight text-slate-900">{activeUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 px-5 py-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <UserPlus size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">Admins and Super Admins</p>
              <p className="text-2xl font-black tracking-tight text-slate-900">{admins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <UsersTable initialUsers={users} roles={roles} />
    </div>
  )
}