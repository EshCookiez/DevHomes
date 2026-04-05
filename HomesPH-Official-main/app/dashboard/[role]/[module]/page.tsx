import Link from 'next/link'
import DashboardChart from '@/components/dashboard/DashboardChart'
import StatusBadge from '@/components/dashboard/StatusBadge'
import ListingsTable from '@/components/listings/listings-table'
import ProjectsTable from '@/components/projects/projects-table'
import RoleListingsModuleClient from '@/components/dashboard/RoleListingsModuleClient'
import RoleModulePage from '@/components/dashboard/RoleModulePage'
import RoleProjectsModuleClient from '@/components/dashboard/RoleProjectsModuleClient'
import RoleSavedListingsModuleClient from '@/components/dashboard/RoleSavedListingsModuleClient'
import RoleSavedProjectsModuleClient from '@/components/dashboard/RoleSavedProjectsModuleClient'
import RoleUnitsModuleClient from '@/components/dashboard/RoleUnitsModuleClient'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import InquiriesManagementClient from '@/components/inquiries/inquiries-management-client'
import LeadsManagementClient from '@/components/leads/leads-management-client'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { canAccessDashboardModule, canPerformDashboardAction, getRoleNavItem } from '@/lib/dashboard-permissions'
import { getInquiries, getInquiryAgents, getInquiryListings, getInquiryProjects } from '@/lib/inquiries-admin'
import { getListingDeveloperOptions, getListingProjectOptions, getListingUnitOptions } from '@/lib/listings-admin'
import { getLeadAgents, getLeadAnalytics, getLeadProjects, getLeads, getLeadUsers } from '@/lib/leads-admin'
import { getDeveloperOptions } from '@/lib/projects-admin'
import { getRoleListings, getRoleProjects, getRoleSavedListings, getRoleSavedProjects, getRoleUnits, getDeveloperProfileIds } from '@/lib/role-dashboard-data'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getFranchiseDashboardSnapshot } from '@/app/dashboard/franchise/actions'
import { redirect } from 'next/navigation'

interface RoleModulePageProps {
  params: Promise<{ role: string; module: string }>
}

