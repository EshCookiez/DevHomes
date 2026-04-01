'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteProjectUnitAction, saveProjectUnitAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { ProjectUnitInput, ProjectUnitRecord } from '@/lib/projects-types'

const EMPTY_UNIT: ProjectUnitInput = {
  unit_name: '',
  unit_type: '',
  floor_area_sqm: '',
  lot_area_sqm: '',
  bedrooms: '0',
  bathrooms: '0',
  has_balcony: false,
  has_parking: false,
  is_furnished: '',
  status: '',
  is_rfo: false,
  selling_price: '',
  reservation_fee: '',
}

export default function ProjectUnitsManager({ projectId, units, onUpdated }: { projectId: number; units: ProjectUnitRecord[]; onUpdated: (units: ProjectUnitRecord[]) => void }) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectUnitRecord | null>(null)
  const [form, setForm] = useState<ProjectUnitInput>(EMPTY_UNIT)
  const [deleteTarget, setDeleteTarget] = useState<ProjectUnitRecord | null>(null)

  function openCreate() { setEditing(null); setForm(EMPTY_UNIT); setOpen(true) }
  function openEdit(unit: ProjectUnitRecord) {
    setEditing(unit)
    setForm({
      unit_name: unit.unit_name ?? '', unit_type: unit.unit_type ?? '', floor_area_sqm: unit.floor_area_sqm?.toString() ?? '', lot_area_sqm: unit.lot_area_sqm?.toString() ?? '', bedrooms: String(unit.bedrooms ?? 0), bathrooms: String(unit.bathrooms ?? 0), has_balcony: Boolean(unit.has_balcony), has_parking: Boolean(unit.has_parking), is_furnished: unit.is_furnished ?? '', status: unit.status ?? '', is_rfo: Boolean(unit.is_rfo), selling_price: unit.selling_price?.toString() ?? '', reservation_fee: unit.reservation_fee?.toString() ?? ''
    })
    setOpen(true)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveProjectUnitAction(projectId, editing?.id ?? null, form)
      toast({ title: result.success ? 'Unit saved' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        const next = editing ? units.map((item) => item.id === editing.id ? result.data as ProjectUnitRecord : item) : [result.data as ProjectUnitRecord, ...units]
        onUpdated(next)
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteProjectUnitAction(projectId, deleteTarget.id)
      toast({ title: result.success ? 'Unit deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success) {
        onUpdated(units.filter((item) => item.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><CardTitle>Units</CardTitle><CardDescription>Configure unit inventory, pricing, and readiness for this project.</CardDescription></div>
            <Button onClick={openCreate} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]"><Plus size={15} />Add Unit</Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead className="px-6">Unit Name</TableHead><TableHead>Type</TableHead><TableHead>Bedrooms</TableHead><TableHead>Bathrooms</TableHead><TableHead>Area</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {units.map((unit) => <TableRow key={unit.id}><TableCell className="px-6 font-semibold text-slate-900">{unit.unit_name || 'Unit'}</TableCell><TableCell>{unit.unit_type}</TableCell><TableCell>{unit.bedrooms ?? 0}</TableCell><TableCell>{unit.bathrooms ?? 0}</TableCell><TableCell>{unit.floor_area_sqm ?? unit.lot_area_sqm ?? 'N/A'}</TableCell><TableCell>{unit.selling_price ? `PHP ${Number(unit.selling_price).toLocaleString()}` : 'N/A'}</TableCell><TableCell>{unit.status || 'N/A'}</TableCell><TableCell className="pr-6 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className="rounded-lg" onClick={() => openEdit(unit)}><Pencil size={13} />Edit</Button><Button variant="outline" size="sm" className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleteTarget(unit)}><Trash2 size={13} />Delete</Button></div></TableCell></TableRow>)}
              {units.length === 0 ? <TableRow><TableCell colSpan={8} className="px-6 py-16 text-center text-slate-400">No units configured yet.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>{editing ? 'Edit Unit' : 'Add Unit'}</DialogTitle><DialogDescription>Manage unit configuration, pricing, and availability.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {['unit_name','unit_type','floor_area_sqm','lot_area_sqm','bedrooms','bathrooms','is_furnished','status','selling_price','reservation_fee'].map((key) => <div key={key} className="space-y-2"><Label>{key.replace(/_/g, ' ')}</Label><Input value={form[key as keyof ProjectUnitInput] as string} onChange={(event) => setForm(current => ({ ...current, [key]: event.target.value }))} /></div>)}
            <Toggle label="Balcony" checked={form.has_balcony} onChange={(checked) => setForm(current => ({ ...current, has_balcony: checked }))} />
            <Toggle label="Parking" checked={form.has_parking} onChange={(checked) => setForm(current => ({ ...current, has_parking: checked }))} />
            <Toggle label="RFO Status" checked={form.is_rfo} onChange={(checked) => setForm(current => ({ ...current, is_rfo: checked }))} />
          </div>
          <DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Unit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete unit?</AlertDialogTitle><AlertDialogDescription>This unit record will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><div><p className="font-medium text-slate-900">{label}</p></div><Switch checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} /></div>
}