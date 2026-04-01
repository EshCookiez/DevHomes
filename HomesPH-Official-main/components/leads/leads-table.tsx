'use client'

import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Eye, MoreHorizontal, Pencil, Search, StickyNote, Trash2, UserCog } from 'lucide-react'
import { assignLeadAgentAction, deleteLeadAction, updateLeadNoteAction, updateLeadStatusAction } from '@/app/dashboard/leads/actions'
import LeadCreateModal from '@/components/leads/lead-create-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { LeadProjectOptionRecord, LeadRecord, LeadStatus, LeadTimelineItem, LeadUserOptionRecord } from '@/lib/leads-types'
import LeadDetailsDrawer from './lead-details-drawer'

const PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

export default function LeadsTable({
  leads,
  users,
  agents,
  projects,
  timelineMap,
  onChange,
  canCreate = true,
  canEdit = true,
  canAssign = true,
  canDelete = true,
}: {
  leads: LeadRecord[]
  users: LeadUserOptionRecord[]
  agents: LeadUserOptionRecord[]
  projects: LeadProjectOptionRecord[]
  timelineMap: Map<number, LeadTimelineItem[]>
  onChange: (next: LeadRecord[]) => void
  canCreate?: boolean
  canEdit?: boolean
  canAssign?: boolean
  canDelete?: boolean
}) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewLead, setViewLead] = useState<LeadRecord | null>(null)
  const [editLead, setEditLead] = useState<LeadRecord | null>(null)
  const [assignLead, setAssignLead] = useState<LeadRecord | null>(null)
  const [noteLead, setNoteLead] = useState<LeadRecord | null>(null)
  const [deleteLead, setDeleteLead] = useState<LeadRecord | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()

  const sources = useMemo(() => [...new Set(leads.map((lead) => lead.source).filter(Boolean))] as string[], [leads])

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = Date.now()

    return leads.filter((lead) => {
      const matchesSearch = !query || (lead.lead_name || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesProject = projectFilter === 'all' || String(lead.project_id ?? '') === projectFilter
      const matchesAgent = agentFilter === 'all' || lead.assigned_to === agentFilter
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

      let matchesDate = true
      if (dateRangeFilter !== 'all' && lead.created_at) {
        const created = new Date(lead.created_at).getTime()
        const days = dateRangeFilter === '7d' ? 7 : dateRangeFilter === '30d' ? 30 : 90
        matchesDate = created >= now - days * 24 * 60 * 60 * 1000
      }

      return matchesSearch && matchesStatus && matchesProject && matchesAgent && matchesSource && matchesDate
    })
  }, [leads, search, statusFilter, projectFilter, agentFilter, sourceFilter, dateRangeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function patchLead(nextLead: LeadRecord) {
    onChange(leads.map((lead) => lead.id === nextLead.id ? nextLead : lead))
  }

  function addLead(nextLead: LeadRecord) {
    onChange([nextLead, ...leads])
  }

  function handleStatusChange(lead: LeadRecord, status: LeadStatus) {
    startTransition(async () => {
      const result = await updateLeadStatusAction(lead.id, status)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }
      patchLead(result.data)
      toast({ title: 'Lead updated', description: result.message })
    })
  }

  function handleAssign() {
    if (!assignLead) return
    startTransition(async () => {
      const result = await assignLeadAgentAction(assignLead.id, assignedTo)
      if (!result.success || !result.data) {
        toast({ title: 'Assign failed', description: result.message, variant: 'destructive' })
        return
      }
      patchLead(result.data)
      setAssignLead(null)
      toast({ title: 'Lead assigned', description: result.message })
    })
  }

  function handleNoteSave() {
    if (!noteLead) return
    startTransition(async () => {
      const result = await updateLeadNoteAction(noteLead.id, noteText)
      if (!result.success || !result.data) {
        toast({ title: 'Note update failed', description: result.message, variant: 'destructive' })
        return
      }
      patchLead(result.data)
      setNoteLead(null)
      toast({ title: 'Note saved', description: result.message })
    })
  }

  function handleDelete() {
    if (!deleteLead) return
    const previous = leads
    onChange(leads.filter((lead) => lead.id !== deleteLead.id))

    startTransition(async () => {
      const result = await deleteLeadAction(deleteLead.id)
      if (!result.success) {
        onChange(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }
      setDeleteLead(null)
      toast({ title: 'Lead deleted', description: result.message })
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-slate-900">Sales Leads</CardTitle>
            <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
              <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search leads" /></div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}><SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="proposal_sent">Proposal Sent</SelectItem><SelectItem value="negotiation">Negotiation</SelectItem><SelectItem value="closed_won">Closed Won</SelectItem><SelectItem value="closed_lost">Closed Lost</SelectItem></SelectContent></Select>
              <Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setPage(1) }}><SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}</SelectContent></Select>
              <Select value={agentFilter} onValueChange={(value) => { setAgentFilter(value); setPage(1) }}><SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All agents</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.full_name}</SelectItem>)}</SelectContent></Select>
              <Select value={sourceFilter} onValueChange={(value) => { setSourceFilter(value); setPage(1) }}><SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{sources.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent></Select>
              <Select value={dateRangeFilter} onValueChange={(value) => { setDateRangeFilter(value); setPage(1) }}><SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All dates</SelectItem><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem></SelectContent></Select>
              {canCreate ? <LeadCreateModal users={users} agents={agents} projects={projects} onSaved={addLead} /> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><tr><th className="px-6 py-4">Lead Name</th><th className="px-4 py-4">Project</th><th className="px-4 py-4">Source</th><th className="px-4 py-4">Assigned To</th><th className="px-4 py-4">Score</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Last Contact</th><th className="px-4 py-4">Created</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{paginatedLeads.length ? paginatedLeads.map((lead) => <tr key={lead.id} className="transition-colors hover:bg-slate-50"><td className="px-6 py-4 font-semibold text-slate-900">{lead.lead_name || 'Unnamed lead'}</td><td className="px-4 py-4 text-slate-600">{lead.project_name || 'Not linked'}</td><td className="px-4 py-4 text-slate-600">{lead.source || 'Unknown'}</td><td className="px-4 py-4 text-slate-600">{lead.assigned_agent || 'Unassigned'}</td><td className="px-4 py-4 text-slate-600">{lead.lead_score ?? 0}</td><td className="px-4 py-4"><Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{lead.status.replace(/_/g, ' ')}</Badge></td><td className="px-4 py-4 text-slate-600">{formatDate(lead.last_contacted_at)}</td><td className="px-4 py-4 text-slate-600">{formatDate(lead.created_at)}</td><td className="px-6 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200"><DropdownMenuItem onClick={() => setViewLead(lead)}><Eye size={15} />View Lead</DropdownMenuItem>{canEdit ? <DropdownMenuItem onClick={() => setEditLead(lead)}><Pencil size={15} />Edit Lead</DropdownMenuItem> : null}{canAssign ? <DropdownMenuItem onClick={() => { setAssignLead(lead); setAssignedTo(lead.assigned_to ?? '') }}><UserCog size={15} />Assign Agent</DropdownMenuItem> : null}{canEdit ? <DropdownMenuItem onClick={() => handleStatusChange(lead, lead.status === 'new' ? 'contacted' : lead.status === 'contacted' ? 'qualified' : lead.status === 'qualified' ? 'proposal_sent' : lead.status === 'proposal_sent' ? 'negotiation' : lead.status === 'negotiation' ? 'closed_won' : lead.status)}><Pencil size={15} />Update Status</DropdownMenuItem> : null}{canEdit ? <DropdownMenuItem onClick={() => { setNoteLead(lead); setNoteText(lead.notes ?? '') }}><StickyNote size={15} />Add Note</DropdownMenuItem> : null}{canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteLead(lead)}><Trash2 size={15} />Delete Lead</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu></td></tr>) : <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-400">No leads match the current filters.</td></tr>}</tbody></table></CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4"><p className="text-sm text-slate-500">Showing {paginatedLeads.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} leads</p><Pagination className="mx-0 w-auto justify-end"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage(Math.max(page - 1, 1)) }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => { const pageNumber = index + 1; return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem> })}<PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage(Math.min(page + 1, totalPages)) }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination></div>
      </Card>

      <LeadDetailsDrawer open={Boolean(viewLead)} onOpenChange={(open) => !open && setViewLead(null)} lead={viewLead} timeline={viewLead ? timelineMap.get(viewLead.id) ?? [] : []} />
      {editLead && canEdit ? <LeadCreateModal users={users} agents={agents} projects={projects} onSaved={(lead) => { patchLead(lead); setEditLead(null) }} initialLead={editLead} open={Boolean(editLead)} onOpenChange={(open) => !open && setEditLead(null)} hideTrigger /> : null}

      <Dialog open={Boolean(assignLead) && canAssign} onOpenChange={(open) => !open && setAssignLead(null)}><DialogContent className="max-w-md rounded-xl border-slate-200"><DialogHeader><DialogTitle>Assign Agent</DialogTitle><DialogDescription>Select the agent responsible for this lead.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Assigned Agent</Label><Select value={assignedTo} onValueChange={setAssignedTo}><SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select agent" /></SelectTrigger><SelectContent>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.full_name}</SelectItem>)}</SelectContent></Select></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setAssignLead(null)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleAssign} disabled={isPending}>Save Assignment</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(noteLead) && canEdit} onOpenChange={(open) => !open && setNoteLead(null)}><DialogContent className="max-w-2xl rounded-xl border-slate-200"><DialogHeader><DialogTitle>Add Note</DialogTitle><DialogDescription>Keep the latest context and sales notes attached to this lead.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Notes</Label><Textarea className="min-h-36" value={noteText} onChange={(event) => setNoteText(event.target.value)} /></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setNoteLead(null)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleNoteSave} disabled={isPending}>Save Note</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={Boolean(deleteLead) && canDelete} onOpenChange={(open) => !open && setDeleteLead(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete lead?</AlertDialogTitle><AlertDialogDescription>This permanently removes the lead from the CRM pipeline.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={(event) => { event.preventDefault(); handleDelete() }}>Delete Lead</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}