'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Save, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { uploadProjectMainImageAction, updateProjectAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { ProjectDetailBundle, ProjectGalleryRecord, ProjectAttachmentRecord, ProjectFaqRecord, ProjectInput, ProjectRecord, ProjectUnitRecord } from '@/lib/projects-types'
import type { StorageProvider } from '@/lib/storage'
import ProjectUnitsManager from './project-units-manager'
import ProjectAmenitiesManager from './project-amenities-manager'
import ProjectGalleryManager from './project-gallery-manager'
import ProjectDocumentsManager from './project-documents-manager'
import ProjectFaqManager from './project-faq-manager'

function buildForm(project: ProjectRecord): ProjectInput {
  return {
    name: project.name,
    slug: project.slug,
    developer_id: project.developer_id ? String(project.developer_id) : '',
    lts_number: project.lts_number ?? '',
    lts_issued_date: project.lts_issued_date ?? '',
    dhsud_registration_number: project.dhsud_registration_number ?? '',
    project_type: project.project_type ?? '',
    classification: project.classification ?? '',
    region: project.region ?? '',
    province: project.province ?? '',
    city_municipality: project.city_municipality ?? '',
    barangay: project.barangay ?? '',
    island_group: project.island_group ?? '',
    address_details: project.address_details ?? '',
    latitude: project.latitude?.toString() ?? '',
    longitude: project.longitude?.toString() ?? '',
    status: project.status ?? '',
    expected_completion_date: project.expected_completion_date ?? '',
    turnover_date: project.turnover_date ?? '',
    currency: project.currency ?? 'PHP',
    price_range_min: project.price_range_min?.toString() ?? '',
    price_range_max: project.price_range_max?.toString() ?? '',
    average_price: project.average_price?.toString() ?? '',
    vat_inclusive: Boolean(project.vat_inclusive ?? true),
    is_featured: Boolean(project.is_featured),
    video_tour_url: project.video_tour_url ?? '',
  }
}

export default function ProjectEditPage({ initialBundle, initialTab = 'overview' }: { initialBundle: ProjectDetailBundle; initialTab?: string }) {
  const { toast } = useToast()
  const [project, setProject] = useState(initialBundle.project)
  const [form, setForm] = useState<ProjectInput>(buildForm(initialBundle.project))
  const [units, setUnits] = useState(initialBundle.units)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState(initialBundle.selectedAmenityIds)
  const [galleries, setGalleries] = useState(initialBundle.galleries)
  const [attachments, setAttachments] = useState(initialBundle.attachments)
  const [faqs, setFaqs] = useState(initialBundle.faqs)
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [provider, setProvider] = useState<StorageProvider>('auto')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setForm(buildForm(project))
  }, [project])

  function handleSaveOverview() {
    startTransition(async () => {
      const result = await updateProjectAction(project.id, form)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }

      let nextProject = result.data

      if (mainImageFile) {
        const formData = new FormData()
        formData.set('file', mainImageFile)
        formData.set('projectId', String(project.id))
        formData.set('provider', provider)
        const upload = await uploadProjectMainImageAction(formData)
        if (!upload.success || !upload.data) {
          toast({ title: 'Main image upload failed', description: upload.message, variant: 'destructive' })
        } else {
          nextProject = upload.data
        }
      }

      setProject(nextProject)
      toast({ title: 'Project updated', description: result.message })
    })
  }

  const validTab = ['overview', 'units', 'amenities', 'gallery', 'documents', 'faqs'].includes(initialTab) ? initialTab : 'overview'

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-slate-50"><CardContent className="flex flex-wrap items-start justify-between gap-6 px-6 py-6"><div><h1 className="text-3xl font-black tracking-tight text-slate-900">{project.name}</h1><p className="mt-1 text-sm text-slate-500">Manage overview fields, unit mixes, amenities, gallery media, documents, and FAQs.</p></div><div className="flex flex-wrap gap-2"><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSaveOverview} disabled={isPending}>{isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save Overview</Button></div></CardContent></Card>

      <Tabs defaultValue={validTab} className="gap-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
          {['overview','units','amenities','gallery','documents','faqs'].map((tab) => <TabsTrigger key={tab} value={tab} className="rounded-xl px-4 py-2.5 capitalize">{tab}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-slate-200 shadow-sm"><CardContent className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
            <Field label="Project Name" value={form.name} onChange={(value) => setForm(current => ({ ...current, name: value }))} required />
            <Field label="Slug" value={form.slug} onChange={(value) => setForm(current => ({ ...current, slug: value }))} required />
            <SelectField label="Developer" value={form.developer_id} onChange={(value) => setForm(current => ({ ...current, developer_id: value }))} options={initialBundle.developers.map((developer) => ({ value: String(developer.id), label: developer.developer_name }))} placeholder="Select developer" />
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

            <div className="space-y-2 md:col-span-2"><Label>Main Image Upload</Label><div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"><UploadCloud size={16} className="shrink-0 text-slate-400" /><input type="file" accept="image/*" onChange={(event) => setMainImageFile(event.target.files?.[0] ?? null)} className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" /></div>{project.main_image_url ? <p className="text-xs text-slate-500">Current main image is set.</p> : null}</div>
            <SelectField label="Upload Provider" value={provider} onChange={(value) => setProvider(value as StorageProvider)} options={[{ value: 'auto', label: 'Auto Detect' }, { value: 'supabase', label: 'Supabase Storage' }, { value: 's3', label: 'S3 Storage' }]} placeholder="Select storage provider" />
            <Toggle label="VAT Inclusive" checked={form.vat_inclusive} onChange={(checked) => setForm(current => ({ ...current, vat_inclusive: checked }))} />
            <Toggle label="Featured" checked={form.is_featured} onChange={(checked) => setForm(current => ({ ...current, is_featured: checked }))} />
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">The supplied schema does not include a standalone project description column, so overview editing uses the available location and media fields only.</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="units"><ProjectUnitsManager projectId={project.id} units={units} onUpdated={setUnits} /></TabsContent>
        <TabsContent value="amenities"><ProjectAmenitiesManager projectId={project.id} amenities={initialBundle.amenities} selectedAmenityIds={selectedAmenityIds} onUpdated={setSelectedAmenityIds} /></TabsContent>
        <TabsContent value="gallery"><ProjectGalleryManager projectId={project.id} galleries={galleries} onUpdated={setGalleries} /></TabsContent>
        <TabsContent value="documents"><ProjectDocumentsManager projectId={project.id} attachments={attachments} onUpdated={setAttachments} /></TabsContent>
        <TabsContent value="faqs"><ProjectFaqManager projectId={project.id} faqs={faqs} onUpdated={setFaqs} /></TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; wide?: boolean }) {
  return <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}><Label>{label}{required ? ' *' : ''}</Label>{wide ? <Textarea className="min-h-24" value={value} onChange={(event) => onChange(event.target.value)} /> : <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</div>
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="font-medium text-slate-900">{label}</p></div><Switch checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /></div>
}