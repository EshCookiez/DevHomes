'use client'

import { useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { updateProjectAmenitiesAction } from '@/app/dashboard/projects/actions'
import { useToast } from '@/hooks/use-toast'
import type { AmenityRecord } from '@/lib/projects-types'

export default function ProjectAmenitiesManager({ projectId, amenities, selectedAmenityIds, onUpdated }: { projectId: number; amenities: AmenityRecord[]; selectedAmenityIds: number[]; onUpdated: (amenityIds: number[]) => void }) {
  const { toast } = useToast()
  const [selected, setSelected] = useState<number[]>(selectedAmenityIds)
  const [isPending, startTransition] = useTransition()

  function toggleAmenity(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProjectAmenitiesAction(projectId, selected)
      toast({ title: result.success ? 'Amenities updated' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (result.success && result.data) {
        onUpdated(result.data)
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle>Amenities</CardTitle><CardDescription>Select the amenities associated with this project.</CardDescription></div><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSave} disabled={isPending}><Save size={15} />Save Amenities</Button></div></CardHeader>
      <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
        {amenities.map((amenity) => <label key={amenity.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Checkbox checked={selected.includes(amenity.id)} onCheckedChange={() => toggleAmenity(amenity.id)} /><div><p className="font-semibold text-slate-900">{amenity.name}</p><p className="mt-1 text-sm text-slate-500">{amenity.description || 'No description available.'}</p></div></label>)}
      </CardContent>
    </Card>
  )
}