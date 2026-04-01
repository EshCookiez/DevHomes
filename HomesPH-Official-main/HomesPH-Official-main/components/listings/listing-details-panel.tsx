'use client'

import { Bath, BedDouble, Building2, Home, LayoutGrid, MapPinned, Sofa, Square, Warehouse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ListingDetailsRecord } from '@/lib/listings-types'

export default function ListingDetailsPanel({ details }: { details: ListingDetailsRecord }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100"><CardTitle>Listing Details</CardTitle></CardHeader>
      <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem icon={Building2} label="Developer Name" value={details.developer_name || 'Not linked'} />
        <DetailItem icon={MapPinned} label="Project Name" value={details.project_name || 'Not linked'} />
        <DetailItem icon={Home} label="Unit Type" value={details.unit_name || details.unit_type || 'Not linked'} />
        <DetailItem icon={BedDouble} label="Bedrooms" value={details.bedrooms !== null ? String(details.bedrooms) : 'N/A'} />
        <DetailItem icon={Bath} label="Bathrooms" value={details.bathrooms !== null ? String(details.bathrooms) : 'N/A'} />
        <DetailItem icon={Square} label="Floor Area" value={details.floor_area_sqm !== null ? `${details.floor_area_sqm} sqm` : 'N/A'} />
        <DetailItem icon={LayoutGrid} label="Lot Area" value={details.lot_area_sqm !== null ? `${details.lot_area_sqm} sqm` : 'N/A'} />
        <DetailItem icon={Warehouse} label="Parking" value={details.has_parking ? 'Available' : 'No'} />
        <DetailItem icon={Home} label="Balcony" value={details.has_balcony ? 'Available' : 'No'} />
        <DetailItem icon={Sofa} label="Furnishing Status" value={details.is_furnished || 'N/A'} />
      </CardContent>
    </Card>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><Icon size={14} />{label}</div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}