import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building,
  ClipboardList,
  FileText,
  FolderOpen,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  Link2,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'

export type DashboardPermissionLevel = 'view' | 'create' | 'edit' | 'delete' | 'manage' | 'manage-own'
export type DashboardActionKey = 'view' | 'create' | 'edit' | 'delete' | 'manage'

export type DashboardActionPermissions = Record<DashboardActionKey, boolean>
export type DashboardPermissionMap = Partial<Record<DashboardModuleKey, DashboardActionPermissions>>

export type DashboardModuleKey =
  | 'users'
  | 'developers'
  | 'projects'
  | 'listings'
  | 'leads'
  | 'inquiries'
  | 'amenities'
  | 'property-types'
  | 'locations'
  | 'media'
  | 'reports'
  | 'activity-logs'
  | 'settings'
  | 'team'
  | 'salespersons'
  | 'saved-listings'
  | 'saved-projects'
  | 'referral-leads'
  | 'units'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  moduleKey?: DashboardModuleKey
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

export interface RoleModuleDefinition {
  moduleKey: DashboardModuleKey
  label: string
  href: string
}

interface RoleDashboardConfig {
  label: string
  badge: string
  navGroups: NavGroup[]
  permissions: Partial<Record<DashboardModuleKey, DashboardPermissionLevel>>
}

export const ROLE_META: Record<string, { label: string; badge: string }> = {
  'super-admin': { label: 'Super Admin', badge: 'bg-violet-500' },
  admin: { label: 'Admin', badge: 'bg-blue-500' },
  franchise: { label: 'Franchise', badge: 'bg-amber-500' },
  salesperson: { label: 'Salesperson', badge: 'bg-emerald-500' },
  buyer: { label: 'Buyer', badge: 'bg-cyan-500' },
  ambassador: { label: 'Ambassador', badge: 'bg-pink-500' },
  developer: { label: 'Developer', badge: 'bg-orange-500' },
  agent: { label: 'Agent', badge: 'bg-lime-500' },
  'bank-manager': { label: 'Bank Manager', badge: 'bg-teal-500' },
}

