'use client'

import { useState, useTransition } from 'react'
import { FolderPlus, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createProjectAction, uploadProjectMainImageAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { DeveloperOptionRecord, ProjectInput, ProjectListRecord } from '@/lib/projects-types'
import type { StorageProvider } from '@/lib/storage'

const INITIAL_FORM: ProjectInput = {
  name: '',
  slug: '',
  developer_id: '',
  lts_number: '',
  lts_issued_date: '',
  dhsud_registration_number: '',
  project_type: '',
  classification: '',
  region: '',
  province: '',
  city_municipality: '',
  barangay: '',
  island_group: '',
  address_details: '',
  latitude: '',
  longitude: '',
  status: 'pre-selling',
  expected_completion_date: '',
  turnover_date: '',
  currency: 'PHP',
  price_range_min: '',
  price_range_max: '',
  average_price: '',
  vat_inclusive: true,
  is_featured: false,
  video_tour_url: '',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProjectCreateModal({
  developers,
  onCreated,
}: {
  developers: DeveloperOptionRecord[]
  onCreated: (project: ProjectListRecord) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProjectInput>(() => {
    const initial = { ...INITIAL_FORM }
    if (developers.length === 1 && !initial.developer_id) {
      initial.developer_id = String(developers[0].id)
    }
    return initial
  })
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [storageProvider, setStorageProvider] = useState<StorageProvider>('auto')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setForm(INITIAL_FORM)
    setMainImageFile(null)
    setStorageProvider('auto')
  }

  function handleSubmit() {
    startTransition(async () => {
      const created = await createProjectAction(form)

      if (!created.success || !created.data) {
        toast({ title: 'Create failed', description: created.message, variant: 'destructive' })
        return
      }

      if (mainImageFile) {
        const formData = new FormData()
        formData.set('file', mainImageFile)
        formData.set('projectId', String(created.data.id))
        formData.set('provider', storageProvider)
        const upload = await uploadProjectMainImageAction(formData)

        if (!upload.success) {
          toast({ title: 'Main image upload failed', description: upload.message, variant: 'destructive' })
        }
      }

      onCreated(created.data)
      toast({ title: 'Project created', description: created.message })
      setOpen(false)
      reset()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
        <FolderPlus size={15} />
        Create Project
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-xl border-slate-200 p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Set up a new development project with pricing, location, compliance, and media details.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <Field label="Project Name" value={form.name} onChange={(value) => setForm(current => ({ ...current, name: value, slug: current.slug ? current.slug : slugify(value) }))} required />
            <Field label="Slug" value={form.slug} onChange={(value) => setForm(current => ({ ...current, slug: slugify(value) }))} required />
            <SelectField label="Developer" value={form.developer_id} onChange={(value) => setForm(current => ({ ...current, developer_id: value }))} options={developers.map((developer) => ({ value: String(developer.id), label: developer.developer_name }))} placeholder="Select developer" />
            <Field label="Project Type" value={form.project_type} onChange={(value) => setForm(current => ({ ...current, project_type: value }))} />
            <Field label="Classification" value={form.classification} onChange={(value) => setForm(current => ({ ...current, classification: value }))} />
            <Field label="Status" value={form.status} onChange={(value) => setForm(current => ({ ...current, status: value }))} required />
            <Field label="Region" value={form.region} onChange={(value) => setForm(current => ({ ...current, region: value }))} />
            <Field label="Province" value={form.province} onChange={(value) => setForm(current => ({ ...current, province: value }))} />
            <Field label="City" value={form.city_municipality} onChange={(value) => setForm(current => ({ ...current, city_municipality: value }))} />
            <Field label="Barangay" value={form.barangay} onChange={(value) => setForm(current => ({ ...current, barangay: value }))} />
            <Field label="Island Group" value={form.island_group} onChange={(value) => setForm(current => ({ ...current, island_group: value }))} />
            <Field label="Address Details" value={form.address_details} onChange={(value) => setForm(current => ({ ...current, address_details: value }))} wide />
            <Field label="Latitude" value={form.latitude} onChange={(value) => setForm(current => ({ ...current, latitude: value }))} />
            <Field label="Longitude" value={form.longitude} onChange={(value) => setForm(current => ({ ...current, longitude: value }))} />
            <Field label="LTS Number" value={form.lts_number} onChange={(value) => setForm(current => ({ ...current, lts_number: value }))} />
            <Field label="LTS Issued Date" type="date" value={form.lts_issued_date} onChange={(value) => setForm(current => ({ ...current, lts_issued_date: value }))} />
            <Field label="DHSUD Registration Number" value={form.dhsud_registration_number} onChange={(value) => setForm(current => ({ ...current, dhsud_registration_number: value }))} />
            <Field label="Expected Completion Date" type="date" value={form.expected_completion_date} onChange={(value) => setForm(current => ({ ...current, expected_completion_date: value }))} />
            <Field label="Turnover Date" type="date" value={form.turnover_date} onChange={(value) => setForm(current => ({ ...current, turnover_date: value }))} />
            <Field label="Currency" value={form.currency} onChange={(value) => setForm(current => ({ ...current, currency: value }))} />
            <Field label="Price Range Min" value={form.price_range_min} onChange={(value) => setForm(current => ({ ...current, price_range_min: value }))} />
            <Field label="Price Range Max" value={form.price_range_max} onChange={(value) => setForm(current => ({ ...current, price_range_max: value }))} />
            <Field label="Average Price" value={form.average_price} onChange={(value) => setForm(current => ({ ...current, average_price: value }))} />
            <Field label="Video Tour URL" value={form.video_tour_url} onChange={(value) => setForm(current => ({ ...current, video_tour_url: value }))} wide />

            <div className="space-y-2 md:col-span-2">
              <Label>Main Image Upload</Label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <UploadCloud size={16} className="shrink-0 text-slate-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setMainImageFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
                />
              </div>
            </div>

            <SelectField label="Upload Provider" value={storageProvider} onChange={(value) => setStorageProvider(value as StorageProvider)} options={[{ value: 'auto', label: 'Auto Detect' }, { value: 'supabase', label: 'Supabase Storage' }, { value: 's3', label: 'S3 Storage' }]} placeholder="Select storage provider" />

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">VAT Inclusive</p>
                <p className="text-sm text-slate-500">Toggle whether listed prices already include VAT.</p>
              </div>
              <Switch checked={form.vat_inclusive} onCheckedChange={(checked) => setForm(current => ({ ...current, vat_inclusive: Boolean(checked) }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">Featured</p>
                <p className="text-sm text-slate-500">Mark this project for promotional placements.</p>
              </div>
              <Switch checked={form.is_featured} onCheckedChange={(checked) => setForm(current => ({ ...current, is_featured: Boolean(checked) }))} />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <FolderPlus size={15} />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; wide?: boolean }) {
  return (
    <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}>
      <Label>{label}{required ? ' *' : ''}</Label>
      {wide ? <Textarea className="min-h-24" value={value} onChange={(event) => onChange(event.target.value)} /> : <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}