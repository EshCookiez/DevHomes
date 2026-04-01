'use client'

import { format } from 'date-fns'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { LeadRecord, LeadTimelineItem } from '@/lib/leads-types'

function formatDate(value: string | null) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not available' : format(parsed, 'MMM d, yyyy h:mm a')
}

export default function LeadDetailsDrawer({ open, onOpenChange, lead, timeline }: { open: boolean; onOpenChange: (open: boolean) => void; lead: LeadRecord | null; timeline: LeadTimelineItem[] }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white sm:max-w-xl">
        {lead ? (
          <>
            <SheetHeader className="border-b border-slate-100 px-6 py-5">
              <SheetTitle className="text-2xl font-black tracking-tight text-slate-900">{lead.lead_name || 'Lead details'}</SheetTitle>
              <SheetDescription>Review assignment, scoring, notes, and recent lead activity.</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard label="Project" value={lead.project_name || 'Not linked'} />
                <DetailCard label="Assigned Agent" value={lead.assigned_agent || 'Unassigned'} />
                <DetailCard label="Source" value={lead.source || 'Unknown'} />
                <DetailCard label="Lead Score" value={lead.lead_score !== null ? String(lead.lead_score) : 'Not scored'} />
              </div>

              <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-4 px-5 py-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Current Status</p><Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{lead.status.replace(/_/g, ' ')}</Badge></div><div className="text-sm text-slate-600"><p>Last Contact Date: {formatDate(lead.last_contacted_at)}</p><p className="mt-3 whitespace-pre-wrap">{lead.notes || 'No notes added yet.'}</p></div></CardContent></Card>

              <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-4 px-5 py-5"><p className="text-sm font-semibold text-slate-900">Activity Timeline</p><div className="space-y-4">{timeline.map((item) => <div key={item.id} className="relative pl-5"><span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[#1428ae]" /><p className="font-semibold text-slate-900">{item.label}</p><p className="text-sm text-slate-500">{item.description}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(item.occurred_at)}</p></div>)}</div></CardContent></Card>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-3 text-sm font-semibold text-slate-900">{value}</p></div>
}