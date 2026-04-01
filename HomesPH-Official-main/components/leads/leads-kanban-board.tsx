'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LeadRecord, LeadStatus } from '@/lib/leads-types'

const COLUMNS: Array<{ status: LeadStatus; label: string }> = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'qualified', label: 'Qualified' },
  { status: 'proposal_sent', label: 'Proposal Sent' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'closed_won', label: 'Closed Won' },
  { status: 'closed_lost', label: 'Closed Lost' },
]

export default function LeadsKanbanBoard({ leads, onStatusChange, canDrag = true }: { leads: LeadRecord[]; onStatusChange: (lead: LeadRecord, status: LeadStatus) => void; canDrag?: boolean }) {
  const [draggingId, setDraggingId] = useState<number | null>(null)

  return (
    <div className="grid gap-4 xl:grid-cols-7">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status)
        return (
          <Card key={column.status} className="border-slate-200 shadow-sm" onDragOver={(event) => { if (canDrag) event.preventDefault() }} onDrop={() => {
            if (!canDrag) return
            const lead = leads.find((entry) => entry.id === draggingId)
            if (lead && lead.status !== column.status) {
              onStatusChange(lead, column.status)
            }
            setDraggingId(null)
          }}>
            <CardHeader className="border-b border-slate-100 px-4 py-4"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold text-slate-900">{column.label}</CardTitle><Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">{columnLeads.length}</Badge></div></CardHeader>
            <CardContent className="space-y-3 px-4 py-4">{columnLeads.length ? columnLeads.map((lead) => <div key={lead.id} draggable={canDrag} onDragStart={() => { if (canDrag) setDraggingId(lead.id) }} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="font-semibold text-slate-900">{lead.lead_name || 'Unnamed lead'}</p><p className="mt-1 text-sm text-slate-500">{lead.project_name || 'No project linked'}</p><div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-slate-400"><span>{lead.source || 'Unknown source'}</span><span>{lead.lead_score ?? 0}</span></div></div>) : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">{canDrag ? 'Drop leads here' : 'No leads in this stage'}</div>}</CardContent>
          </Card>
        )
      })}
    </div>
  )
}