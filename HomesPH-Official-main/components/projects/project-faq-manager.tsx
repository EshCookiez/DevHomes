'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { deleteProjectFaqAction, saveProjectFaqAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { ProjectFaqInput, ProjectFaqRecord } from '@/lib/projects-types'

const EMPTY_FAQ: ProjectFaqInput = { question: '', answer: '', category: '', display_order: '0', is_published: true }

export default function ProjectFaqManager({ projectId, faqs, onUpdated }: { projectId: number; faqs: ProjectFaqRecord[]; onUpdated: (items: ProjectFaqRecord[]) => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState(faqs)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectFaqRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectFaqRecord | null>(null)
  const [form, setForm] = useState<ProjectFaqInput>(EMPTY_FAQ)
  const [isPending, startTransition] = useTransition()

  function openCreate() { setEditing(null); setForm(EMPTY_FAQ); setOpen(true) }
  function openEdit(faq: ProjectFaqRecord) { setEditing(faq); setForm({ question: faq.question, answer: faq.answer, category: faq.category ?? '', display_order: String(faq.display_order ?? 0), is_published: Boolean(faq.is_published) }); setOpen(true) }

  function handleSave() {
    startTransition(async () => {
      const result = await saveProjectFaqAction(projectId, editing?.id ?? null, form)
      toast({ title: result.success ? 'FAQ saved' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        const next = editing ? items.map((item) => item.id === editing.id ? result.data as ProjectFaqRecord : item) : [...items, result.data as ProjectFaqRecord]
        setItems(next)
        onUpdated(next)
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteProjectFaqAction(projectId, deleteTarget.id)
      toast({ title: result.success ? 'FAQ deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
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
      <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>FAQs</CardTitle><CardDescription>Manage project-specific questions and answers for sales support.</CardDescription></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={openCreate}><Plus size={15} />Add FAQ</Button></div></CardHeader><CardContent className="px-0"><Table><TableHeader><TableRow><TableHead className="px-6">Question</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((faq) => <TableRow key={faq.id}><TableCell className="px-6 font-semibold text-slate-900">{faq.question}</TableCell><TableCell>{faq.category || 'General'}</TableCell><TableCell>{faq.is_published ? 'Published' : 'Draft'}</TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="rounded-lg" onClick={() => openEdit(faq)}><Pencil size={13} />Edit</Button><Button variant="outline" size="sm" className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(faq)}><Trash2 size={13} />Delete</Button></div></TableCell></TableRow>)}{items.length === 0 ? <TableRow><TableCell colSpan={4} className="px-6 py-16 text-center text-slate-400">No FAQs added yet.</TableCell></TableRow> : null}</TableBody></Table></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-3xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle><DialogDescription>Create or update a project FAQ item.</DialogDescription></DialogHeader><div className="grid grid-cols-1 gap-4"><div className="space-y-2"><Label>Question</Label><Input value={form.question} onChange={(event) => setForm(current => ({ ...current, question: event.target.value }))} /></div><div className="space-y-2"><Label>Answer</Label><Textarea className="min-h-28" value={form.answer} onChange={(event) => setForm(current => ({ ...current, answer: event.target.value }))} /></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(event) => setForm(current => ({ ...current, category: event.target.value }))} /></div><div className="space-y-2"><Label>Display Order</Label><Input value={form.display_order} onChange={(event) => setForm(current => ({ ...current, display_order: event.target.value }))} /></div></div><div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="font-medium text-slate-900">Published</p><p className="text-sm text-slate-500">Control whether the FAQ is ready for external use.</p></div><Switch checked={form.is_published} onCheckedChange={(checked) => setForm(current => ({ ...current, is_published: Boolean(checked) }))} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add FAQ'}</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete FAQ?</AlertDialogTitle><AlertDialogDescription>This FAQ entry will be removed permanently.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}