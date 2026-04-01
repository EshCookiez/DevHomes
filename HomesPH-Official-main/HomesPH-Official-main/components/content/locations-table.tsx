'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { MapPin, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { createLocationAction, deleteLocationAction, toggleLocationStatusAction, updateLocationAction } from '@/app/dashboard/content/actions'
import LocationModal from '@/components/content/location-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import type { LocationInput, LocationRecord } from '@/lib/content-types'

const EMPTY_FORM: LocationInput = {
  title: '',
  slug: '',
  logo_url: null,
  description: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  is_active: true,
}

const PAGE_SIZE = 8

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString()
}

export default function LocationsTable({ initialLocations }: { initialLocations: LocationRecord[] }) {
  const { toast } = useToast()
  const [locations, setLocations] = useState(initialLocations)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LocationRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocationRecord | null>(null)
  const [form, setForm] = useState<LocationInput>(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [slugDirty, setSlugDirty] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => locations
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => statusFilter === 'all' ? true : statusFilter === 'active' ? Boolean(item.is_active) : !item.is_active)
    .sort((left, right) => {
      const leftTime = new Date(left.created_at ?? 0).getTime()
      const rightTime = new Date(right.created_at ?? 0).getTime()
      return sort === 'desc' ? rightTime - leftTime : leftTime - rightTime
    }), [locations, search, statusFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  function resetForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setLogoFile(null)
    setSlugDirty(false)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(item: LocationRecord) {
    setEditing(item)
    setForm({
      title: item.title,
      slug: item.slug,
      logo_url: item.logo_url,
      description: item.description,
      meta_title: item.meta_title,
      meta_description: item.meta_description,
      meta_keywords: item.meta_keywords,
      is_active: Boolean(item.is_active),
    })
    setLogoFile(null)
    setSlugDirty(true)
    setOpen(true)
  }

  function buildFormData() {
    const formData = new FormData()
    formData.set('title', form.title)
    formData.set('slug', form.slug)
    formData.set('logo_url', form.logo_url ?? '')
    formData.set('description', form.description ?? '')
    formData.set('meta_title', form.meta_title ?? '')
    formData.set('meta_description', form.meta_description ?? '')
    formData.set('meta_keywords', form.meta_keywords ?? '')
    formData.set('is_active', String(form.is_active))
    if (logoFile) {
      formData.set('logo', logoFile)
    }
    return formData
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast({ title: 'Missing field', description: 'Location name is required.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = editing ? await updateLocationAction(editing.id, buildFormData()) : await createLocationAction(buildFormData())
      toast({ title: result.success ? editing ? 'Location updated' : 'Location created' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (!result.success || !result.data) return
      setLocations((current) => editing ? current.map((item) => item.id === editing.id ? result.data as LocationRecord : item) : [result.data as LocationRecord, ...current])
      setOpen(false)
      resetForm()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteLocationAction(deleteTarget.id)
      toast({ title: result.success ? 'Location deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (!result.success) return
      setLocations((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    })
  }

  function handleStatusToggle(item: LocationRecord, checked: boolean) {
    const previous = locations
    setLocations((current) => current.map((location) => location.id === item.id ? { ...location, is_active: checked } : location))
    startTransition(async () => {
      const result = await toggleLocationStatusAction(item.id, checked)
      if (!result.success || !result.data) {
        setLocations(previous)
        toast({ title: 'Status update failed', description: result.message, variant: 'destructive' })
        return
      }
      setLocations((current) => current.map((location) => location.id === item.id ? result.data as LocationRecord : location))
      toast({ title: 'Location updated', description: result.message })
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Locations" value={locations.length} tone="bg-blue-50 text-blue-700" />
        <MetricCard title="Active Locations" value={locations.filter((item) => item.is_active).length} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard title="Filtered Results" value={filtered.length} tone="bg-amber-50 text-amber-700" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search Locations" className="border-slate-200 pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as 'all' | 'active' | 'inactive'); setPage(1) }}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => { setSort(value as 'desc' | 'asc'); setPage(1) }}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={openCreate}><Plus size={16} />Add Location</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Logo</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-6">
                      {item.logo_url ? <img src={item.logo_url} alt={item.title} className="h-11 w-11 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400"><MapPin size={16} /></div>}
                    </TableCell>
                    <TableCell><div><p className="font-semibold text-slate-900">{item.title}</p><p className="line-clamp-1 max-w-sm text-xs text-slate-500">{item.description || 'No description provided.'}</p></div></TableCell>
                    <TableCell><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">/{item.slug}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`rounded-full ${item.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                        <Switch checked={Boolean(item.is_active)} onCheckedChange={(checked) => handleStatusToggle(item, checked)} />
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                          <DropdownMenuItem onClick={() => openEdit(item)}><Pencil size={14} />Edit Location</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(item)}><Trash2 size={14} />Delete Location</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 ? <TableRow><TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">No locations match the current filters.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.max(1, current - 1)) }} /></PaginationItem>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                const pageNumber = index + 1
                return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={page === pageNumber} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem>
              })}
              <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.min(totalPages, current + 1)) }} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>

      <LocationModal
        open={open}
        onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}
        value={form}
        editing={editing}
        logoFileName={logoFile?.name ?? null}
        isPending={isPending}
        onChange={(next) => {
          const title = next.title
          setForm({ ...next, slug: slugDirty ? next.slug : slugify(title) })
        }}
        onSlugChange={(value) => {
          setSlugDirty(true)
          setForm((current) => ({ ...current, slug: slugify(value) }))
        }}
        onLogoChange={setLogoFile}
        onSubmit={handleSubmit}
      />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete location?</AlertDialogTitle><AlertDialogDescription>This location and its public metadata will be removed from the platform.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function MetricCard({ title, value, tone }: { title: string; value: number; tone: string }) {
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 px-5 py-5"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><MapPin size={20} /></span><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div></CardContent></Card>
}