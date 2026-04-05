'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, MapPin, ShieldCheck, User, UserRound, UserRoundCog } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DashboardUser } from '@/lib/auth/types'
import type { ProfileBundle } from '@/lib/profile-types'
import ProfileHeader from './profile-header'
import ProfileBasicTab from './profile-basic-tab'
import ProfilePersonalTab from './profile-personal-tab'
import ProfileContactTab from './profile-contact-tab'
import ProfileAddressTab from './profile-address-tab'
import ProfileSecurityTab from './profile-security-tab'
import { skipProfileCompletionAction } from '@/app/dashboard/profile/actions'

const TAB_ITEMS = [
  { value: 'basic', label: 'Basic Information', icon: User },
  { value: 'personal', label: 'Personal Details', icon: UserRound },
  { value: 'contact', label: 'Contact Information', icon: UserRoundCog },
  { value: 'address', label: 'Address', icon: MapPin },
  { value: 'security', label: 'Security', icon: ShieldCheck },
] as const

export default function ProfileSettingsClient({
  user,
  initialBundle,
  profileRequired,
}: {
  user: DashboardUser
  initialBundle: ProfileBundle
  profileRequired: boolean
}) {
  const [profile, setProfile] = useState(initialBundle.profile)
  const [contact, setContact] = useState(initialBundle.contact)
  const [addresses, setAddresses] = useState(initialBundle.addresses)

  const summaryName = useMemo(() => {
    return profile.full_name?.trim() || [profile.fname, profile.lname].filter(Boolean).join(' ') || user.fullName
  }, [profile, user.fullName])

  const currentImageUrl = profile.profile_image_url ?? user.profileImageUrl

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {profileRequired && !user.profileComplete && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="font-semibold text-amber-900">Please complete your profile before using the dashboard.</p>
                <p className="mt-1 text-sm text-amber-800/80">
                  Missing: {user.missingProfileFields.join(', ')}
                </p>
              </div>
            </div>
            <form action={skipProfileCompletionAction}>
              <Button type="submit" variant="outline" className="rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                Skip For Now
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <ProfileHeader
        user={{ ...user, fullName: summaryName, profileImageUrl: currentImageUrl }}
        onImageUpdated={(url) => {
          setProfile(current => ({ ...current, profile_image_url: url }))
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        <Card className="border-slate-200 shadow-sm sticky top-6">
          <CardContent className="px-6 py-6 space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Profile Preview</p>
              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-900">{summaryName}</h2>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{user.role.replace(/_/g, ' ')}</Badge>
              {user.profileComplete ? (
                <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">Profile Complete</Badge>
              ) : (
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">Needs Attention</Badge>
              )}
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Role</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{user.role.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Primary Mobile</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{contact.primary_mobile || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Birthday</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{profile.birthday || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Addresses</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{addresses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="gap-5">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
            {TAB_ITEMS.map(item => {
              const Icon = item.icon
              return (
                <TabsTrigger key={item.value} value={item.value} className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Icon size={15} />
                  {item.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="basic">
            <ProfileBasicTab
              profile={profile}
              onUpdated={(nextProfile) => setProfile(current => ({ ...current, ...nextProfile }))}
            />
          </TabsContent>
          <TabsContent value="personal">
            <ProfilePersonalTab
              profile={profile}
              onUpdated={(nextProfile) => setProfile(current => ({ ...current, ...nextProfile }))}
            />
          </TabsContent>
          <TabsContent value="contact">
            <ProfileContactTab
              contact={contact}
              onUpdated={(nextContact) => setContact(nextContact)}
            />
          </TabsContent>
          <TabsContent value="address">
            <ProfileAddressTab addresses={addresses} onUpdated={setAddresses} />
          </TabsContent>
          <TabsContent value="security">
            <ProfileSecurityTab email={user.email} lastLoginAt={initialBundle.lastLoginAt} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
