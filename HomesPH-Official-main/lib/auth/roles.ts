export const DB_ROLE_TO_ROUTE_SEGMENT = {
  super_admin: 'super-admin',
  admin: 'admin',
  franchise: 'franchise',
  salesperson: 'salesperson',
  buyer: 'buyer',
  affiliate: 'affiliate',
  developer: 'developer',
  agent: 'agent',
  bank_manager: 'bank-manager',
  franchise_secretary: 'secretary',
} as const

export const ROUTE_SEGMENT_TO_DB_ROLE = Object.fromEntries(
  Object.entries(DB_ROLE_TO_ROUTE_SEGMENT).map(([dbRole, segment]) => [segment, dbRole]),
) as Record<(typeof DB_ROLE_TO_ROUTE_SEGMENT)[keyof typeof DB_ROLE_TO_ROUTE_SEGMENT], keyof typeof DB_ROLE_TO_ROUTE_SEGMENT>

export type DatabaseRole = keyof typeof DB_ROLE_TO_ROUTE_SEGMENT
export type RouteRoleSegment = (typeof DB_ROLE_TO_ROUTE_SEGMENT)[DatabaseRole]
export const ROLE_ROUTE_SEGMENTS = Object.values(DB_ROLE_TO_ROUTE_SEGMENT) as RouteRoleSegment[]

export function getRoleRouteSegment(role: string | null | undefined): RouteRoleSegment | null {
  if (!role) return null
  return DB_ROLE_TO_ROUTE_SEGMENT[role as DatabaseRole] ?? null
}

export function getDatabaseRoleFromSegment(segment: string | null | undefined): DatabaseRole | null {
  if (!segment) return null
  return ROUTE_SEGMENT_TO_DB_ROLE[segment as RouteRoleSegment] ?? null
}

export function isRouteRoleSegment(segment: string | null | undefined): segment is RouteRoleSegment {
  if (!segment) return false
  return ROLE_ROUTE_SEGMENTS.includes(segment as RouteRoleSegment)
}

export function getDashboardPathForRole(role: string | null | undefined): string | null {
  const segment = getRoleRouteSegment(role)
  return segment ? `/dashboard/${segment}` : null
}
