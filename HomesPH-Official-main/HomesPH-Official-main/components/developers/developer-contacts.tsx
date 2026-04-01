'use client'

import { useState, useTransition } from 'react'
import { Mail, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteDeveloperContactAction, saveDeveloperContactAction } from '@/app/dashboard/developers/actions'
import { useToast } from '@/hooks/use-toast'
import type { DeveloperContactInput, DeveloperContactPersonRecord } from '@/lib/developers-types'

const EMPTY_CONTACT: DeveloperContactInput = {
  fname: '',
  mname: '',
  lname: '',
  position: '',
  email: '',
  mobile_number: '',
  telephone: '',
}

export default function DeveloperContacts({
  developerId,
  contacts,
  onUpdated,
}: {
  developerId: number
  contacts: DeveloperContactPersonRecord[]
  onUpdated: (contacts: DeveloperContactPersonRecord[]) => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DeveloperContactPersonRecord | null>(null)
  const [form, setForm] = useState<DeveloperContactInput>(EMPTY_CONTACT)
  const [deleteTarget, setDeleteTarget] = useState<DeveloperContactPersonRecord | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_CONTACT)
    setOpen(true)
  }

  function openEdit(contact: DeveloperContactPersonRecord) {
    setEditing(contact)
    setForm({
      fname: contact.fname ?? '',
      mname: contact.mname ?? '',
      lname: contact.lname ?? '',
      position: contact.position ?? '',
      email: contact.email ?? '',
      mobile_number: contact.mobile_number ?? '',
      telephone: contact.telephone ?? '',
    })
    setOpen(true)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDeveloperContactAction(developerId, editing?.id ?? null, form)
      toast({
        title: result.success ? 'Contact saved' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success && result.data) {
        const next = editing
          ? contacts.map((item) => item.id === editing.id ? result.data as DeveloperContactPersonRecord : item)
          : [result.data as DeveloperContactPersonRecord, ...contacts]
        onUpdated(next)
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteDeveloperContactAction(developerId, deleteTarget.id)
      toast({
        title: result.success ? 'Contact deleted' : 'Delete failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success) {
        onUpdated(contacts.filter((item) => item.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Contact Persons</CardTitle>
              <CardDescription>Manage developer representatives and key account contacts.</CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Plus size={15} />
              Add Contact Person
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <UserRound size={16} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{contact.full_name || [contact.fname, contact.lname].filter(Boolean).join(' ')}</p>
                        <p className="text-xs text-slate-500">{contact.telephone || 'No telephone'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.position || 'Not set'}</TableCell>
                  <TableCell>{contact.email || 'Not set'}</TableCell>
                  <TableCell>{contact.mobile_number || 'Not set'}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(contact)} className="rounded-lg">
                        <Pencil size={13} />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(contact)} className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 size={13} />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-16 text-center text-slate-400">No contact persons added yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Contact Person' : 'Add Contact Person'}</DialogTitle>
            <DialogDescription>Keep the developer team roster current for partnership and sales coordination.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="First Name" value={form.fname} onChange={(value) => setForm(current => ({ ...current, fname: value }))} />
            <Field label="Last Name" value={form.lname} onChange={(value) => setForm(current => ({ ...current, lname: value }))} />
            <Field label="Middle Name" value={form.mname} onChange={(value) => setForm(current => ({ ...current, mname: value }))} />
            <Field label="Position" value={form.position} onChange={(value) => setForm(current => ({ ...current, position: value }))} />
            <Field label="Email" value={form.email} onChange={(value) => setForm(current => ({ ...current, email: value }))} />
            <Field label="Mobile Number" value={form.mobile_number} onChange={(value) => setForm(current => ({ ...current, mobile_number: value }))} />
            <Field label="Telephone" value={form.telephone} onChange={(value) => setForm(current => ({ ...current, telephone: value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Contact'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact person?</AlertDialogTitle>
            <AlertDialogDescription>This representative will be removed from the developer profile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}