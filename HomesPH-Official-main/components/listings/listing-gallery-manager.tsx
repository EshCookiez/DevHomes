'use client'

import { useEffect, useState, useTransition } from 'react'
import { GripVertical, ImagePlus, Pencil, Trash2, UploadCloud } from 'lucide-react'
import { deleteListingGalleryItemAction, reorderListingGalleryAction, updateListingGalleryItemAction, uploadListingGalleryImageAction } from '@/app/dashboard/listings/actions'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { ListingGalleryInput, ListingGalleryRecord } from '@/lib/listings-types'
import type { StorageProvider } from '@/lib/storage'

const EMPTY_FORM: ListingGalleryInput = { title: '', description: '', display_order: '0' }

export default function ListingGalleryManager({ listingId, galleries, onUpdated }: { listingId: number; galleries: ListingGalleryRecord[]; onUpdated: (items: ListingGalleryRecord[]) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState(galleries)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editItem, setEditItem] = useState<ListingGalleryRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ListingGalleryRecord | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [form, setForm] = useState<ListingGalleryInput>(EMPTY_FORM)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [provider, setProvider] = useState<StorageProvider>('auto')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!uploadFile) {
      setPreviewUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(uploadFile)
    setPreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [uploadFile])

  function applyNext(next: ListingGalleryRecord[]) {
    setItems(next)
    onUpdated(next)
  }

  function handleUpload() {
    if (!uploadFile) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', uploadFile)
      formData.set('listingId', String(listingId))
      formData.set('provider', provider)
      formData.set('title', form.title)
      formData.set('description', form.description)
      const result = await uploadListingGalleryImageAction(formData)

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
      const result = await updateListingGalleryItemAction(listingId, editItem.id, form)
      toast({ title: result.success ? 'Gallery item updated' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        applyNext(items.map((item) => item.id === editItem.id ? result.data as ListingGalleryRecord : item).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)))
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
      const result = await reorderListingGalleryAction(listingId, normalized.map((item) => item.id))
      toast({ title: result.success ? 'Gallery reordered' : 'Reorder failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteListingGalleryItemAction(listingId, deleteTarget.id)
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
        <CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Gallery</CardTitle><CardDescription>Upload, edit, delete, and reorder listing images.</CardDescription></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={() => setUploadOpen(true)}><ImagePlus size={15} />Upload Image</Button></div></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead className="px-6">Image</TableHead><TableHead>Title</TableHead><TableHead>Order</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} draggable onDragStart={() => setDraggingId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(item.id)}>
                  <TableCell className="px-6"><div className="flex items-center gap-3"><GripVertical size={16} className="text-slate-400" /><img src={item.image_url} alt={item.title || 'Listing image'} className="h-14 w-14 rounded-xl border border-slate-200 object-cover" /></div></TableCell>
                  <TableCell><div><p className="font-semibold text-slate-900">{item.title || 'Untitled image'}</p><p className="text-xs text-slate-500">{item.description || 'No description.'}</p></div></TableCell>
                  <TableCell>{item.display_order ?? 0}</TableCell>
                  <TableCell className="pr-6 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setEditItem(item); setForm({ title: item.title ?? '', description: item.description ?? '', display_order: String(item.display_order ?? 0) }) }}><Pencil size={13} />Edit</Button><Button variant="outline" size="sm" className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(item)}><Trash2 size={13} />Delete</Button></div></TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? <TableRow><TableCell colSpan={4} className="px-6 py-16 text-center text-slate-400">No listing images uploaded yet.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader><DialogTitle>Upload Gallery Image</DialogTitle><DialogDescription>Add a new image for this listing.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Image File</Label><div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"><UploadCloud size={16} className="shrink-0 text-slate-400" /><input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" /></div></div>
            {previewUrl ? <img src={previewUrl} alt="Preview" className="h-48 w-full rounded-xl border border-slate-200 object-cover" /> : null}
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Storage Provider</Label><Select value={provider} onValueChange={(value) => setProvider(value as StorageProvider)}><SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto Detect</SelectItem><SelectItem value="supabase">Supabase Storage</SelectItem><SelectItem value="s3">S3 Storage</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setUploadOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleUpload} disabled={isPending || !uploadFile}>{isPending ? 'Uploading...' : 'Upload Image'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>Edit Gallery Item</DialogTitle><DialogDescription>Update image metadata and order.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div><div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label>Display Order</Label><Input value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: event.target.value }))} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setEditItem(null)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleEditSave} disabled={isPending}>Save Changes</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete gallery image?</AlertDialogTitle><AlertDialogDescription>This image will be removed from the listing gallery permanently.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}