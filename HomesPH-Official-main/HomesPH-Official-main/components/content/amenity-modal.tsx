'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AmenityInput, AmenityRecord } from '@/lib/content-types'

export default function AmenityModal({
  open,
  onOpenChange,
  value,
  editing,
  isPending,
  onChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: AmenityInput
  editing: AmenityRecord | null
  isPending: boolean
  onChange: (value: AmenityInput) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
          <DialogDescription>Define the amenity label and supporting description used across properties.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amenity-name">Amenity Name</Label>
            <Input id="amenity-name" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} className="rounded-xl border-slate-200" placeholder="Swimming Pool" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenity-description">Description</Label>
            <Textarea id="amenity-description" value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} className="min-h-28 rounded-xl border-slate-200" placeholder="Optional description for internal reference." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={onSubmit} disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Amenity'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}