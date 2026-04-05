import { redirect } from 'next/navigation'
import { getCurrentDashboardUser } from '@/lib/auth/user'

export default async function DashboardRootPage() {
  const user = await getCurrentDashboardUser()

  if (!user) {
    redirect('/login')
  }

  // Redirect to the role-specific dashboard
  redirect(`/dashboard/${user.roleSegment}`)
}
