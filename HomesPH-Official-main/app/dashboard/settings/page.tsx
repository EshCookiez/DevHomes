import Link from 'next/link'
import { Settings2, Search, MapPin, DatabaseZap, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GeneralSettings from '@/components/settings/general-settings'
import SeoSettings from '@/components/settings/seo-settings'
import LocationsManager from '@/components/settings/locations-manager'
import StorageSettings from '@/components/settings/storage-settings'
import AdvancedSettings from '@/components/settings/advanced-settings'
import { getLocations, getSiteSettings, requireSettingsAccess } from '@/lib/settings-admin'

const TAB_ITEMS = [
  { value: 'general', label: 'General Settings', icon: Settings2 },
  { value: 'seo', label: 'SEO Settings', icon: Search },
  { value: 'locations', label: 'Locations', icon: MapPin },
  { value: 'storage', label: 'Storage', icon: DatabaseZap },
  { value: 'advanced', label: 'Advanced', icon: ShieldCheck },
] as const

export default async function DashboardSettingsPage() {
  const user = await requireSettingsAccess()

  if (!['super_admin', 'admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  const [settings, locations] = await Promise.all([
    getSiteSettings(),
    getLocations(),
  ])

  const storageConfig = {
    supabaseBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || '',
    s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
    s3Endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || '',
    s3Region: process.env.NEXT_PUBLIC_S3_REGION || '',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage global site configuration, SEO defaults, storage visibility, and location metadata.
          </p>
        </div>
        <Link href="/dashboard/role-permissions" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
          <ShieldCheck size={15} />
          Role Permissions
        </Link>
      </div>

      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-slate-50">
        <CardHeader>
          <CardTitle className="text-slate-900">Platform Configuration</CardTitle>
          <CardDescription>
            Available to Super Admin and Admin roles only. Changes are applied globally across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="gap-6">
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
              {TAB_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                    <Icon size={15} />
                    {item.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value="general">
              <GeneralSettings settings={settings} />
            </TabsContent>
            <TabsContent value="seo">
              <SeoSettings settings={settings} />
            </TabsContent>
            <TabsContent value="locations">
              <LocationsManager locations={locations} />
            </TabsContent>
            <TabsContent value="storage">
              <StorageSettings config={storageConfig} />
            </TabsContent>
            <TabsContent value="advanced">
              <AdvancedSettings settings={settings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
