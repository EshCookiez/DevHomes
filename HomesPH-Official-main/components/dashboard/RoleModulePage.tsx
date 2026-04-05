 'use client'

import { useRouter } from 'next/navigation'
import { Eye, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Column } from '@/components/dashboard/DataTable'
import ActivityFeed, { type ActivityItem } from '@/components/dashboard/ActivityFeed'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import KpiCard from '@/components/dashboard/KpiCard'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { canPerformDashboardAction, getActionPermissionLabel, type DashboardModuleKey } from '@/lib/dashboard-permissions'
import { useDashboardUser } from '@/components/dashboard/DashboardUserProvider'

type TableRow = Record<string, string | number>

interface ModuleDefinition {
  title: string
  description: string
  createLabel: string
  metrics: Array<{ title: string; value: string | number; tone: 'blue' | 'emerald' | 'amber' }>
  chart: { title: string; subtitle: string; data: Array<{ name: string; value: number }>; color: string; type: 'area' | 'bar' }
  tableTitle: string
  columns: Column<TableRow>[]
  rows: TableRow[]
  activity: ActivityItem[]
}

function toneClasses(tone: 'blue' | 'emerald' | 'amber') {
  return {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  }[tone]
}

function getDefinition(moduleKey: DashboardModuleKey, label: string): ModuleDefinition {
  const statusColumn = { key: 'status', label: 'Status', render: (value: TableRow[keyof TableRow]) => <StatusBadge status={String(value)} /> }

  const definitions: Partial<Record<DashboardModuleKey, ModuleDefinition>> = {
    users: {
      title: label, description: 'Role-controlled access for user management surfaces.', createLabel: 'Create User',
      metrics: [{ title: 'Visible Users', value: 84, tone: 'blue' }, { title: 'Editable', value: 22, tone: 'emerald' }, { title: 'Restricted', value: 62, tone: 'amber' }],
      chart: { title: 'User Access Trend', subtitle: 'Users visible to this role over time', data: [{ name: 'Oct', value: 46 }, { name: 'Nov', value: 51 }, { name: 'Dec', value: 55 }, { name: 'Jan', value: 63 }, { name: 'Feb', value: 84 }], color: '#2563eb', type: 'area' },
      tableTitle: 'User Records', columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, statusColumn], rows: [{ name: 'Maria Cruz', role: 'Salesperson', status: 'Active' }, { name: 'Ben Tan', role: 'Agent', status: 'Active' }], activity: baseActivity('Updated user role permissions'),
    },
    developers: {
      title: label, description: 'Monitor developer organizations and their published assets.', createLabel: 'Create Developer',
      metrics: [{ title: 'Visible Developers', value: 18, tone: 'blue' }, { title: 'Published', value: 15, tone: 'emerald' }, { title: 'Pending Review', value: 3, tone: 'amber' }],
      chart: { title: 'Developer Pipeline', subtitle: 'Active developer profiles this quarter', data: [{ name: 'Oct', value: 9 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 13 }, { name: 'Jan', value: 16 }, { name: 'Feb', value: 18 }], color: '#0f766e', type: 'bar' },
      tableTitle: 'Developer Organizations', columns: [{ key: 'developer', label: 'Developer' }, { key: 'projects', label: 'Projects' }, statusColumn], rows: [{ developer: 'Cebu Prime Estates', projects: 6, status: 'Active' }, { developer: 'Metro Luxe Realty', projects: 4, status: 'Pending' }], activity: baseActivity('Developer portfolio updated'),
    },
    projects: {
      title: label, description: 'Browse project inventory, status, and market coverage for your role.', createLabel: 'Create Project',
      metrics: [{ title: 'Projects', value: 24, tone: 'blue' }, { title: 'Active Markets', value: 8, tone: 'emerald' }, { title: 'Pending Launch', value: 5, tone: 'amber' }],
      chart: { title: 'Projects Visibility', subtitle: 'Projects available in this dashboard scope', data: [{ name: 'Oct', value: 12 }, { name: 'Nov', value: 14 }, { name: 'Dec', value: 17 }, { name: 'Jan', value: 21 }, { name: 'Feb', value: 24 }], color: '#2563eb', type: 'bar' },
      tableTitle: 'Project Portfolio', columns: [{ key: 'project', label: 'Project' }, { key: 'location', label: 'Location' }, { key: 'units', label: 'Units' }, statusColumn], rows: [{ project: 'Azure Sky Residences', location: 'Cebu', units: 320, status: 'Active' }, { project: 'BGC Tower 2', location: 'Taguig', units: 210, status: 'Active' }, { project: 'Davao Highlands', location: 'Davao', units: 140, status: 'Pending' }], activity: baseActivity('Project inventory synced'),
    },
    listings: {
      title: label, description: 'Review live property listings and the listing inventory assigned to your scope.', createLabel: 'Create Listing',
      metrics: [{ title: 'Listings', value: 118, tone: 'blue' }, { title: 'Published', value: 92, tone: 'emerald' }, { title: 'Drafts', value: 26, tone: 'amber' }],
      chart: { title: 'Listings Published', subtitle: 'Monthly listing volume in your role scope', data: [{ name: 'Oct', value: 18 }, { name: 'Nov', value: 22 }, { name: 'Dec', value: 31 }, { name: 'Jan', value: 38 }, { name: 'Feb', value: 41 }], color: '#059669', type: 'area' },
      tableTitle: 'Listings', columns: [{ key: 'listing', label: 'Listing' }, { key: 'project', label: 'Project' }, { key: 'price', label: 'Price' }, statusColumn], rows: [{ listing: '3BR Corner Unit', project: 'Azure Sky', price: '₱5.8M', status: 'Published' }, { listing: '1BR Loft', project: 'BGC Tower 2', price: '₱8.9M', status: 'Draft' }], activity: baseActivity('Listing availability refreshed'),
    },
    leads: {
      title: label, description: 'Track lead health, ownership, and the next actions needed across your pipeline.', createLabel: 'Create Lead',
      metrics: [{ title: 'Leads in Scope', value: 36, tone: 'blue' }, { title: 'Qualified', value: 18, tone: 'emerald' }, { title: 'Needs Action', value: 7, tone: 'amber' }],
      chart: { title: 'Lead Pipeline', subtitle: 'Lead flow over the last five months', data: [{ name: 'Oct', value: 9 }, { name: 'Nov', value: 12 }, { name: 'Dec', value: 17 }, { name: 'Jan', value: 24 }, { name: 'Feb', value: 36 }], color: '#7c3aed', type: 'bar' },
      tableTitle: 'Leads', columns: [{ key: 'lead', label: 'Lead' }, { key: 'source', label: 'Source' }, { key: 'project', label: 'Project' }, statusColumn], rows: [{ lead: 'Santos Family', source: 'Website', project: 'Azure Sky', status: 'Qualified' }, { lead: 'Maria Tan', source: 'Referral', project: 'BGC Tower 2', status: 'Contacted' }], activity: baseActivity('Lead assignment updated'),
    },
    inquiries: {
      title: label, description: 'Review inbound inquiries and manage communication workflows permitted for your role.', createLabel: 'Reply to Inquiry',
      metrics: [{ title: 'Inquiries', value: 19, tone: 'blue' }, { title: 'Awaiting Reply', value: 6, tone: 'amber' }, { title: 'Resolved', value: 11, tone: 'emerald' }],
      chart: { title: 'Inquiry Volume', subtitle: 'Inbound message trend in your dashboard scope', data: [{ name: 'Oct', value: 4 }, { name: 'Nov', value: 6 }, { name: 'Dec', value: 9 }, { name: 'Jan', value: 13 }, { name: 'Feb', value: 19 }], color: '#d97706', type: 'area' },
      tableTitle: 'Inquiry Queue', columns: [{ key: 'buyer', label: 'Buyer' }, { key: 'project', label: 'Project' }, { key: 'channel', label: 'Channel' }, statusColumn], rows: [{ buyer: 'Celine Ong', project: 'Azure Sky', channel: 'Web Form', status: 'Unread' }, { buyer: 'Jose Mercado', project: 'Iloilo Suites', channel: 'Email', status: 'Replied' }], activity: baseActivity('Inquiry status changed'),
    },
    amenities: {
      title: label, description: 'View the amenity catalog available to projects and inventory records.', createLabel: 'Create Amenity',
      metrics: [{ title: 'Amenities', value: 28, tone: 'blue' }, { title: 'Most Used', value: 'Parking', tone: 'emerald' }, { title: 'New This Month', value: 2, tone: 'amber' }],
      chart: { title: 'Amenity Usage', subtitle: 'Most common amenities in active projects', data: [{ name: 'Pool', value: 22 }, { name: 'Gym', value: 19 }, { name: 'Parking', value: 25 }, { name: 'Clubhouse', value: 16 }, { name: 'Security', value: 24 }], color: '#2563eb', type: 'bar' },
      tableTitle: 'Amenity Catalog', columns: [{ key: 'amenity', label: 'Amenity' }, { key: 'usage', label: 'Usage' }, statusColumn], rows: [{ amenity: 'Swimming Pool', usage: '22 projects', status: 'Visible' }, { amenity: 'Clubhouse', usage: '16 projects', status: 'Visible' }], activity: baseActivity('Amenity catalog reviewed'),
    },
    units: {
      title: label, description: 'Monitor unit availability, pricing, and inventory status for managed projects.', createLabel: 'Create Unit',
      metrics: [{ title: 'Units', value: 96, tone: 'blue' }, { title: 'Available', value: 34, tone: 'emerald' }, { title: 'Reserved', value: 12, tone: 'amber' }],
      chart: { title: 'Unit Availability', subtitle: 'Inventory movement across the last five months', data: [{ name: 'Oct', value: 18 }, { name: 'Nov', value: 23 }, { name: 'Dec', value: 27 }, { name: 'Jan', value: 31 }, { name: 'Feb', value: 34 }], color: '#0f766e', type: 'bar' },
      tableTitle: 'Unit Inventory', columns: [{ key: 'unit', label: 'Unit' }, { key: 'project', label: 'Project' }, { key: 'price', label: 'Price' }, statusColumn], rows: [{ unit: 'Unit 304-A', project: 'Azure Sky', price: '₱6.8M', status: 'Available' }, { unit: 'Unit 808-C', project: 'Cloud 9', price: '₱14.5M', status: 'Reserved' }], activity: baseActivity('Unit pricing reviewed'),
    },
    reports: {
      title: label, description: 'Review performance summaries, conversion trends, and scoped revenue insights.', createLabel: 'Generate Report',
      metrics: [{ title: 'Reports Ready', value: 5, tone: 'blue' }, { title: 'Best Month', value: 'February', tone: 'emerald' }, { title: 'At Risk', value: 1, tone: 'amber' }],
      chart: { title: 'Performance Trend', subtitle: 'Recent reporting output in your role scope', data: [{ name: 'Oct', value: 52 }, { name: 'Nov', value: 58 }, { name: 'Dec', value: 61 }, { name: 'Jan', value: 67 }, { name: 'Feb', value: 74 }], color: '#2563eb', type: 'area' },
      tableTitle: 'Recent Reports', columns: [{ key: 'report', label: 'Report' }, { key: 'range', label: 'Range' }, statusColumn], rows: [{ report: 'Conversion Summary', range: 'Last 30 days', status: 'Ready' }, { report: 'Lead Attribution', range: 'Quarter to date', status: 'Ready' }], activity: baseActivity('Report generated successfully'),
    },
    'saved-listings': {
      title: label, description: 'Review bookmarked listings and prioritize the ones that need follow-up.', createLabel: 'Save Listing',
      metrics: [{ title: 'Saved Listings', value: 12, tone: 'blue' }, { title: 'Hot Matches', value: 4, tone: 'emerald' }, { title: 'Needs Review', value: 3, tone: 'amber' }],
      chart: { title: 'Saved Listing Trend', subtitle: 'Listings saved in the last five months', data: [{ name: 'Oct', value: 2 }, { name: 'Nov', value: 4 }, { name: 'Dec', value: 7 }, { name: 'Jan', value: 9 }, { name: 'Feb', value: 12 }], color: '#7c3aed', type: 'bar' },
      tableTitle: 'Saved Listings', columns: [{ key: 'listing', label: 'Listing' }, { key: 'location', label: 'Location' }, { key: 'price', label: 'Price' }, statusColumn], rows: [{ listing: '3BR Condo - Azure Sky', location: 'Cebu IT Park', price: '₱5.8M', status: 'Watching' }, { listing: '1BR Loft - Iloilo Suites', location: 'Iloilo City', price: '₱2.4M', status: 'Saved' }], activity: baseActivity('Saved listing updated'),
    },
    'saved-projects': {
      title: label, description: 'Track shortlisted projects for follow-up and inquiry conversion.', createLabel: 'Save Project',
      metrics: [{ title: 'Saved Projects', value: 5, tone: 'blue' }, { title: 'Priority Projects', value: 2, tone: 'emerald' }, { title: 'Needs Review', value: 1, tone: 'amber' }],
      chart: { title: 'Saved Projects Trend', subtitle: 'Projects shortlisted over time', data: [{ name: 'Oct', value: 1 }, { name: 'Nov', value: 2 }, { name: 'Dec', value: 3 }, { name: 'Jan', value: 4 }, { name: 'Feb', value: 5 }], color: '#f59e0b', type: 'bar' },
      tableTitle: 'Saved Projects', columns: [{ key: 'project', label: 'Project' }, { key: 'location', label: 'Location' }, statusColumn], rows: [{ project: 'Azure Sky Residences', location: 'Cebu', status: 'Shortlisted' }, { project: 'BGC Tower 2', location: 'Taguig', status: 'Researching' }], activity: baseActivity('Saved project reviewed'),
    },
    'referral-leads': {
      title: 'Links & Custom Codes', description: 'Manage your referral links and track how your vanity codes are performing offline and online.', createLabel: 'New Code',
      metrics: [{ title: 'Total Clicks', value: '1.2k', tone: 'blue' }, { title: 'Registrations', value: 24, tone: 'emerald' }, { title: 'Active Codes', value: 3, tone: 'amber' }],
      chart: { title: 'Link Performance', subtitle: 'Clicks generated across all shared links', data: [{ name: 'Oct', value: 450 }, { name: 'Nov', value: 620 }, { name: 'Dec', value: 890 }, { name: 'Jan', value: 1100 }, { name: 'Feb', value: 1240 }], color: '#1428ae', type: 'area' },
      tableTitle: 'Your Vanity Codes', columns: [{ key: 'code', label: 'Code' }, { key: 'clicks', label: 'Clicks' }, statusColumn], rows: [{ code: 'SUMMER24', clicks: 450, status: 'Active' }, { code: 'HOMESVIP', clicks: 790, status: 'Active' }], activity: baseActivity('Referral link performance analyzed'),
    },
    'property-types': {
      title: label, description: 'Role-based access to property type taxonomy.', createLabel: 'Create Property Type',
      metrics: [{ title: 'Property Types', value: 14, tone: 'blue' }, { title: 'Used In Listings', value: 12, tone: 'emerald' }, { title: 'Draft Types', value: 2, tone: 'amber' }],
      chart: { title: 'Property Type Usage', subtitle: 'Most common property types in view', data: [{ name: 'Condo', value: 28 }, { name: 'Townhouse', value: 16 }, { name: 'Commercial', value: 11 }, { name: 'Lot Only', value: 7 }, { name: 'House & Lot', value: 14 }], color: '#2563eb', type: 'bar' },
      tableTitle: 'Property Types', columns: [{ key: 'type', label: 'Type' }, { key: 'usage', label: 'Usage' }, statusColumn], rows: [{ type: 'Condominium', usage: '28 listings', status: 'Visible' }, { type: 'Townhouse', usage: '16 listings', status: 'Visible' }], activity: baseActivity('Property type taxonomy reviewed'),
    },
    locations: {
      title: label, description: 'Scoped access to location and market metadata.', createLabel: 'Create Location',
      metrics: [{ title: 'Locations', value: 10, tone: 'blue' }, { title: 'Active', value: 8, tone: 'emerald' }, { title: 'Needs SEO Review', value: 2, tone: 'amber' }],
      chart: { title: 'Location Coverage', subtitle: 'Market coverage available to this role', data: [{ name: 'Cebu', value: 14 }, { name: 'BGC', value: 12 }, { name: 'Iloilo', value: 8 }, { name: 'Davao', value: 10 }, { name: 'Bohol', value: 5 }], color: '#0f766e', type: 'bar' },
      tableTitle: 'Locations', columns: [{ key: 'location', label: 'Location' }, { key: 'slug', label: 'Slug' }, statusColumn], rows: [{ location: 'Cebu', slug: '/cebu', status: 'Active' }, { location: 'Bacolod', slug: '/bacolod', status: 'Inactive' }], activity: baseActivity('Location visibility changed'),
    },
    media: {
      title: label, description: 'Media access is scoped by role permissions.', createLabel: 'Upload Media',
      metrics: [{ title: 'Assets', value: 144, tone: 'blue' }, { title: 'Images', value: 102, tone: 'emerald' }, { title: 'Pending Review', value: 8, tone: 'amber' }],
      chart: { title: 'Media Usage', subtitle: 'Assets added over time', data: [{ name: 'Oct', value: 16 }, { name: 'Nov', value: 22 }, { name: 'Dec', value: 28 }, { name: 'Jan', value: 34 }, { name: 'Feb', value: 44 }], color: '#2563eb', type: 'area' },
      tableTitle: 'Media Assets', columns: [{ key: 'file', label: 'File' }, { key: 'folder', label: 'Folder' }, statusColumn], rows: [{ file: 'azure-sky-hero.jpg', folder: 'projects/azure-sky', status: 'Published' }, { file: 'bgc-floorplan.pdf', folder: 'documents/floorplans', status: 'Draft' }], activity: baseActivity('Media asset visibility synced'),
    },
    'activity-logs': {
      title: label, description: 'Review auditable activity entries available in this role scope.', createLabel: 'Refresh Logs',
      metrics: [{ title: 'Log Entries', value: 48, tone: 'blue' }, { title: 'Today', value: 11, tone: 'emerald' }, { title: 'Flagged', value: 1, tone: 'amber' }],
      chart: { title: 'Activity Volume', subtitle: 'Recent activity events', data: [{ name: 'Oct', value: 8 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 13 }, { name: 'Jan', value: 16 }, { name: 'Feb', value: 21 }], color: '#475569', type: 'bar' },
      tableTitle: 'Activity Logs', columns: [{ key: 'user', label: 'User' }, { key: 'action', label: 'Action' }, statusColumn], rows: [{ user: 'Maria Cruz', action: 'Updated inquiry status', status: 'Success' }, { user: 'Ben Tan', action: 'Viewed listing inventory', status: 'Read' }], activity: baseActivity('Audit log refreshed'),
    },
    settings: {
      title: label, description: 'Global settings access is limited by role.', createLabel: 'Update Settings',
      metrics: [{ title: 'Configs', value: 22, tone: 'blue' }, { title: 'Environment Ready', value: 'Yes', tone: 'emerald' }, { title: 'Needs Review', value: 3, tone: 'amber' }],
      chart: { title: 'Settings Changes', subtitle: 'Configuration updates this quarter', data: [{ name: 'Oct', value: 3 }, { name: 'Nov', value: 6 }, { name: 'Dec', value: 4 }, { name: 'Jan', value: 8 }, { name: 'Feb', value: 5 }], color: '#2563eb', type: 'bar' },
      tableTitle: 'Settings', columns: [{ key: 'setting', label: 'Setting' }, { key: 'scope', label: 'Scope' }, statusColumn], rows: [{ setting: 'Storage Provider', scope: 'Platform', status: 'Active' }, { setting: 'SEO Defaults', scope: 'Public Site', status: 'Reviewed' }], activity: baseActivity('Settings sync completed'),
    },
    team: {
      title: label, description: 'Manage your sales team structure, output, and current workload.', createLabel: 'Add Team Member',
      metrics: [{ title: 'Team Members', value: 6, tone: 'blue' }, { title: 'Active This Week', value: 5, tone: 'emerald' }, { title: 'Needs Coaching', value: 1, tone: 'amber' }],
      chart: { title: 'Team Output', subtitle: 'Managed pipeline performance over time', data: [{ name: 'Oct', value: 9 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 13 }, { name: 'Jan', value: 15 }, { name: 'Feb', value: 18 }], color: '#2563eb', type: 'area' },
      tableTitle: 'Team Members', columns: [{ key: 'member', label: 'Member' }, { key: 'leads', label: 'Leads' }, statusColumn], rows: [{ member: 'Ana Garcia', leads: 24, status: 'Active' }, { member: 'Marco Reyes', leads: 18, status: 'Active' }], activity: baseActivity('Team assignment changed'),
    },
    salespersons: {
      title: label, description: 'View and coordinate the salespersons under your franchise scope.', createLabel: 'Add Salesperson',
      metrics: [{ title: 'Salespersons', value: 5, tone: 'blue' }, { title: 'Quota Hit', value: 3, tone: 'emerald' }, { title: 'At Risk', value: 2, tone: 'amber' }],
      chart: { title: 'Salesperson Conversions', subtitle: 'Closed deals by team member', data: [{ name: 'Ana', value: 12 }, { name: 'Marco', value: 8 }, { name: 'Rosa', value: 14 }, { name: 'Ben', value: 9 }, { name: 'Luis', value: 6 }], color: '#7c3aed', type: 'bar' },
      tableTitle: 'Salespersons', columns: [{ key: 'salesperson', label: 'Salesperson' }, { key: 'conversions', label: 'Conversions' }, statusColumn], rows: [{ salesperson: 'Ana Garcia', conversions: 12, status: 'Active' }, { salesperson: 'Ben Cruz', conversions: 9, status: 'Active' }], activity: baseActivity('Salesperson quota refreshed'),
    },
    suboffices: {
      title: label, description: 'Track branch offices, assigned secretaries, and organization coverage.', createLabel: 'Create Suboffice',
      metrics: [{ title: 'Suboffices', value: 3, tone: 'blue' }, { title: 'Assigned', value: 2, tone: 'emerald' }, { title: 'Needs Setup', value: 1, tone: 'amber' }],
      chart: { title: 'Branch Coverage', subtitle: 'Connected suboffices visible in this dashboard scope', data: [{ name: 'North', value: 4 }, { name: 'Central', value: 6 }, { name: 'South', value: 3 }], color: '#0f766e', type: 'bar' },
      tableTitle: 'Suboffices', columns: [{ key: 'office', label: 'Office' }, { key: 'secretary', label: 'Secretary' }, statusColumn], rows: [{ office: 'Cebu North Branch', secretary: 'Ana Garcia', status: 'Configured' }, { office: 'Davao South Branch', secretary: 'Unassigned', status: 'Pending' }], activity: baseActivity('Suboffice directory refreshed'),
    },
  }

  return definitions[moduleKey] ?? {
    title: label,
    description: 'This dashboard module is visible in your role scope.',
    createLabel: `Open ${label}`,
    metrics: [
      { title: 'Visible Records', value: 0, tone: 'blue' },
      { title: 'Active', value: 0, tone: 'emerald' },
      { title: 'Needs Review', value: 0, tone: 'amber' },
    ],
    chart: {
      title: `${label} Activity`,
      subtitle: 'No scoped activity data is available for this module yet.',
      data: [{ name: 'Now', value: 0 }],
      color: '#2563eb',
      type: 'bar',
    },
    tableTitle: label,
    columns: [{ key: 'name', label: 'Name' }, statusColumn],
    rows: [],
    activity: baseActivity('Scoped dashboard visibility applied'),
  }
}

