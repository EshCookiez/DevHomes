import ListingsTable from '@/components/listings/listings-table'
import ProjectsTable from '@/components/projects/projects-table'
import RoleListingsModuleClient from '@/components/dashboard/RoleListingsModuleClient'
import RoleModulePage from '@/components/dashboard/RoleModulePage'
import RoleProjectsModuleClient from '@/components/dashboard/RoleProjectsModuleClient'
import RoleSavedListingsModuleClient from '@/components/dashboard/RoleSavedListingsModuleClient'
import RoleSavedProjectsModuleClient from '@/components/dashboard/RoleSavedProjectsModuleClient'
import RoleUnitsModuleClient from '@/components/dashboard/RoleUnitsModuleClient'
import InquiriesManagementClient from '@/components/inquiries/inquiries-management-client'
import LeadsManagementClient from '@/components/leads/leads-management-client'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { canAccessDashboardModule, canPerformDashboardAction, getRoleNavItem } from '@/lib/dashboard-permissions'
import { getInquiries, getInquiryListings, getInquiryProjects } from '@/lib/inquiries-admin'
import { getListingDeveloperOptions, getListingProjectOptions, getListingUnitOptions } from '@/lib/listings-admin'
import { getLeadAgents, getLeadAnalytics, getLeadProjects, getLeads, getLeadUsers } from '@/lib/leads-admin'
import { getDeveloperOptions } from '@/lib/projects-admin'
import { getRoleListings, getRoleProjects, getRoleSavedListings, getRoleSavedProjects, getRoleUnits, getDeveloperProfileIds } from '@/lib/role-dashboard-data'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
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

  if (navItem.moduleKey === 'leads' && ['broker', 'salesperson', 'agent', 'developer'].includes(role)) {
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
        pageDescription={role === 'developer' ? 'Read-only project lead visibility for your owned developments.' : 'Manage the leads inside your assigned dashboard scope.'}
        canCreate={canCreate}
        canEdit={canEdit || canManage}
        canAssign={canManage}
        canDelete={canDelete || canManage}
        enablePipeline={canEdit || canManage}
      />
    )
  }

  if (navItem.moduleKey === 'inquiries' && ['buyer', 'developer'].includes(role)) {
    const canEdit = canPerformDashboardAction(role, 'inquiries', 'edit', user.dashboardPermissions)
    const canManage = canPerformDashboardAction(role, 'inquiries', 'manage', user.dashboardPermissions)
    const canDelete = canPerformDashboardAction(role, 'inquiries', 'delete', user.dashboardPermissions)
    const [inquiries, projects, listings] = await Promise.all([
      getInquiries(),
      getInquiryProjects(),
      getInquiryListings(),
    ])

    return (
      <InquiriesManagementClient
        initialInquiries={inquiries}
        projects={projects}
        listings={listings}
        pageTitle={navItem.label}
        pageDescription={role === 'buyer' ? 'Review the inquiries you have sent from your account.' : 'Read-only inquiry visibility for your developer projects and listings.'}
        canReply={canEdit || canManage}
        canUpdateStatus={canEdit || canManage}
        canDelete={canDelete || canManage}
      />
    )
  }

  return <RoleModulePage role={role} moduleKey={navItem.moduleKey} label={navItem.label} />
}