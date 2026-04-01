import DashboardShell from '@/components/dashboard/DashboardShell'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  const headerStore = await headers()
  const requestedRoleSegment = headerStore.get('x-dashboard-role-segment')
  const requestedPageSegment = headerStore.get('x-dashboard-page-segment')
  const cookieStore = await cookies()
  const skipProfileCompletion = cookieStore.get('profile-completion-skip')?.value === '1'

  if (requestedRoleSegment && requestedRoleSegment !== user.roleSegment) {
    redirect(`/dashboard/${user.roleSegment}`)
  }

  if (!user.profileComplete && requestedPageSegment && requestedPageSegment !== 'profile' && !skipProfileCompletion) {
    redirect('/dashboard/profile?profileRequired=1')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
