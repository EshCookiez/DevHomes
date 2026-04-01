'use client'

import { useMemo, useState, useTransition } from 'react'
import { Home, Loader2 } from 'lucide-react'
import { createListingAction } from '@/app/dashboard/listings/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type {
  ListingDeveloperOptionRecord,
  ListingInput,
  ListingListRecord,
  ListingProjectOptionRecord,
  ListingUnitOptionRecord,
} from '@/lib/listings-types'

const INITIAL_FORM: ListingInput = {
  title: '',
  description: '',
  developer_id: '',
  project_id: '',
  project_unit_id: '',
  listing_type: 'sale',
  status: 'draft',
  currency: 'PHP',
  price: '',
  negotiable: false,
  is_featured: false,
}

export default function ListingCreateModal({
  developers,
  projects,
  units,
  onCreated,
}: {
  developers: ListingDeveloperOptionRecord[]
  projects: ListingProjectOptionRecord[]
  units: ListingUnitOptionRecord[]
  onCreated: (listing: ListingListRecord) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ListingInput>(INITIAL_FORM)
  const [isPending, startTransition] = useTransition()

  const filteredProjects = useMemo(() => (
    form.developer_id ? projects.filter((project) => String(project.developer_id ?? '') === form.developer_id) : projects
  ), [form.developer_id, projects])

  const filteredUnits = useMemo(() => (
    form.project_id ? units.filter((unit) => String(unit.project_id ?? '') === form.project_id) : units
  ), [form.project_id, units])

  function reset() {
    setForm(INITIAL_FORM)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createListingAction(form)
      if (!result.success || !result.data) {
        toast({ title: 'Create failed', description: result.message, variant: 'destructive' })
        return
      }

      onCreated(result.data)
      toast({ title: 'Listing created', description: result.message })
      setOpen(false)
      reset()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
        <Home size={15} />
        Create Listing
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Create Listing</DialogTitle>
            <DialogDescription>Create a new property listing linked to a developer, project, and unit.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Listing Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
            <SelectField label="Listing Type" value={form.listing_type} onChange={(value) => setForm((current) => ({ ...current, listing_type: value }))} options={[{ value: 'sale', label: 'Sale' }, { value: 'rent', label: 'Rent' }]} />
            <Field label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} wide />
            <SelectField label="Developer" value={form.developer_id} onChange={(value) => setForm((current) => ({ ...current, developer_id: value, project_id: '', project_unit_id: '' }))} options={developers.map((developer) => ({ value: String(developer.id), label: developer.developer_name }))} placeholder="Select developer" />
            <SelectField label="Project" value={form.project_id} onChange={(value) => setForm((current) => ({ ...current, project_id: value, project_unit_id: '' }))} options={filteredProjects.map((project) => ({ value: String(project.id), label: project.name }))} placeholder="Select project" />
            <SelectField label="Unit Type" value={form.project_unit_id} onChange={(value) => setForm((current) => ({ ...current, project_unit_id: value }))} options={filteredUnits.map((unit) => ({ value: String(unit.id), label: unit.unit_name || unit.unit_type }))} placeholder="Select unit" />
            <Field label="Currency" value={form.currency} onChange={(value) => setForm((current) => ({ ...current, currency: value }))} />
            <Field label="Price" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
            <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
            <Toggle label="Negotiable" checked={form.negotiable} onChange={(checked) => setForm((current) => ({ ...current, negotiable: checked }))} />
            <Toggle label="Featured" checked={form.is_featured} onChange={(checked) => setForm((current) => ({ ...current, is_featured: checked }))} />
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Home size={15} />}
              Create Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, value, onChange, required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; wide?: boolean }) {
  return (
    <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}>
      <Label>{label}{required ? ' *' : ''}</Label>
      {wide ? <Textarea className="min-h-24" value={value} onChange={(event) => onChange(event.target.value)} /> : <Input value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder = 'Select option' }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="font-medium text-slate-900">{label}</p></div><Switch checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /></div>
}