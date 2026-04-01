'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { deleteDeveloperAddressAction, saveDeveloperAddressAction } from '@/app/dashboard/developers/actions'
import { useToast } from '@/hooks/use-toast'
import type { DeveloperAddressInput, DeveloperAddressRecord } from '@/lib/developers-types'

const EMPTY_ADDRESS: DeveloperAddressInput = {
  label: '',
  street: '',
  city: '',
  state: '',
  country: 'Philippines',
  zip_code: '',
  latitude: '',
  longitude: '',
}

export default function DeveloperAddress({
  developerId,
  addresses,
  onUpdated,
}: {
  developerId: number
  addresses: DeveloperAddressRecord[]
  onUpdated: (addresses: DeveloperAddressRecord[]) => void
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DeveloperAddressRecord | null>(null)
  const [form, setForm] = useState<DeveloperAddressInput>(EMPTY_ADDRESS)
  const [deleteTarget, setDeleteTarget] = useState<DeveloperAddressRecord | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_ADDRESS)
    setOpen(true)
  }

  function openEdit(address: DeveloperAddressRecord) {
    setEditing(address)
    setForm({
      label: address.label ?? '',
      street: address.street ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      country: address.country ?? 'Philippines',
      zip_code: address.zip_code ?? '',
      latitude: address.latitude?.toString() ?? '',
      longitude: address.longitude?.toString() ?? '',
    })
    setOpen(true)
  }

  function setField<K extends keyof DeveloperAddressInput>(key: K, value: string) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDeveloperAddressAction(developerId, editing?.id ?? null, form)
      toast({
        title: result.success ? 'Address saved' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success && result.data) {
        const next = editing
          ? addresses.map((item) => item.id === editing.id ? result.data as DeveloperAddressRecord : item)
          : [result.data as DeveloperAddressRecord, ...addresses]
        onUpdated(next)
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteDeveloperAddressAction(developerId, deleteTarget.id)
      toast({
        title: result.success ? 'Address deleted' : 'Delete failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success) {
        onUpdated(addresses.filter((item) => item.id !== deleteTarget.id))
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
              <CardTitle>Office Address</CardTitle>
              <CardDescription>Manage office locations and mapping coordinates for the developer.</CardDescription>
            </div>
            <Button onClick={openCreate} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Plus size={15} />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Label</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell className="px-6 font-semibold text-slate-900">{address.label || 'Address'}</TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-slate-700">{address.full_address || `${address.street || ''}, ${address.city || ''}`}</p>
                        <p className="text-xs text-slate-500">{address.state || 'No province'}, {address.zip_code || 'No zip'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{address.country || 'Philippines'}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(address)} className="rounded-lg">
                        <Pencil size={13} />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(address)} className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 size={13} />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center text-slate-400">No office address saved yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Address' : 'Add Address'}</DialogTitle>
            <DialogDescription>Maintain complete developer office information for internal and partner use.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ['label', 'Label'],
              ['street', 'Street'],
              ['city', 'City'],
              ['state', 'State / Province'],
              ['country', 'Country'],
              ['zip_code', 'Zip Code'],
              ['latitude', 'Latitude'],
              ['longitude', 'Longitude'],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input value={form[key as keyof DeveloperAddressInput]} onChange={(event) => setField(key as keyof DeveloperAddressInput, event.target.value)} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Address'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete address?</AlertDialogTitle>
            <AlertDialogDescription>This office address will be permanently removed.</AlertDialogDescription>
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