'use client'

import { useMemo, useState, useTransition } from 'react'
import { Bell, Shield, UserRoundPlus, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { saveSettingsAction } from '@/app/dashboard/settings/actions'
import { extractSettingValue, type SiteSettingRecord } from '@/lib/settings-types'
import { useToast } from '@/hooks/use-toast'

const TOGGLES = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Temporarily hide public pages while maintenance is active.', icon: Shield },
  { key: 'registration_enabled', label: 'Registration Enabled', description: 'Allow new franchise, developer, and buyer registrations.', icon: UserRoundPlus },
  { key: 'email_notifications', label: 'Email Notifications', description: 'Send system email notifications for key admin events.', icon: Bell },
] as const

export default function AdvancedSettings({ settings }: { settings: SiteSettingRecord[] }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const initialValues = useMemo(() => Object.fromEntries(
    TOGGLES.map(toggle => {
      const match = settings.find(setting => setting.key === toggle.key)
      return [toggle.key, Boolean(extractSettingValue(match?.value, false))]
    }),
  ) as Record<string, boolean>, [settings])

  const [values, setValues] = useState<Record<string, boolean>>(initialValues)

  function handleSave() {
    startTransition(async () => {
      const result = await saveSettingsAction(TOGGLES.map(toggle => ({
        key: toggle.key,
        value: values[toggle.key],
        description: toggle.description,
        category: 'advanced',
      })))

      toast({
        title: result.success ? 'Advanced settings updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {TOGGLES.map(toggle => {
          const Icon = toggle.icon
          return (
            <Card key={toggle.key} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={16} />
                  </span>
                  {toggle.label}
                </CardTitle>
                <CardDescription>{toggle.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <Label htmlFor={toggle.key} className="text-slate-700">Enable</Label>
                <Switch
                  id={toggle.key}
                  checked={values[toggle.key]}
                  onCheckedChange={(checked) => setValues(current => ({ ...current, [toggle.key]: checked }))}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
          <Save size={15} />
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
