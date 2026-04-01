'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PropertyTypeInput, PropertyTypeRecord } from '@/lib/content-types'

export default function PropertyTypeModal({ open, onOpenChange, value, editing, isPending, onChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; value: PropertyTypeInput; editing: PropertyTypeRecord | null; isPending: boolean; onChange: (value: PropertyTypeInput) => void; onSubmit: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Property Type' : 'Add Property Type'}</DialogTitle>
          <DialogDescription>Manage the property categories available across the platform.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property-type-name">Property Type Name</Label>
            <Input id="property-type-name" value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} className="rounded-xl border-slate-200" placeholder="Condominium" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="property-type-description">Description</Label>
            <Textarea id="property-type-description" value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} className="min-h-28 rounded-xl border-slate-200" placeholder="Optional description for the property type." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={onSubmit} disabled={isPending}>{isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create Property Type'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}