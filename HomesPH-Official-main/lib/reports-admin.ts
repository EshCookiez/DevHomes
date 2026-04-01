import 'server-only'

import { redirect } from 'next/navigation'
import { getDashboardPathForRole } from '@/lib/auth/roles'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import type { ActivityLogRecord, ReportsRawBundle } from '@/lib/reports-types'

const ALLOWED_ROLES = new Set(['super_admin', 'admin'])

function buildDisplayName(row: { full_name: string | null; fname?: string | null; lname?: string | null; email?: string | null }) {
  return row.full_name?.trim() || [row.fname, row.lname].filter(Boolean).join(' ').trim() || row.email || 'Unknown user'
}

export async function requireReportsAccess() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    redirect(getDashboardPathForRole(user.role) ?? '/dashboard')
  }

  return user
}

export async function getReportsRawBundle(): Promise<ReportsRawBundle> {
  await requireReportsAccess()

  const admin = createAdminSupabaseClient()
  const [
    usersResult,
    developersResult,
    projectsResult,
    projectUnitsResult,
    listingsResult,
    leadsResult,
    inquiriesResult,
    listingsLookupResult,
    usersLookupResult,
    activityLogsResult,
  ] = await Promise.all([
    admin.from('user_profiles').select('id,created_at'),
    admin.from('developers_profiles').select('id,created_at'),
    admin.from('projects').select('id,name,created_at'),
    admin.from('project_units').select('id,project_id,created_at'),
    admin.from('property_listings').select('id,project_id,created_at'),
    admin.from('leads').select('id,project_id,assigned_to,source,status,created_at'),
    admin.from('inquiries').select('id,project_id,listing_id,created_at'),
    admin.from('property_listings').select('id,title'),
    admin.from('user_profiles').select('id,full_name,fname,lname'),
    admin.from('activity_logs').select('id,user_profile_id,action,table_name,record_id,created_at').order('created_at', { ascending: false }).limit(50),
  ])

  if (usersResult.error) throw new Error(usersResult.error.message)
  if (developersResult.error) throw new Error(developersResult.error.message)
  if (projectsResult.error) throw new Error(projectsResult.error.message)
  if (projectUnitsResult.error) throw new Error(projectUnitsResult.error.message)
  if (listingsResult.error) throw new Error(listingsResult.error.message)
  if (leadsResult.error) throw new Error(leadsResult.error.message)
  if (inquiriesResult.error) throw new Error(inquiriesResult.error.message)
  if (listingsLookupResult.error) throw new Error(listingsLookupResult.error.message)
  if (usersLookupResult.error) throw new Error(usersLookupResult.error.message)
  if (activityLogsResult.error) throw new Error(activityLogsResult.error.message)

  const userLookup = new Map(((usersLookupResult.data ?? []) as Array<{ id: string; full_name: string | null; fname: string | null; lname: string | null }>).map((user) => [user.id, buildDisplayName(user)]))
  const activityLogs: ActivityLogRecord[] = ((activityLogsResult.data ?? []) as Array<{ id: number; user_profile_id: string | null; action: string; table_name: string; record_id: string; created_at: string | null }>).map((entry) => ({
    id: entry.id,
    user_name: entry.user_profile_id ? userLookup.get(entry.user_profile_id) ?? null : null,
    action: entry.action,
    table_name: entry.table_name,
    record_id: entry.record_id,
    created_at: entry.created_at,
  }))

  return {
    users: (usersResult.data ?? []) as Array<{ id: string; created_at: string | null }>,
    developers: (developersResult.data ?? []) as Array<{ id: number; created_at: string | null }>,
    projects: (projectsResult.data ?? []) as Array<{ id: number; name: string; created_at: string | null }>,
    projectUnits: (projectUnitsResult.data ?? []) as Array<{ id: number; project_id: number | null; created_at: string | null }>,
    listings: (listingsResult.data ?? []) as Array<{ id: number; project_id: number | null; created_at: string | null }>,
    leads: (leadsResult.data ?? []) as Array<{ id: number; project_id: number | null; assigned_to: string | null; source: string | null; status: string | null; created_at: string | null }>,
    inquiries: (inquiriesResult.data ?? []) as Array<{ id: number; project_id: number | null; listing_id: number | null; created_at: string | null }>,
    projectsLookup: ((projectsResult.data ?? []) as Array<{ id: number; name: string }>).map((project) => ({ id: project.id, name: project.name })),
    listingsLookup: ((listingsLookupResult.data ?? []) as Array<{ id: number; title: string }>).map((listing) => ({ id: listing.id, title: listing.title })),
    usersLookup: Array.from(userLookup.entries()).map(([id, full_name]) => ({ id, full_name })),
    activityLogs,
  }
}