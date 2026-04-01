'use client'

import { useMemo, useState, useTransition } from 'react'
import { Lock, Save, ShieldCheck } from 'lucide-react'
import { saveRolePermissionsAction } from '@/app/dashboard/role-permissions/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getSupportedDashboardActions, type DashboardModuleKey } from '@/lib/dashboard-permissions'
import type { RolePermissionRoleRecord } from '@/lib/role-permissions-types'

const ACTION_COLUMNS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'manage', label: 'Manage' },
] as const

type ActionColumnKey = (typeof ACTION_COLUMNS)[number]['key']

function buildInitialState(roles: RolePermissionRoleRecord[]) {
  return Object.fromEntries(
    roles.map((role) => [
      role.roleName,
      Object.fromEntries(
        role.pages.map((page) => [
          page.pageKey,
          {
            canView: page.actions.view,
            canCreate: page.actions.create,
            canEdit: page.actions.edit,
            canDelete: page.actions.delete,
            canManage: page.actions.manage,
          },
        ]),
      ),
    ]),
  ) as Record<string, Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canManage: boolean }>>
}

export default function RolePermissionsManager({ roles }: { roles: RolePermissionRoleRecord[] }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [activeRole, setActiveRole] = useState(roles[0]?.roleName ?? '')
  const [state, setState] = useState(() => buildInitialState(roles))

  const role = useMemo(
    () => roles.find((item) => item.roleName === activeRole) ?? roles[0] ?? null,
    [activeRole, roles],
  )

  function toggle(pageKey: string, actionKey: ActionColumnKey, checked: boolean) {
    setState((current) => {
      const roleState = current[activeRole] ?? {}
      const pageState = roleState[pageKey] ?? { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false }
      const supported = getSupportedDashboardActions(pageKey as DashboardModuleKey)
      if (!supported[actionKey]) {
        return current
      }
      const nextPageState = {
        ...pageState,
        [actionKey === 'view' ? 'canView' : actionKey === 'create' ? 'canCreate' : actionKey === 'edit' ? 'canEdit' : actionKey === 'delete' ? 'canDelete' : 'canManage']: checked,
      }

      if (actionKey === 'manage' && checked) {
        nextPageState.canView = true
        nextPageState.canCreate = true
        nextPageState.canEdit = true
        nextPageState.canDelete = true
      }

      if ((actionKey === 'create' || actionKey === 'edit' || actionKey === 'delete' || actionKey === 'manage') && checked) {
        nextPageState.canView = true
      }

      return {
        ...current,
        [activeRole]: {
          ...roleState,
          [pageKey]: nextPageState,
        },
      }
    })
  }

  function handleSave() {
    if (!role) return

    const entries = role.pages.map((page) => {
      const current = state[role.roleName]?.[page.pageKey] ?? {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManage: false,
      }

      return {
        pageKey: page.pageKey,
        canView: current.canView,
        canCreate: current.canCreate,
        canEdit: current.canEdit,
        canDelete: current.canDelete,
        canManage: current.canManage,
      }
    })

    startTransition(async () => {
      const result = await saveRolePermissionsAction(role.roleName, entries)
      toast({
        title: result.success ? 'Role permissions saved' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    })
  }

  if (!role) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-10 text-center text-sm text-slate-500">
          No roles are available to configure yet.
        </CardContent>
      </Card>
    )
  }

  const configuredCount = role.pages.filter((page) => page.source === 'database').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {roles.map((item) => (
          <button
            key={item.roleName}
            type="button"
            onClick={() => setActiveRole(item.roleName)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${item.roleName === role.roleName ? 'border-blue-600 bg-[#1428ae] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {item.roleLabel}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Role</CardDescription>
            <CardTitle className="text-slate-900">{role.roleLabel}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{role.description || 'No role description available.'}</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Pages Managed</CardDescription>
            <CardTitle className="text-slate-900">{role.pages.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Dashboard pages/modules currently exposed for this role.</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Database Overrides</CardDescription>
            <CardTitle className="text-slate-900">{configuredCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">Rows already stored in the database instead of inherited defaults.</CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Lock size={18} className="text-[#1428ae]" />
            Allowed Actions Per Page
          </CardTitle>
          <CardDescription>
            Configure which actions this role can perform on each dashboard page. Runtime checks now use the resolved database permission map for the supported dashboard modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-bold">Page</th>
                  <th className="px-4 py-3 font-bold">Path</th>
                  <th className="px-4 py-3 font-bold">Source</th>
                  {ACTION_COLUMNS.map((action) => (
                    <th key={action.key} className="px-4 py-3 text-center font-bold">{action.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {role.pages.map((page) => {
                  const pageState = state[role.roleName]?.[page.pageKey] ?? {
                    canView: false,
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                    canManage: false,
                  }
                  const supported = getSupportedDashboardActions(page.pageKey)

                  return (
                    <tr key={page.pageKey} className="border-b border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{page.pageLabel}</div>
                        <div className="text-xs text-slate-500">{page.pageKey}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{page.pagePath}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={page.source === 'database' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}>
                          {page.source === 'database' ? 'Database' : 'Default'}
                        </Badge>
                      </td>
                      {ACTION_COLUMNS.map((action) => {
                        const isSupported = supported[action.key]
                        const checked = action.key === 'view'
                          ? pageState.canView
                          : action.key === 'create'
                            ? pageState.canCreate
                            : action.key === 'edit'
                              ? pageState.canEdit
                              : action.key === 'delete'
                                ? pageState.canDelete
                                : pageState.canManage

                        return (
                          <td key={action.key} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isSupported}
                              onChange={(event) => toggle(page.pageKey, action.key, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-[#1428ae] focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1428ae]" />
              Saving writes to the new role_page_action_permissions table for the selected role.
            </div>
            <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Save size={15} />
              {isPending ? 'Saving...' : `Save ${role.roleLabel}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}