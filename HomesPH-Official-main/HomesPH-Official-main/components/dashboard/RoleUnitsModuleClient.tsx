'use client'

import { useState, useTransition } from 'react'
import { Building2, Home, LayoutGrid, Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { developerSaveUnitAction, developerDeleteUnitAction } from '@/app/dashboard/developer/units/actions'
import type { RoleUnitRow } from '@/lib/role-dashboard-data'
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

export interface ProjectOption {
  id: number
  name: string
}

interface Props {
  title: string
  description: string
  units: RoleUnitRow[]
  canCreate?: boolean
  projects?: ProjectOption[]
}

export default function RoleUnitsModuleClient({
  title,
  description,
  units: initialUnits,
  canCreate = false,
  projects = [],
}: Props) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [units, setUnits] = useState<RoleUnitRow[]>(initialUnits)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RoleUnitRow | null>(null)
  const [form, setForm] = useState<ProjectUnitInput>(EMPTY_UNIT)
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projects[0]?.id ?? 0)
  const [deleteTarget, setDeleteTarget] = useState<RoleUnitRow | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_UNIT)
    setSelectedProjectId(projects[0]?.id ?? 0)
    setOpen(true)
  }

  function openEdit(unit: RoleUnitRow) {
    setEditing(unit)
    setSelectedProjectId(unit.project_id)
    setForm({
      unit_name: unit.unit_name ?? '',
      unit_type: unit.unit_type ?? '',
      floor_area_sqm: unit.floor_area_sqm?.toString() ?? '',
      lot_area_sqm: unit.lot_area_sqm?.toString() ?? '',
      bedrooms: String(unit.bedrooms ?? 0),
      bathrooms: String(unit.bathrooms ?? 0),
      has_balcony: Boolean(unit.has_balcony),
      has_parking: Boolean(unit.has_parking),
      is_furnished: unit.is_furnished ?? '',
      status: unit.status ?? '',
      is_rfo: Boolean(unit.is_rfo),
      selling_price: unit.selling_price?.toString() ?? '',
      reservation_fee: unit.reservation_fee?.toString() ?? '',
    })
    setOpen(true)
  }

  function handleSave() {
    if (!selectedProjectId) {
      toast({ title: 'Project required', description: 'Please select a project.', variant: 'destructive' })
      return
    }
    startTransition(async () => {
      const result = await developerSaveUnitAction(selectedProjectId, editing?.id ?? null, form)
      toast({
        title: result.success ? (editing ? 'Unit updated' : 'Unit added') : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      if (result.success && result.data) {
        const saved = result.data as ProjectUnitRecord
        const enriched: RoleUnitRow = {
          ...saved,
          project_name: projects.find((p) => p.id === selectedProjectId)?.name ?? null,
        }
        setUnits((prev) =>
          editing ? prev.map((u) => (u.id === editing.id ? enriched : u)) : [enriched, ...prev],
        )
        setOpen(false)
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await developerDeleteUnitAction(deleteTarget.project_id, deleteTarget.id)
      toast({
        title: result.success ? 'Unit deleted' : 'Delete failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      if (result.success) {
        setUnits((prev) => prev.filter((u) => u.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    })
  }

  const textFields: { key: keyof ProjectUnitInput; label: string; placeholder?: string }[] = [
    { key: 'unit_name', label: 'Unit Name', placeholder: 'e.g. Unit 301-A' },
    { key: 'unit_type', label: 'Unit Type *', placeholder: 'e.g. 2BR Condominium' },
    { key: 'floor_area_sqm', label: 'Floor Area (sqm)', placeholder: '0' },
    { key: 'lot_area_sqm', label: 'Lot Area (sqm)', placeholder: '0' },
    { key: 'bedrooms', label: 'Bedrooms', placeholder: '0' },
    { key: 'bathrooms', label: 'Bathrooms', placeholder: '0' },
    { key: 'is_furnished', label: 'Furnished', placeholder: 'e.g. Fully, Semi, Unfurnished' },
    { key: 'status', label: 'Status', placeholder: 'e.g. Available, Reserved, Sold' },
    { key: 'selling_price', label: 'Selling Price (PHP)', placeholder: '0' },
    { key: 'reservation_fee', label: 'Reservation Fee (PHP)', placeholder: '0' },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {canCreate && (
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] shadow-sm shadow-[#1428ae]/20 px-4"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="font-bold">Add Unit</span>
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Units" value={units.length} icon={LayoutGrid} iconColor="text-blue-700" iconBg="bg-blue-50" />
        <KpiCard
          title="Projects"
          value={projects.length}
          icon={Building2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
        />
        <KpiCard
          title="Available"
          value={units.filter((u) => (u.status ?? '').toLowerCase() === 'available').length}
          icon={Home}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
        />
        <KpiCard
          title="RFO"
          value={units.filter((u) => Boolean(u.is_rfo)).length}
          icon={Wallet}
          iconColor="text-slate-700"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Table */}
      <DataTable
        title="Project Units"
        data={units.map((unit) => ({
          _raw: unit,
          unit: unit.unit_name || unit.unit_type,
          project: unit.project_name ?? 'Unassigned',
          type: unit.unit_type,
          bedrooms: unit.bedrooms ?? 0,
          price: unit.selling_price ? `PHP ${Number(unit.selling_price).toLocaleString()}` : 'Price on request',
          status: unit.status ?? 'Draft',
        }))}
        columns={[
          { key: 'unit', label: 'Unit' },
          { key: 'project', label: 'Project' },
          { key: 'type', label: 'Type' },
          { key: 'bedrooms', label: 'Beds' },
          { key: 'price', label: 'Price', sortable: false },
          { key: 'status', label: 'Status', render: (value) => <StatusBadge status={String(value)} /> },
          ...(canCreate
            ? [{
                key: '_raw' as 'status',
                label: 'Actions',
                sortable: false,
                render: (value: unknown) => {
                  const unit = value as RoleUnitRow
                  return (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg h-8 px-2" onClick={() => openEdit(unit)}>
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget(unit)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )
                },
              }]
            : []),
        ]}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            <DialogDescription>
              Fill in the unit details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Project selector */}
            <div className="space-y-2 md:col-span-2">
              <Label>Project *</Label>
              {projects.length > 0 ? (
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1428ae]"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                >
                  <option value={0} disabled>Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-bold mb-1">No projects found</p>
                  <p>You need to create a project before you can add units. Go to <strong>My Projects</strong> to get started.</p>
                </div>
              )}
            </div>

            {/* Text fields */}
            {textFields.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={form[key] as string}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}

            {/* Boolean toggles */}
            <Toggle
              label="Has Balcony"
              checked={form.has_balcony}
              onChange={(v) => setForm((prev) => ({ ...prev, has_balcony: v }))}
            />
            <Toggle
              label="Has Parking"
              checked={form.has_parking}
              onChange={(v) => setForm((prev) => ({ ...prev, has_parking: v }))}
            />
            <Toggle
              label="Ready for Occupancy (RFO)"
              checked={form.is_rfo}
              onChange={(v) => setForm((prev) => ({ ...prev, is_rfo: v }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]"
              onClick={handleSave}
              disabled={isPending || projects.length === 0}
            >
              {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete unit?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.unit_name || deleteTarget?.unit_type}</strong> will be permanently removed from{' '}
              <strong>{deleteTarget?.project_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-rose-600 hover:bg-rose-700"
              disabled={isPending}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-1">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}