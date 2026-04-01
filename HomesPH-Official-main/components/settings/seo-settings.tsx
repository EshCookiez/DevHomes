'use client'

import { useMemo, useState, useTransition } from 'react'
import { Search, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { saveSettingsAction } from '@/app/dashboard/settings/actions'
import { extractSettingValue, type SiteSettingRecord } from '@/lib/settings-types'
import { useToast } from '@/hooks/use-toast'

export default function SeoSettings({ settings }: { settings: SiteSettingRecord[] }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const initialValues = useMemo(() => ({
    meta_title: String(extractSettingValue(settings.find(setting => setting.key === 'meta_title')?.value, '') ?? ''),
    meta_description: String(extractSettingValue(settings.find(setting => setting.key === 'meta_description')?.value, '') ?? ''),
    meta_keywords: String(extractSettingValue(settings.find(setting => setting.key === 'meta_keywords')?.value, '') ?? ''),
  }), [settings])

  const [form, setForm] = useState(initialValues)

  function handleSave() {
    startTransition(async () => {
      const result = await saveSettingsAction([
        { key: 'meta_title', value: form.meta_title, description: 'Default global meta title.', category: 'seo' },
        { key: 'meta_description', value: form.meta_description, description: 'Default global meta description.', category: 'seo' },
        { key: 'meta_keywords', value: form.meta_keywords, description: 'Default global keywords.', category: 'seo' },
      ])

      toast({
        title: result.success ? 'SEO settings updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Search size={16} />
            </span>
            Global SEO Settings
          </CardTitle>
          <CardDescription>Configure the default metadata applied across public pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Default Meta Title</Label>
            <Input id="meta_title" value={form.meta_title} onChange={(event) => setForm(current => ({ ...current, meta_title: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Default Meta Description</Label>
            <Textarea id="meta_description" value={form.meta_description} onChange={(event) => setForm(current => ({ ...current, meta_description: event.target.value }))} className="min-h-28" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_keywords">Default Keywords</Label>
            <Textarea id="meta_keywords" value={form.meta_keywords} onChange={(event) => setForm(current => ({ ...current, meta_keywords: event.target.value }))} className="min-h-20" placeholder="real estate, property listings, homes philippines" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Save size={15} />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white">
        <CardHeader>
          <CardTitle className="text-white">Search Preview</CardTitle>
          <CardDescription className="text-blue-100/70">How your default metadata can appear in search results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xl font-semibold text-blue-300 line-clamp-2">
              {form.meta_title || 'HomesPH | Premium Real Estate Platform'}
            </p>
            <p className="mt-1 text-sm text-emerald-400">https://homesph.com</p>
            <p className="mt-3 text-sm leading-6 text-blue-50/80 line-clamp-4">
              {form.meta_description || 'Discover real estate listings, projects, and investment opportunities across the Philippines.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100/60">Keywords</p>
            <p className="mt-2 text-sm text-white/90 break-words">
              {form.meta_keywords || 'real estate, homes philippines, property marketplace'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
