'use client'

import { useState, useTransition } from 'react'
import { GripVertical, ImagePlus, Pencil, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uploadProjectGalleryImageAction, updateProjectGalleryItemAction, reorderProjectGalleryAction, deleteProjectGalleryItemAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { ProjectGalleryInput, ProjectGalleryRecord } from '@/lib/projects-types'
import type { StorageProvider } from '@/lib/storage'

const EMPTY_FORM: ProjectGalleryInput = { title: '', description: '', display_order: '0' }

export default function ProjectGalleryManager({ projectId, galleries, onUpdated }: { projectId: number; galleries: ProjectGalleryRecord[]; onUpdated: (items: ProjectGalleryRecord[]) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState(galleries)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editItem, setEditItem] = useState<ProjectGalleryRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectGalleryRecord | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProjectGalleryInput>(EMPTY_FORM)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [provider, setProvider] = useState<StorageProvider>('auto')
  const [isPending, startTransition] = useTransition()

  function applyNext(next: ProjectGalleryRecord[]) { setItems(next); onUpdated(next) }

  function handleUpload() {
    if (!uploadFile) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', uploadFile)
      formData.set('projectId', String(projectId))
      formData.set('provider', provider)
      formData.set('title', form.title)
      formData.set('description', form.description)
      const result = await uploadProjectGalleryImageAction(formData)
      toast({ title: result.success ? 'Gallery image uploaded' : 'Upload failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        applyNext([...items, result.data].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)))
        setUploadOpen(false)
        setUploadFile(null)
        setForm(EMPTY_FORM)
      }
    })
  }

  function handleEditSave() {
    if (!editItem) return
    startTransition(async () => {
      const result = await updateProjectGalleryItemAction(projectId, editItem.id, form)
      toast({ title: result.success ? 'Gallery item updated' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        applyNext(items.map((item) => item.id === editItem.id ? result.data as ProjectGalleryRecord : item))
        setEditItem(null)
      }
    })
  }

  function handleDrop(targetId: number) {
    if (draggingId === null || draggingId === targetId) return
    const sourceIndex = items.findIndex((item) => item.id === draggingId)
    const targetIndex = items.findIndex((item) => item.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const next = [...items]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    const normalized = next.map((item, index) => ({ ...item, display_order: index }))
    applyNext(normalized)
    setDraggingId(null)

    startTransition(async () => {
      const result = await reorderProjectGalleryAction(projectId, normalized.map((item) => item.id))
      if (!result.success) {
        toast({ title: 'Reorder failed', description: result.message, variant: 'destructive' })
      } else {
        toast({ title: 'Gallery reordered', description: result.message })
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteProjectGalleryItemAction(projectId, deleteTarget.id)
      toast({ title: result.success ? 'Gallery image deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success) {
        applyNext(items.filter((item) => item.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Gallery</CardTitle><CardDescription>Upload project media and drag items to reorder the gallery.</CardDescription></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={() => setUploadOpen(true)}><ImagePlus size={15} />Upload Image</Button></div></CardHeader>
        <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <div key={item.id} draggable onDragStart={() => setDraggingId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(item.id)} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="relative"><img src={item.image_url} alt={item.title || 'Gallery image'} className="h-48 w-full object-cover" /><div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700"><GripVertical size={14} />Drag</div></div><div className="space-y-3 p-4"><div><p className="font-semibold text-slate-900">{item.title || 'Untitled image'}</p><p className="mt-1 text-sm text-slate-500">{item.description || 'No description.'}</p></div><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Order {item.display_order ?? 0}</span><div className="flex gap-2"><Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setEditItem(item); setForm({ title: item.title ?? '', description: item.description ?? '', display_order: String(item.display_order ?? 0) }) }}><Pencil size={13} />Edit</Button><Button variant="outline" size="sm" className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(item)}><Trash2 size={13} />Delete</Button></div></div></div></div>)}
          {items.length === 0 ? <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-400">No gallery images uploaded yet.</div> : null}
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}><DialogContent className="max-w-2xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>Upload Gallery Image</DialogTitle><DialogDescription>Add new media to the project gallery.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Image File</Label><div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"><UploadCloud size={16} className="shrink-0 text-slate-400" /><input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" /></div></div><div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))} /></div><div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label>Storage Provider</Label><Input value={provider} onChange={(event) => setProvider(event.target.value as StorageProvider)} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setUploadOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleUpload} disabled={isPending || !uploadFile}>{isPending ? 'Uploading...' : 'Upload Image'}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}><DialogContent className="max-w-2xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>Edit Gallery Item</DialogTitle><DialogDescription>Update metadata and display order for this gallery image.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))} /></div><div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label>Display Order</Label><Input value={form.display_order} onChange={(event) => setForm(current => ({ ...current, display_order: event.target.value }))} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setEditItem(null)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleEditSave} disabled={isPending}>Save Changes</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete gallery image?</AlertDialogTitle><AlertDialogDescription>This image will be removed from the project gallery permanently.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}