export default async function DashboardRoleModulePage({ params }: RoleModulePageProps) {
  const { role, module } = await params
  const user = await getCurrentDashboardUser()
  const navItem = getRoleNavItem(role, module)

  if (!user) {
    redirect('/login')
  }

  if (!navItem?.moduleKey || !canAccessDashboardModule(role, navItem.moduleKey, user.dashboardPermissions)) {
    redirect(`/dashboard/${role}`)
  }

  if (navItem.moduleKey === 'projects') {
    const actions = {
      view: canPerformDashboardAction(role, 'projects', 'view', user.dashboardPermissions),
      create: canPerformDashboardAction(role, 'projects', 'create', user.dashboardPermissions),
      edit: canPerformDashboardAction(role, 'projects', 'edit', user.dashboardPermissions),
      delete: canPerformDashboardAction(role, 'projects', 'delete', user.dashboardPermissions),
      manage: canPerformDashboardAction(role, 'projects', 'manage', user.dashboardPermissions),
    }
    const projects = await getRoleProjects(role, user.profileId)

    if (actions.create || actions.edit || actions.delete || actions.manage) {
      let developers = await getDeveloperOptions()

      if (role === 'developer') {
        const myDevIds = await getDeveloperProfileIds(user.profileId)
        if (myDevIds.length > 0) {
          developers = developers.filter((d) => myDevIds.includes(d.id))
        }
      }

      return (
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{navItem.label}</h1>
            <p className="mt-1 text-sm text-slate-500">Manage project inventory inside the {role.replace(/-/g, ' ')} dashboard scope.</p>
          </div>
          <ProjectsTable initialProjects={projects} developers={developers} canCreate={actions.create} canEdit={actions.edit} canDelete={actions.delete} canManage={actions.manage} />
        </div>
      )
    }

    return (
      <RoleProjectsModuleClient
        title={navItem.label}
        description={`Visible projects for the ${role.replace(/-/g, ' ')} dashboard.`}
        projects={projects}
        actions={actions}
      />
    )
  }

  if (navItem.moduleKey === 'listings') {
    const actions = {
      view: canPerformDashboardAction(role, 'listings', 'view', user.dashboardPermissions),
      create: canPerformDashboardAction(role, 'listings', 'create', user.dashboardPermissions),
      edit: canPerformDashboardAction(role, 'listings', 'edit', user.dashboardPermissions),
      delete: canPerformDashboardAction(role, 'listings', 'delete', user.dashboardPermissions),
      manage: canPerformDashboardAction(role, 'listings', 'manage', user.dashboardPermissions),
    }
    const listings = await getRoleListings(role, user.profileId)

    if (actions.create || actions.edit || actions.delete || actions.manage) {
      const [developers, projects, units] = await Promise.all([
        getListingDeveloperOptions(),
        getListingProjectOptions(),
        getListingUnitOptions(),
      ])

      return (
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{navItem.label}</h1>
            <p className="mt-1 text-sm text-slate-500">Manage listing inventory inside the {role.replace(/-/g, ' ')} dashboard scope.</p>
          </div>
          <ListingsTable initialListings={listings} developers={developers} projects={projects} units={units} canCreate={actions.create} canEdit={actions.edit} canDelete={actions.delete} canManage={actions.manage} />
        </div>
      )
    }

    return (
      <RoleListingsModuleClient
        title={navItem.label}
        description={`Listings available inside the ${role.replace(/-/g, ' ')} dashboard scope.`}
        listings={listings}
        actions={actions}
      />
    )
  }

  if (navItem.moduleKey === 'saved-listings' && ['buyer', 'salesperson'].includes(role)) {
    const items = await getRoleSavedListings(user.profileId)
    return <RoleSavedListingsModuleClient title={navItem.label} description="Track the listings you bookmarked for follow-up." items={items} />
  }

  if (navItem.moduleKey === 'saved-projects' && role === 'buyer') {
    const items = await getRoleSavedProjects(user.profileId)
    return <RoleSavedProjectsModuleClient title={navItem.label} description="Track the projects you shortlisted for future inquiries and comparisons." items={items} />
  }

  if (navItem.moduleKey === 'units' && role === 'developer') {
    const [units, ownedProjectsResult] = await Promise.all([
      getRoleUnits(user.profileId),
      (async () => {
        const admin = createAdminSupabaseClient()
        const { data: devProfiles } = await admin
          .from('developers_profiles')
          .select('id')
          .eq('user_profile_id', user.profileId)
        const developerIds = (devProfiles ?? []).map((d: { id: number }) => d.id)
        if (!developerIds.length) {
           const { data: allProjects } = await admin
             .from('projects')
             .select('id, name')
             .order('name', { ascending: true })
           return (allProjects ?? []) as { id: number; name: string }[]
        }
        const { data: projects } = await admin
          .from('projects')
          .select('id, name')
          .in('developer_id', developerIds)
          .order('name', { ascending: true })
        return (projects ?? []) as { id: number; name: string }[]
      })(),
    ])
    // Developers can always manage units, but they need projects to assign them to
    const canCreate = true
    return (
      <RoleUnitsModuleClient
        title={navItem.label}
        description="Monitor unit inventory tied to your developer projects."
        units={units}
        canCreate={canCreate}
        projects={ownedProjectsResult}
      />
    )
  }

  if (navItem.moduleKey === 'leads' && ['franchise', 'salesperson', 'agent', 'developer', 'secretary'].includes(role)) {
    const canCreate = canPerformDashboardAction(role, 'leads', 'create', user.dashboardPermissions)
    const canEdit = canPerformDashboardAction(role, 'leads', 'edit', user.dashboardPermissions)
    const canDelete = canPerformDashboardAction(role, 'leads', 'delete', user.dashboardPermissions)
    const canManage = canPerformDashboardAction(role, 'leads', 'manage', user.dashboardPermissions)
    const [leads, analytics, users, agents, projects] = await Promise.all([
      getLeads(),
      getLeadAnalytics(),
      getLeadUsers(),
      getLeadAgents(),
      getLeadProjects(),
    ])

    return (
      <LeadsManagementClient
        initialLeads={leads}
        analytics={analytics}
        users={users}
        agents={agents}
        projects={projects}
        pageTitle={navItem.label}
        pageDescription={
          role === 'developer'
            ? 'Read-only project lead visibility for your owned developments.'
            : role === 'secretary'
              ? 'Assign and monitor queued leads inside your secretary scope.'
              : 'Manage the leads inside your assigned dashboard scope.'
        }
        canCreate={canCreate}
        canEdit={canEdit || canManage}
        canAssign={canManage}
        canDelete={role === 'secretary' ? false : canDelete || canManage}
        canReturn={canManage}
        enablePipeline={role === 'franchise' || role === 'salesperson' || role === 'agent'}
      />
    )
  }

  if (navItem.moduleKey === 'inquiries' && ['buyer', 'developer', 'franchise', 'secretary', 'salesperson', 'agent'].includes(role)) {
    const canEdit = canPerformDashboardAction(role, 'inquiries', 'edit', user.dashboardPermissions)
    const canManage = canPerformDashboardAction(role, 'inquiries', 'manage', user.dashboardPermissions)
    const canDelete = canPerformDashboardAction(role, 'inquiries', 'delete', user.dashboardPermissions)
    const [inquiries, projects, listings, agents] = await Promise.all([
      getInquiries(),
      getInquiryProjects(),
      getInquiryListings(),
      getInquiryAgents(),
    ])

    return (
      <InquiriesManagementClient
        initialInquiries={inquiries}
        projects={projects}
        listings={listings}
        agents={agents}
        pageTitle={navItem.label}
        pageDescription={
          role === 'buyer'
            ? 'Review the inquiries you have sent from your account.'
            : role === 'developer'
              ? 'Read-only inquiry visibility for your developer projects and listings.'
              : role === 'secretary'
                ? 'Assign and monitor queued inquiries inside your secretary scope.'
                : 'Manage inbound inquiries across your queue and assigned agents.'
        }
        canReply={canEdit || canManage}
        canUpdateStatus={canEdit || canManage}
        canDelete={role === 'secretary' || role === 'salesperson' || role === 'agent' ? false : canDelete || canManage}
        canAssign={canManage}
        canReturn={canManage}
      />
    )
  }

  if (role === 'franchise' && ['team', 'salespersons', 'reports'].includes(navItem.moduleKey)) {
    const snapshot = await getFranchiseDashboardSnapshot()

    if (navItem.moduleKey === 'reports') {
      return <FranchiseReportsView label={navItem.label} snapshot={snapshot} />
    }

    return (
      <FranchiseMemberScopeView
        label={navItem.label}
        onlySalespersons={navItem.moduleKey === 'salespersons'}
        snapshot={snapshot}
      />
    )
  }

  return <RoleModulePage role={role} moduleKey={navItem.moduleKey} label={navItem.label} />
}

