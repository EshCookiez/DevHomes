import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import RolePermissionsManager from '@/components/settings/role-permissions-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRolePermissionSettings } from '@/lib/role-permissions-admin'
import { requireSettingsAccess } from '@/lib/settings-admin'

export default async function DashboardRolePermissionsPage() {
  const user = await requireSettingsAccess()

  if (!['super_admin', 'admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  const roles = await getRolePermissionSettings()

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Role Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage database-backed allowed actions for each dashboard role and page.
          </p>
        </div>
        <Link href="/dashboard/settings" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
          Back to Settings
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <ShieldCheck size={18} className="text-[#1428ae]" />
            Role Action Matrix
          </CardTitle>
          <CardDescription>
            This page stores role/page/action combinations in the database for future runtime enforcement and auditing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolePermissionsManager roles={roles} />
        </CardContent>
      </Card>
    </div>
  )
}