'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProfileImageUpload from './profile-image-upload'
import type { DashboardUser } from '@/lib/auth/types'

export default function ProfileHeader({
  user,
  onImageUpdated,
}: {
  user: DashboardUser
  onImageUpdated: (url: string) => void
}) {
  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U'

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-slate-50">
      <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <Avatar className="h-24 w-24 rounded-xl border border-slate-200 shadow-sm">
              <AvatarImage src={user.profileImageUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback className="rounded-xl bg-[#1428ae] text-white text-2xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Profile Settings</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{user.fullName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                  {user.role.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-slate-500">{user.email}</span>
              </div>
            </div>
          </div>
          <ProfileImageUpload userId={user.userId} currentImageUrl={user.profileImageUrl} onUploaded={onImageUpdated} />
        </div>
      </CardContent>
    </Card>
  )
}
