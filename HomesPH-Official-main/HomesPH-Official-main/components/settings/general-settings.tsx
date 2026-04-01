'use client'

import { useMemo, useState, useTransition } from 'react'
import { Building2, ImageIcon, Mail, Phone, Save, Type } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { saveSettingsAction } from '@/app/dashboard/settings/actions'
import { extractSettingValue, type SiteSettingRecord } from '@/lib/settings-types'
import { useToast } from '@/hooks/use-toast'

const FIELDS = [
  { key: 'site_name',        label: 'Site Name',        description: 'Displayed in the header, title tags, and admin shell.', placeholder: 'Homes Philippines', icon: Building2 },
  { key: 'site_tagline',     label: 'Tagline',          description: 'Short brand statement for hero sections and marketing.',   placeholder: 'Your home starts here', icon: Type },
  { key: 'site_logo',        label: 'Site Logo URL',    description: 'Public URL used across the website and dashboard.',       placeholder: 'https://...', icon: ImageIcon },
  { key: 'support_email',    label: 'Support Email',    description: 'Primary support address shown to customers.',             placeholder: 'support@homesph.com', icon: Mail },
  { key: 'contact_number',   label: 'Contact Number',   description: 'Displayed in public contact bars and footer sections.',  placeholder: '+63 912 345 6789', icon: Phone },
  { key: 'homepage_banner',  label: 'Homepage Banner',  description: 'Short homepage marketing banner or campaign text.',      placeholder: 'Explore premium listings across the Philippines', icon: Type },
] as const

export default function GeneralSettings({ settings }: { settings: SiteSettingRecord[] }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const initialValues = useMemo(() => Object.fromEntries(
    FIELDS.map(field => {
      const match = settings.find(setting => setting.key === field.key)
      return [field.key, String(extractSettingValue(match?.value, '') ?? '')]
    }),
  ) as Record<string, string>, [settings])

  const [form, setForm] = useState<Record<string, string>>(initialValues)

  function setField(key: string, value: string) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSettingsAction(FIELDS.map(field => ({
        key: field.key,
        value: form[field.key] ?? '',
        description: field.description,
        category: 'general',
      })))

      toast({
        title: result.success ? 'General settings updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {FIELDS.map(field => {
          const Icon = field.icon
          return (
            <Card key={field.key} className="border-slate-200 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1428ae]">
                    <Icon size={16} />
                  </span>
                  {field.label}
                </CardTitle>
                <CardDescription>{field.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={form[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(event) => setField(field.key, event.target.value)}
                  className="h-11"
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