const ROLE_DASHBOARD_CONFIG: Record<string, RoleDashboardConfig> = {
  'super-admin': {
    ...ROLE_META['super-admin'],
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard }] },
      { title: 'User Management', items: [{ label: 'Users', href: '/dashboard/users', icon: Users, moduleKey: 'users' }] },
      { title: 'Developers', items: [{ label: 'Developers', href: '/dashboard/developers', icon: Building, moduleKey: 'developers' }] },
      { title: 'Projects', items: [{ label: 'Projects', href: '/dashboard/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Listings', href: '/dashboard/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Sales', items: [{ label: 'Leads', href: '/dashboard/leads', icon: Target, moduleKey: 'leads' }, { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }] },
      { title: 'Content', items: [{ label: 'Amenities', href: '/dashboard/amenities', icon: Sparkles, moduleKey: 'amenities' }, { label: 'Property Types', href: '/dashboard/property-types', icon: Layers, moduleKey: 'property-types' }, { label: 'Locations', href: '/dashboard/locations', icon: MapPin, moduleKey: 'locations' }] },
      { title: 'Media', items: [{ label: 'Media Library', href: '/dashboard/media', icon: Image, moduleKey: 'media' }] },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3, moduleKey: 'reports' }, { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: ClipboardList, moduleKey: 'activity-logs' }] },
      { title: 'System', items: [{ label: 'Settings', href: '/dashboard/settings', icon: Settings, moduleKey: 'settings' }, { label: 'Role Permissions', href: '/dashboard/role-permissions', icon: Shield }] },
    ],
    permissions: {
      users: 'manage', developers: 'manage', projects: 'manage', listings: 'manage', leads: 'manage', inquiries: 'manage', amenities: 'manage', 'property-types': 'manage', locations: 'manage', media: 'manage', reports: 'manage', 'activity-logs': 'manage', settings: 'manage',
    },
  },
  admin: {
    ...ROLE_META.admin,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard }] },
      { title: 'User Management', items: [{ label: 'Users', href: '/dashboard/users', icon: Users, moduleKey: 'users' }] },
      { title: 'Developers', items: [{ label: 'Developers', href: '/dashboard/developers', icon: Building, moduleKey: 'developers' }] },
      { title: 'Projects', items: [{ label: 'Projects', href: '/dashboard/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Listings', href: '/dashboard/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Sales', items: [{ label: 'Leads', href: '/dashboard/leads', icon: Target, moduleKey: 'leads' }, { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }] },
      { title: 'Content', items: [{ label: 'Amenities', href: '/dashboard/amenities', icon: Sparkles, moduleKey: 'amenities' }, { label: 'Property Types', href: '/dashboard/property-types', icon: Layers, moduleKey: 'property-types' }, { label: 'Locations', href: '/dashboard/locations', icon: MapPin, moduleKey: 'locations' }] },
      { title: 'Media', items: [{ label: 'Media Library', href: '/dashboard/media', icon: Image, moduleKey: 'media' }] },
      { title: 'Analytics', items: [{ label: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3, moduleKey: 'reports' }, { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: ClipboardList, moduleKey: 'activity-logs' }] },
      { title: 'System', items: [{ label: 'Settings', href: '/dashboard/settings', icon: Settings, moduleKey: 'settings' }, { label: 'Role Permissions', href: '/dashboard/role-permissions', icon: Shield }] },
    ],
    permissions: {
      users: 'manage', developers: 'manage', projects: 'manage', listings: 'manage', leads: 'manage', inquiries: 'manage', amenities: 'manage', 'property-types': 'manage', locations: 'manage', media: 'manage', reports: 'manage', 'activity-logs': 'manage', settings: 'manage',
    },
  },
  franchise: {
    ...ROLE_META.franchise,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/franchise', icon: LayoutDashboard }] },
      { title: 'Team', items: [{ label: 'My Team', href: '/dashboard/franchise/team', icon: Users, moduleKey: 'team' }, { label: 'Salespersons', href: '/dashboard/franchise/salespersons', icon: Users, moduleKey: 'salespersons' }] },
      { title: 'Inventory', items: [{ label: 'Projects', href: '/dashboard/franchise/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Listings', href: '/dashboard/franchise/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Sales', items: [{ label: 'Leads', href: '/dashboard/franchise/leads', icon: Target, moduleKey: 'leads' }, { label: 'Inquiries', href: '/dashboard/franchise/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }, { label: 'Reports', href: '/dashboard/franchise/reports', icon: BarChart3, moduleKey: 'reports' }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { team: 'manage', salespersons: 'manage', projects: 'view', listings: 'view', leads: 'manage', inquiries: 'manage', reports: 'view' },
  },
  salesperson: {
    ...ROLE_META.salesperson,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/salesperson', icon: LayoutDashboard }] },
      { title: 'Marketplace', items: [{ label: 'Projects', href: '/dashboard/salesperson/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Listings', href: '/dashboard/salesperson/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Pipeline', items: [{ label: 'My Leads', href: '/dashboard/salesperson/leads', icon: Target, moduleKey: 'leads' }, { label: 'My Inquiries', href: '/dashboard/salesperson/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }, { label: 'Saved Listings', href: '/dashboard/salesperson/saved-listings', icon: Star, moduleKey: 'saved-listings' }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'view', listings: 'view', leads: 'manage-own', inquiries: 'manage-own', 'saved-listings': 'manage-own' },
  },
  agent: {
    ...ROLE_META.agent,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/agent', icon: LayoutDashboard }] },
      { title: 'Marketplace', items: [{ label: 'Projects', href: '/dashboard/agent/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Listings', href: '/dashboard/agent/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Pipeline', items: [{ label: 'My Leads', href: '/dashboard/agent/leads', icon: Target, moduleKey: 'leads' }, { label: 'My Inquiries', href: '/dashboard/agent/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'view', listings: 'view', leads: 'manage-own', inquiries: 'view' },
  },
  buyer: {
    ...ROLE_META.buyer,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/buyer', icon: LayoutDashboard }] },
      { title: 'Marketplace', items: [{ label: 'Browse Projects', href: '/dashboard/buyer/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Browse Listings', href: '/dashboard/buyer/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Saved', items: [{ label: 'Saved Listings', href: '/dashboard/buyer/saved-listings', icon: Star, moduleKey: 'saved-listings' }, { label: 'Saved Projects', href: '/dashboard/buyer/saved-projects', icon: Star, moduleKey: 'saved-projects' }] },
      { title: 'Account', items: [{ label: 'My Inquiries', href: '/dashboard/buyer/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }, { label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'view', listings: 'view', 'saved-listings': 'manage-own', 'saved-projects': 'manage-own', inquiries: 'create' },
  },
  ambassador: {
    ...ROLE_META.ambassador,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/ambassador', icon: LayoutDashboard }] },
      { title: 'Referrals', items: [{ label: 'Links & Codes', href: '/dashboard/ambassador/links', icon: Link2 }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'view', listings: 'view', 'referral-leads': 'view', reports: 'view' },
  },
  developer: {
    ...ROLE_META.developer,
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/developer', icon: LayoutDashboard }] },
      { title: 'Projects', items: [{ label: 'My Projects', href: '/dashboard/developer/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Units', href: '/dashboard/developer/units', icon: Layers, moduleKey: 'units' }, { label: 'Amenities', href: '/dashboard/developer/amenities', icon: Sparkles, moduleKey: 'amenities' }, { label: 'Listings', href: '/dashboard/developer/listings', icon: Home, moduleKey: 'listings' }] },
      { title: 'Sales', items: [{ label: 'Inquiries', href: '/dashboard/developer/inquiries', icon: MessageSquare, moduleKey: 'inquiries' }, { label: 'Leads', href: '/dashboard/developer/leads', icon: Target, moduleKey: 'leads' }, { label: 'Reports', href: '/dashboard/developer/reports', icon: BarChart3, moduleKey: 'reports' }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'manage-own', units: 'manage-own', amenities: 'view', listings: 'manage-own', inquiries: 'view', leads: 'view', reports: 'view' },
  },
  'bank-manager': {
    ...ROLE_META['bank-manager'],
    navGroups: [
      { items: [{ label: 'Dashboard', href: '/dashboard/bank-manager', icon: LayoutDashboard }] },
      { title: 'Loans', items: [{ label: 'Applications', href: '/dashboard/bank-manager/applications', icon: FileText }, { label: 'Buyers', href: '/dashboard/bank-manager/buyers', icon: Users }, { label: 'Projects', href: '/dashboard/bank-manager/projects', icon: FolderOpen, moduleKey: 'projects' }, { label: 'Reports', href: '/dashboard/bank-manager/reports', icon: BarChart3, moduleKey: 'reports' }, { label: 'Financing', href: '/dashboard/bank-manager/financing', icon: FileText }] },
      { title: 'Account', items: [{ label: 'Profile', href: '/dashboard/profile', icon: Users }] },
    ],
    permissions: { projects: 'view', reports: 'view' },
  },
}

export function getSidebarByRole(role: string | null | undefined): NavGroup[] {
  if (!role) return []
  return ROLE_DASHBOARD_CONFIG[role]?.navGroups ?? []
}

export function getRolePermissionLevel(role: string | null | undefined, moduleKey: DashboardModuleKey): DashboardPermissionLevel | null {
  if (!role) return null
  return ROLE_DASHBOARD_CONFIG[role]?.permissions[moduleKey] ?? null
}

function getResolvedActionPermissions(role: string | null | undefined, moduleKey: DashboardModuleKey, permissionMap?: DashboardPermissionMap): DashboardActionPermissions {
  return permissionMap?.[moduleKey] ?? permissionLevelToActions(getRolePermissionLevel(role, moduleKey))
}

export function getSidebarByRoleWithPermissions(role: string | null | undefined, permissionMap?: DashboardPermissionMap): NavGroup[] {
  const groups = getSidebarByRole(role)

  if (!permissionMap) return groups

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.moduleKey || getResolvedActionPermissions(role, item.moduleKey, permissionMap).view),
    }))
    .filter((group) => group.items.length > 0)
}

export function canAccessDashboardModule(role: string | null | undefined, moduleKey: DashboardModuleKey, permissionMap?: DashboardPermissionMap) {
  return getResolvedActionPermissions(role, moduleKey, permissionMap).view
}

export function canPerformDashboardAction(role: string | null | undefined, moduleKey: DashboardModuleKey, action: DashboardActionKey, permissionMap?: DashboardPermissionMap) {
  return getResolvedActionPermissions(role, moduleKey, permissionMap)[action]
}

export function getPermissionLabel(level: DashboardPermissionLevel | null) {
  if (!level) return 'No access'
  return level === 'manage-own' ? 'Manage Own' : level.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getActionPermissionLabel(actions: DashboardActionPermissions) {
  if (actions.manage) return 'Manage'
  if (!actions.view) return 'No access'
  if (actions.create && actions.edit && actions.delete) return 'Manage Own'
  if (actions.view && !actions.create && !actions.edit && !actions.delete) return 'View Only'

  const enabled = [
    actions.view ? 'View' : null,
    actions.create ? 'Create' : null,
    actions.edit ? 'Edit' : null,
    actions.delete ? 'Delete' : null,
  ].filter(Boolean)

  return enabled.join(', ')
}

export function permissionLevelToActions(level: DashboardPermissionLevel | null): DashboardActionPermissions {
  if (!level) {
    return { view: false, create: false, edit: false, delete: false, manage: false }
  }

  if (level === 'manage') {
    return { view: true, create: true, edit: true, delete: true, manage: true }
  }

  if (level === 'manage-own') {
    return { view: true, create: true, edit: true, delete: true, manage: false }
  }

  if (level === 'delete') {
    return { view: true, create: false, edit: false, delete: true, manage: false }
  }

  if (level === 'edit') {
    return { view: true, create: false, edit: true, delete: false, manage: false }
  }

  if (level === 'create') {
    return { view: true, create: true, edit: false, delete: false, manage: false }
  }

  return { view: true, create: false, edit: false, delete: false, manage: false }
}

export const DASHBOARD_MODULE_ACTION_SUPPORT: Record<DashboardModuleKey, DashboardActionPermissions> = {
  users: { view: true, create: true, edit: true, delete: true, manage: true },
  developers: { view: true, create: true, edit: true, delete: true, manage: true },
  projects: { view: true, create: true, edit: true, delete: true, manage: true },
  listings: { view: true, create: true, edit: true, delete: true, manage: true },
  leads: { view: true, create: true, edit: true, delete: true, manage: true },
  inquiries: { view: true, create: false, edit: true, delete: true, manage: true },
  amenities: { view: true, create: true, edit: true, delete: true, manage: true },
  'property-types': { view: true, create: true, edit: true, delete: true, manage: true },
  locations: { view: true, create: true, edit: true, delete: true, manage: true },
  media: { view: true, create: true, edit: true, delete: true, manage: true },
  reports: { view: true, create: false, edit: false, delete: false, manage: false },
  'activity-logs': { view: true, create: false, edit: false, delete: false, manage: false },
  settings: { view: true, create: false, edit: false, delete: false, manage: true },
  team: { view: true, create: false, edit: false, delete: false, manage: false },
  salespersons: { view: true, create: false, edit: false, delete: false, manage: false },
  'saved-listings': { view: true, create: false, edit: false, delete: false, manage: false },
  'saved-projects': { view: true, create: false, edit: false, delete: false, manage: false },
  'referral-leads': { view: true, create: false, edit: false, delete: false, manage: false },
  units: { view: true, create: true, edit: true, delete: true, manage: false },
}

export function getSupportedDashboardActions(moduleKey: DashboardModuleKey): DashboardActionPermissions {
  return DASHBOARD_MODULE_ACTION_SUPPORT[moduleKey]
}

export function getRoleModuleDefinitions(role: string | null | undefined): RoleModuleDefinition[] {
  const groups = getSidebarByRole(role)
  const seen = new Set<DashboardModuleKey>()
  const items: RoleModuleDefinition[] = []

  for (const group of groups) {
    for (const item of group.items) {
      if (!item.moduleKey || seen.has(item.moduleKey)) continue
      seen.add(item.moduleKey)
      items.push({ moduleKey: item.moduleKey, label: item.label, href: item.href })
    }
  }

  return items
}

export function getRoleNavItem(role: string | null | undefined, moduleSlug: string) {
  const groups = getSidebarByRole(role)
  for (const group of groups) {
    const found = group.items.find((item) => item.href.endsWith(`/${moduleSlug}`) && item.moduleKey)
    if (found) return found
  }
  return null
}

export { ROLE_DASHBOARD_CONFIG }