function FranchiseMetric({
  description,
  title,
  value,
}: {
  description: string
  title: string
  value: number
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{value}</p>
        <p className="mt-1.5 text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}

function FranchiseMemberScopeView({
  label,
  onlySalespersons,
  snapshot,
}: {
  label: string
  onlySalespersons: boolean
  snapshot: Awaited<ReturnType<typeof getFranchiseDashboardSnapshot>>
}) {
  const scopedMembers = onlySalespersons
    ? snapshot.members.filter((member) => member.systemRole === 'agent')
    : snapshot.members

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{label}</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Live Data
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {onlySalespersons
              ? 'Live salesperson and agent records linked to your franchise organization.'
              : 'Live member records across the main franchise and connected suboffices.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/dashboard/franchise/suboffices">View Suboffices</Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
            <Link href="/dashboard/franchise/settings">Update Organization</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FranchiseMetric title="Visible Records" value={scopedMembers.length} description="Members currently linked to your franchise scope." />
        <FranchiseMetric
          title="Approved"
          value={scopedMembers.filter((member) => member.status === 'approved').length}
          description="Members with approved and active dashboard access."
        />
        <FranchiseMetric
          title="Needs Review"
          value={scopedMembers.filter((member) => ['pending_approval', 'under_review', 'correction_required'].includes(member.status)).length}
          description="Members still going through onboarding and review."
        />
        <FranchiseMetric
          title="Suboffice Coverage"
          value={new Set(scopedMembers.map((member) => member.companyId)).size}
          description="Distinct offices represented by the current member list."
        />
      </div>

      <DashboardChart
        title={onlySalespersons ? 'Salesperson Onboarding' : 'Team Onboarding'}
        subtitle="New member records linked to the organization over the last 6 months."
        type="area"
        data={snapshot.applicationsByMonth}
        dataKey="count"
        color={onlySalespersons ? '#059669' : '#1428ae'}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">{label}</CardTitle>
          <CardDescription>
            {onlySalespersons
              ? 'Agent-facing member records inside the franchise structure.'
              : 'All live member records available to the franchise owner.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-4 py-4">Office</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Phone</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scopedMembers.length ? scopedMembers.map((member) => (
                <tr key={`${member.companyId}-${member.profileId}`} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{member.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.email || 'No email on file'}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{member.workplace}</td>
                  <td className="px-4 py-4 text-slate-600">{member.roleLabel}</td>
                  <td className="px-4 py-4"><StatusBadge status={member.status} /></td>
                  <td className="px-4 py-4 text-slate-600">{member.phone || 'No phone on file'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Not available'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    No live member records are available in this franchise scope yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function FranchiseReportsView({
  label,
  snapshot,
}: {
  label: string
  snapshot: Awaited<ReturnType<typeof getFranchiseDashboardSnapshot>>
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{label}</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              Live Data
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Organization reporting based on the current franchise network, member queue, branch coverage, and invitation activity.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
          <Link href="/dashboard/franchise/settings">Open Organization Settings</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FranchiseMetric title="Network Members" value={snapshot.summary.networkMembers} description="Total members linked across the franchise network." />
        <FranchiseMetric title="Pending Queue" value={snapshot.summary.pendingApplications} description="Pending approval, correction, and owner-ready applications." />
        <FranchiseMetric title="Pending Invites" value={snapshot.summary.pendingInvites} description="Invitation links that are still waiting to be accepted." />
        <FranchiseMetric title="Assigned Secretaries" value={snapshot.summary.assignedSecretaries} description="Branches with a currently assigned secretary record." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardChart
          title="Applications by Month"
          subtitle="New live member records linked to the franchise organization."
          type="bar"
          data={snapshot.applicationsByMonth}
          dataKey="count"
          color="#1428ae"
        />
        <DashboardChart
          title="Members by Office"
          subtitle="Current member counts per office and suboffice."
          type="bar"
          data={snapshot.officeBreakdown}
          dataKey="count"
          color="#059669"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Office Report</CardTitle>
            <CardDescription>Live branch summaries for the parent office and connected suboffices.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Office</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Members</th>
                  <th className="px-4 py-4">Queue</th>
                  <th className="px-6 py-4">Secretary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {snapshot.offices.map((office) => (
                  <tr key={office.companyId} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{office.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{office.address}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{office.isParent ? 'Parent Office' : 'Suboffice'}</td>
                    <td className="px-4 py-4 text-slate-600">{office.memberCount}</td>
                    <td className="px-4 py-4 text-slate-600">{office.pendingApplications}</td>
                    <td className="px-6 py-4 text-slate-600">{office.secretaryName || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">Queue Breakdown</CardTitle>
            <CardDescription>Current member status totals inside the franchise organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Approved</span>
              <span className="text-lg font-black text-slate-900">
                {snapshot.members.filter((member) => member.status === 'approved').length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Pending Approval</span>
              <span className="text-lg font-black text-slate-900">
                {snapshot.members.filter((member) => member.status === 'pending_approval').length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Ready for Owner</span>
              <span className="text-lg font-black text-slate-900">
                {snapshot.members.filter((member) => member.status === 'under_review').length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Correction Required</span>
              <span className="text-lg font-black text-slate-900">
                {snapshot.members.filter((member) => member.status === 'correction_required').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
