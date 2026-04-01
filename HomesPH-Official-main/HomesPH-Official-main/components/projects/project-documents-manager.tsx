'use client'

import { useState, useTransition } from 'react'
import { FileText, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteProjectAttachmentAction, uploadProjectAttachmentAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { ProjectAttachmentRecord } from '@/lib/projects-types'
import type { StorageProvider } from '@/lib/storage'

export default function ProjectDocumentsManager({ projectId, attachments, onUpdated }: { projectId: number; attachments: ProjectAttachmentRecord[]; onUpdated: (items: ProjectAttachmentRecord[]) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState(attachments)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [provider, setProvider] = useState<StorageProvider>('auto')
  const [deleteTarget, setDeleteTarget] = useState<ProjectAttachmentRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUpload() {
    if (!file) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('projectId', String(projectId))
      formData.set('provider', provider)
      formData.set('fileName', fileName)
      formData.set('documentType', documentType)
      const result = await uploadProjectAttachmentAction(formData)
      toast({ title: result.success ? 'Document uploaded' : 'Upload failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        const next = [result.data, ...items]
        setItems(next)
        onUpdated(next)
        setOpen(false)
        setFile(null)
        setFileName('')
        setDocumentType('')
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteProjectAttachmentAction(projectId, deleteTarget.id)
      toast({ title: result.success ? 'Document deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success) {
        const next = items.filter((item) => item.id !== deleteTarget.id)
        setItems(next)
        onUpdated(next)
        setDeleteTarget(null)
      }
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Documents</CardTitle><CardDescription>Upload brochures, legal files, floor plans, and pricing documents.</CardDescription></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={() => setOpen(true)}><UploadCloud size={15} />Upload Document</Button></div></CardHeader><CardContent className="px-0"><Table><TableHeader><TableRow><TableHead className="px-6">File Name</TableHead><TableHead>Type</TableHead><TableHead>Uploaded</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((attachment) => <TableRow key={attachment.id}><TableCell className="px-6 font-semibold text-slate-900"><a href={attachment.file_url} target="_blank" rel="noreferrer" className="text-[#1428ae] hover:text-[#0f1f8a] hover:underline">{attachment.file_name}</a></TableCell><TableCell>{attachment.document_type || 'Document'}</TableCell><TableCell>{attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString() : 'Unknown'}</TableCell><TableCell className="pr-6 text-right"><Button variant="outline" size="sm" className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(attachment)}><Trash2 size={13} />Delete</Button></TableCell></TableRow>)}{items.length === 0 ? <TableRow><TableCell colSpan={4} className="px-6 py-16 text-center text-slate-400">No project documents uploaded yet.</TableCell></TableRow> : null}</TableBody></Table></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Add a new project attachment.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>File</Label><div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"><FileText size={16} className="shrink-0 text-slate-400" /><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" /></div></div><div className="space-y-2"><Label>File Name</Label><Input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="Brochure 2026" /></div><div className="space-y-2"><Label>Document Type</Label><Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Brochure, Floor Plan, Price List" /></div><div className="space-y-2"><Label>Storage Provider</Label><Input value={provider} onChange={(event) => setProvider(event.target.value as StorageProvider)} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleUpload} disabled={isPending || !file}>{isPending ? 'Uploading...' : 'Upload Document'}</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete document?</AlertDialogTitle><AlertDialogDescription>This attachment will be removed from the project documents list.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}