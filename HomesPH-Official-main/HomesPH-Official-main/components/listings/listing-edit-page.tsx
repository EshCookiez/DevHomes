'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import { updateListingAction } from '@/app/dashboard/listings/actions'
import ListingAnalyticsPanel from '@/components/listings/listing-analytics-panel'
import ListingDetailsPanel from '@/components/listings/listing-details-panel'
import ListingGalleryManager from '@/components/listings/listing-gallery-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { ListingDetailBundle, ListingInput, ListingProjectOptionRecord, ListingRecord, ListingUnitOptionRecord } from '@/lib/listings-types'

function buildForm(listing: ListingRecord): ListingInput {
  return {
    title: listing.title,
    description: listing.description ?? '',
    developer_id: listing.developer_id ? String(listing.developer_id) : '',
    project_id: listing.project_id ? String(listing.project_id) : '',
    project_unit_id: listing.project_unit_id ? String(listing.project_unit_id) : '',
    listing_type: listing.listing_type ?? 'sale',
    status: listing.status ?? 'draft',
    currency: listing.currency ?? 'PHP',
    price: listing.price?.toString() ?? '',
    negotiable: Boolean(listing.negotiable),
    is_featured: Boolean(listing.is_featured),
  }
}

export default function ListingEditPage({ initialBundle, initialTab = 'overview' }: { initialBundle: ListingDetailBundle; initialTab?: string }) {
  const { toast } = useToast()
  const [listing, setListing] = useState(initialBundle.listing)
  const [form, setForm] = useState<ListingInput>(buildForm(initialBundle.listing))
  const [galleries, setGalleries] = useState(initialBundle.galleries)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setForm(buildForm(listing))
  }, [listing])

  const filteredProjects = useMemo(() => (
    form.developer_id ? initialBundle.projects.filter((project) => String(project.developer_id ?? '') === form.developer_id) : initialBundle.projects
  ), [form.developer_id, initialBundle.projects])

  const filteredUnits = useMemo(() => (
    form.project_id ? initialBundle.units.filter((unit) => String(unit.project_id ?? '') === form.project_id) : initialBundle.units
  ), [form.project_id, initialBundle.units])

  const currentDetails = useMemo(() => {
    const selectedDeveloper = initialBundle.developers.find((developer) => String(developer.id) === form.developer_id) ?? null
    const selectedProject = initialBundle.projects.find((project) => String(project.id) === form.project_id) ?? null
    const selectedUnit = initialBundle.units.find((unit) => String(unit.id) === form.project_unit_id) ?? null

    return {
      developer_name: selectedDeveloper?.developer_name ?? listing.developer_name,
      project_name: selectedProject?.name ?? listing.project_name,
      unit_name: selectedUnit?.unit_name ?? listing.unit_name,
      unit_type: selectedUnit?.unit_type ?? listing.unit_type,
      bedrooms: selectedUnit?.bedrooms ?? initialBundle.details.bedrooms,
      bathrooms: selectedUnit?.bathrooms ?? initialBundle.details.bathrooms,
      floor_area_sqm: selectedUnit?.floor_area_sqm ?? initialBundle.details.floor_area_sqm,
      lot_area_sqm: selectedUnit?.lot_area_sqm ?? initialBundle.details.lot_area_sqm,
      has_parking: selectedUnit?.has_parking ?? initialBundle.details.has_parking,
      has_balcony: selectedUnit?.has_balcony ?? initialBundle.details.has_balcony,
      is_furnished: selectedUnit?.is_furnished ?? initialBundle.details.is_furnished,
    }
  }, [form.developer_id, form.project_id, form.project_unit_id, initialBundle, listing])

  function handleSave() {
    startTransition(async () => {
      const result = await updateListingAction(listing.id, form)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }

      setListing(result.data)
      toast({ title: 'Listing updated', description: result.message })
    })
  }

  const validTab = ['overview', 'gallery', 'details', 'analytics'].includes(initialTab) ? initialTab : 'overview'

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <Card className="border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm"><CardContent className="flex flex-wrap items-start justify-between gap-6 px-6 py-6"><div><h1 className="text-3xl font-black tracking-tight text-slate-900">{listing.title}</h1><p className="mt-1 text-sm text-slate-500">Manage overview data, gallery media, related unit details, and listing performance.</p></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSave} disabled={isPending}>{isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save Overview</Button></CardContent></Card>

      <Tabs defaultValue={validTab} className="gap-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
          {['overview', 'gallery', 'details', 'analytics'].map((tab) => <TabsTrigger key={tab} value={tab} className="rounded-xl px-4 py-2.5 capitalize">{tab}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-slate-200 shadow-sm"><CardContent className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
            <Field label="Listing Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
            <SelectField label="Listing Type" value={form.listing_type} onChange={(value) => setForm((current) => ({ ...current, listing_type: value }))} options={[{ value: 'sale', label: 'Sale' }, { value: 'rent', label: 'Rent' }]} />
            <Field label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} wide />
            <SelectField label="Developer" value={form.developer_id} onChange={(value) => setForm((current) => ({ ...current, developer_id: value, project_id: '', project_unit_id: '' }))} options={initialBundle.developers.map((developer) => ({ value: String(developer.id), label: developer.developer_name }))} placeholder="Select developer" />
            <SelectField label="Project" value={form.project_id} onChange={(value) => setForm((current) => ({ ...current, project_id: value, project_unit_id: '' }))} options={filteredProjects.map((project: ListingProjectOptionRecord) => ({ value: String(project.id), label: project.name }))} placeholder="Select project" />
            <SelectField label="Unit" value={form.project_unit_id} onChange={(value) => setForm((current) => ({ ...current, project_unit_id: value }))} options={filteredUnits.map((unit: ListingUnitOptionRecord) => ({ value: String(unit.id), label: unit.unit_name || unit.unit_type }))} placeholder="Select unit" />
            <Field label="Currency" value={form.currency} onChange={(value) => setForm((current) => ({ ...current, currency: value }))} />
            <Field label="Price" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />
            <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }]} />
            <Toggle label="Negotiable" checked={form.negotiable} onChange={(checked) => setForm((current) => ({ ...current, negotiable: checked }))} />
            <Toggle label="Featured" checked={form.is_featured} onChange={(checked) => setForm((current) => ({ ...current, is_featured: checked }))} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="gallery"><ListingGalleryManager listingId={listing.id} galleries={galleries} onUpdated={setGalleries} /></TabsContent>
        <TabsContent value="details"><ListingDetailsPanel details={currentDetails} /></TabsContent>
        <TabsContent value="analytics"><ListingAnalyticsPanel listing={listing} analyticsSeries={initialBundle.analyticsSeries} /></TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value, onChange, required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; wide?: boolean }) {
  return <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}><Label>{label}{required ? ' *' : ''}</Label>{wide ? <Textarea className="min-h-24" value={value} onChange={(event) => onChange(event.target.value)} /> : <Input value={value} onChange={(event) => onChange(event.target.value)} />}</div>
}

function SelectField({ label, value, onChange, options, placeholder = 'Select option' }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="font-medium text-slate-900">{label}</p></div><Switch checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /></div>
}