function baseActivity(message: string): ActivityItem[] {
  return [
    { id: 1, icon: ShieldCheck, iconColor: 'text-blue-700', iconBg: 'bg-blue-50', title: message, description: 'Role-based visibility rules were applied to this module.', time: 'Just now' },
    { id: 2, icon: Eye, iconColor: 'text-emerald-700', iconBg: 'bg-emerald-50', title: 'Scoped records loaded', description: 'Only records available to the current role are shown.', time: '12m ago' },
    { id: 3, icon: Lock, iconColor: 'text-amber-700', iconBg: 'bg-amber-50', title: 'Editing rules enforced', description: 'Unavailable actions remain disabled for read-only access.', time: '1h ago' },
  ]
}

function toneIcon(tone: 'blue' | 'emerald' | 'amber'): LucideIcon {
  return {
    blue: Eye,
    emerald: ShieldCheck,
    amber: Lock,
  }[tone]
}

export default function RoleModulePage({ role, moduleKey, label }: { role: string; moduleKey: DashboardModuleKey; label: string }) {
  const router = useRouter()
  const user = useDashboardUser()
  const moduleDefinition = getDefinition(moduleKey, label)
  const actions = user.dashboardPermissions[moduleKey] ?? { view: false, create: false, edit: false, delete: false, manage: false }
  const permissionLabel = getActionPermissionLabel(actions)
  const canCreate = canPerformDashboardAction(role, moduleKey, 'create', user.dashboardPermissions)
  const canEdit = canPerformDashboardAction(role, moduleKey, 'edit', user.dashboardPermissions)
  const canDelete = canPerformDashboardAction(role, moduleKey, 'delete', user.dashboardPermissions)
  const canManage = canPerformDashboardAction(role, moduleKey, 'manage', user.dashboardPermissions)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900">{moduleDefinition.title}</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {permissionLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">{moduleDefinition.description}</p>
        </div>
         <Button
          type="button"
          disabled={!canCreate}
          className="gap-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Plus size={15} />
          {moduleDefinition.createLabel}
        </Button>
      </div>
 
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Access Summary</CardTitle>
          <CardDescription>Actions in this module are automatically restricted by the current dashboard role.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">View</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Enabled</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Create</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{canCreate ? 'Enabled' : 'Restricted'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Edit</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{canEdit ? 'Enabled' : 'Restricted'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Delete</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{canDelete ? 'Enabled' : 'Restricted'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {moduleDefinition.metrics.map((metric) => {
          const Icon = toneIcon(metric.tone)
          const tone = toneClasses(metric.tone)
          return (
            <KpiCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={Icon}
              iconColor={tone.text}
              iconBg={tone.bg}
              description={metric.tone === 'amber' ? 'Restricted areas remain protected by role policies.' : undefined}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_360px] gap-4">
        <DashboardChart
          title={moduleDefinition.chart.title}
          subtitle={moduleDefinition.chart.subtitle}
          type={moduleDefinition.chart.type}
          data={moduleDefinition.chart.data}
          dataKey="value"
          color={moduleDefinition.chart.color}
        />
        <ActivityFeed title="Recent Access Activity" items={moduleDefinition.activity} />
      </div>

      <DataTable
        title={moduleDefinition.tableTitle}
        data={moduleDefinition.rows}
        columns={moduleDefinition.columns}
        emptyText="No records are available in this module for your current access scope."
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Allowed Actions</CardTitle>
          <CardDescription>The UI reflects the same permission rules enforced by role-based routing.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1.5 text-slate-700">
            <Eye size={13} />
            View records
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1.5 text-slate-700">
            <Plus size={13} />
            {canCreate ? 'Can create' : 'Create restricted'}
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1.5 text-slate-700">
            <Pencil size={13} />
            {canEdit ? 'Can edit' : 'Edit restricted'}
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1.5 text-slate-700">
            <Trash2 size={13} />
            {canDelete ? 'Can delete' : 'Delete restricted'}
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1.5 text-slate-700">
            <ShieldCheck size={13} />
            {canManage ? 'Full management access' : 'Scoped access only'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
