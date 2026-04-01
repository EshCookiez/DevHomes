'use client'

import { useMemo, useState, useTransition } from 'react'
import { ImagePlus, MoreHorizontal, Pencil, Plus, Power, Trash2, UploadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { SiteLocationInput, SiteLocationRecord } from '@/lib/settings-types'
import {
  createLocationAction,
  deleteLocationAction,
  toggleLocationStatusAction,
  uploadLocationLogoAction,
  updateLocationAction,
} from '@/app/dashboard/settings/actions'
import { useToast } from '@/hooks/use-toast'

const EMPTY_FORM: SiteLocationInput = {
  title: '',
  slug: '',
  logo_url: null,
  description: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  is_active: true,
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function LocationsManager({ locations: initialLocations }: { locations: SiteLocationRecord[] }) {
  const { toast } = useToast()
  const [locations, setLocations] = useState(initialLocations)
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SiteLocationRecord | null>(null)
  const [editing, setEditing] = useState<SiteLocationRecord | null>(null)
  const [form, setForm] = useState<SiteLocationInput>(EMPTY_FORM)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => Number(b.id) - Number(a.id)),
    [locations],
  )

  function resetForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setLogoFile(null)
    setSlugManuallyEdited(false)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(location: SiteLocationRecord) {
    setEditing(location)
    setForm({
      title: location.title,
      slug: location.slug,
      logo_url: location.logo_url,
      description: location.description,
      meta_title: location.meta_title,
      meta_description: location.meta_description,
      meta_keywords: location.meta_keywords,
      is_active: Boolean(location.is_active),
    })
    setLogoFile(null)
    setSlugManuallyEdited(true)
    setOpen(true)
  }

  async function uploadLogo(file: File, slug: string) {
    const formData = new FormData()
    formData.set('file', file)
    formData.set('slug', slug)

    const result = await uploadLocationLogoAction(formData)

    if (!result.success || !result.data) {
      throw new Error(result.message)
    }

    return result.data.logoUrl
  }

  function handleSubmit() {
    const trimmedTitle = form.title.trim()
    const trimmedSlug = form.slug.trim()

    if (!trimmedTitle || !trimmedSlug) {
      toast({ title: 'Missing fields', description: 'Title and slug are required.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      try {
        let logoUrl = form.logo_url
        if (logoFile) {
          logoUrl = await uploadLogo(logoFile, trimmedSlug)
        }

        const payload: SiteLocationInput = {
          ...form,
          title: trimmedTitle,
          slug: trimmedSlug,
          logo_url: logoUrl,
        }

        const result = editing
          ? await updateLocationAction(editing.id, payload)
          : await createLocationAction(payload)

        if (!result.success || !result.data) {
          toast({ title: editing ? 'Update failed' : 'Create failed', description: result.message, variant: 'destructive' })
          return
        }

        setLocations(current => editing
          ? current.map(location => location.id === editing.id ? result.data as SiteLocationRecord : location)
          : [result.data as SiteLocationRecord, ...current],
        )
        setOpen(false)
        resetForm()
        toast({ title: editing ? 'Location updated' : 'Location created', description: result.message })
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Unable to upload logo.',
          variant: 'destructive',
        })
      }
    })
  }

  function toggleStatus(location: SiteLocationRecord) {
    const previous = locations
    const optimistic = previous.map(item => item.id === location.id ? { ...item, is_active: !item.is_active } : item)
    setLocations(optimistic)

    startTransition(async () => {
      const result = await toggleLocationStatusAction(location.id, {
        title: location.title,
        slug: location.slug,
        logo_url: location.logo_url,
        description: location.description,
        meta_title: location.meta_title,
        meta_description: location.meta_description,
        meta_keywords: location.meta_keywords,
        is_active: !location.is_active,
      })

      if (!result.success || !result.data) {
        setLocations(previous)
        toast({ title: 'Status update failed', description: result.message, variant: 'destructive' })
        return
      }

      setLocations(current => current.map(item => item.id === location.id ? result.data as SiteLocationRecord : item))
      toast({ title: 'Location updated', description: result.message })
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return

    const previous = locations
    setLocations(current => current.filter(location => location.id !== deleteTarget.id))

    startTransition(async () => {
      const result = await deleteLocationAction(deleteTarget.id)
      if (!result.success) {
        setLocations(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Location deleted', description: result.message })
      setDeleteTarget(null)
    })
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-slate-900">Locations Management</CardTitle>
              <CardDescription>Manage active markets, metadata, and branding for each location page.</CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Plus size={15} />
              Create Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Logo</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLocations.map(location => (
                <TableRow key={location.id}>
                  <TableCell className="px-6">
                    {location.logo_url ? (
                      <img src={location.logo_url} alt={location.title} className="h-10 w-10 rounded-xl border border-slate-200 object-cover bg-white" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        <ImagePlus size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{location.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{location.description || 'No description yet.'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">/{location.slug}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('rounded-full border px-2.5 py-0.5', location.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-lg">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(location)}>
                          <Pencil size={14} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(location)}>
                          <Power size={14} />
                          {location.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(location)}>
                          <Trash2 size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {sortedLocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                    No locations configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetForm()
      }}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{editing ? 'Edit Location' : 'Create Location'}</DialogTitle>
            <DialogDescription>
              Configure SEO, branding, and visibility for this location page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => {
                  const title = event.target.value
                  setForm(current => ({ ...current, title, slug: slugManuallyEdited ? current.slug : slugify(title) }))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugManuallyEdited(true)
                  setForm(current => ({ ...current, slug: slugify(event.target.value) }))
                }}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="logo">Logo Upload</Label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <UploadCloud size={16} className="text-slate-400 shrink-0" />
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
                />
              </div>
              {form.logo_url && !logoFile && (
                <p className="text-xs text-slate-500">Current logo: {form.logo_url}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" className="min-h-24" value={form.description ?? ''} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" value={form.meta_title ?? ''} onChange={(event) => setForm(current => ({ ...current, meta_title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input id="meta_keywords" value={form.meta_keywords ?? ''} onChange={(event) => setForm(current => ({ ...current, meta_keywords: event.target.value }))} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" className="min-h-24" value={form.meta_description ?? ''} onChange={(event) => setForm(current => ({ ...current, meta_description: event.target.value }))} />
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">Active</p>
                <p className="text-sm text-slate-500">Inactive locations will be hidden from the public site.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm(current => ({ ...current, is_active: checked }))} />
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(openState) => !openState && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `This will permanently remove ${deleteTarget.title} and its metadata from the dashboard.` : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
