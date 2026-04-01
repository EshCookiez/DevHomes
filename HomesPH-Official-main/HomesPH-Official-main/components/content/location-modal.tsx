'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { LocationInput, LocationRecord } from '@/lib/content-types'

export default function LocationModal({
  open,
  onOpenChange,
  value,
  editing,
  logoFileName,
  isPending,
  onChange,
  onSlugChange,
  onLogoChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: LocationInput
  editing: LocationRecord | null
  logoFileName: string | null
  isPending: boolean
  onChange: (value: LocationInput) => void
  onSlugChange: (value: string) => void
  onLogoChange: (file: File | null) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          <DialogDescription>Manage the public location page, SEO metadata, logo, and active status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location-title">Location Name</Label>
            <Input id="location-title" value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className="rounded-xl border-slate-200" placeholder="Cebu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-slug">Slug</Label>
            <Input id="location-slug" value={value.slug} onChange={(event) => onSlugChange(event.target.value)} className="rounded-xl border-slate-200" placeholder="cebu" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-logo">Logo Upload</Label>
            <Input id="location-logo" type="file" accept="image/*" className="rounded-xl border-slate-200" onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)} />
            {logoFileName ? <p className="text-xs text-slate-500">Selected file: {logoFileName}</p> : value.logo_url ? <p className="text-xs text-slate-500">Current logo: {value.logo_url}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-description">Description</Label>
            <Textarea id="location-description" value={value.description ?? ''} onChange={(event) => onChange({ ...value, description: event.target.value })} className="min-h-28 rounded-xl border-slate-200" placeholder="Describe the location and market context." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-meta-title">Meta Title</Label>
            <Input id="location-meta-title" value={value.meta_title ?? ''} onChange={(event) => onChange({ ...value, meta_title: event.target.value })} className="rounded-xl border-slate-200" placeholder="Cebu Real Estate | Houses and Condos for Sale" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-meta-description">Meta Description</Label>
            <Textarea id="location-meta-description" value={value.meta_description ?? ''} onChange={(event) => onChange({ ...value, meta_description: event.target.value })} className="min-h-24 rounded-xl border-slate-200" placeholder="SEO description used on the public location page." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location-meta-keywords">Meta Keywords</Label>
            <Input id="location-meta-keywords" value={value.meta_keywords ?? ''} onChange={(event) => onChange({ ...value, meta_keywords: event.target.value })} className="rounded-xl border-slate-200" placeholder="cebu real estate, cebu condos" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
            <div>
              <p className="font-semibold text-slate-900">Active Status</p>
              <p className="text-sm text-slate-500">Inactive locations will not appear on the public site.</p>
            </div>
            <Switch checked={value.is_active} onCheckedChange={(checked) => onChange({ ...value, is_active: checked })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={onSubmit} disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Location'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}