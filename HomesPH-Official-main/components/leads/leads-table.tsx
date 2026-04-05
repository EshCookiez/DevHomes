'use client'

import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ArrowLeftCircle, Eye, MoreHorizontal, Pencil, Search, StickyNote, Trash2, UserCog } from 'lucide-react'
import { assignLeadAgentAction, deleteLeadAction, returnLeadToQueueAction, updateLeadNoteAction, updateLeadStatusAction } from '@/app/dashboard/leads/actions'
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

type QueueFilter = 'all' | 'main_queue' | 'suboffice_queue' | 'assigned' | 'returned'

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

function getQueueLabel(lead: LeadRecord) {
  if (lead.last_returned_at && lead.queue_level !== 'agent') {
    return 'Returned'
  }

  if (lead.queue_level === 'main_queue') return 'Main Queue'
  if (lead.queue_level === 'suboffice_queue') return 'Suboffice Queue'
  return 'Assigned'
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
  canReturn = true,
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
  canReturn?: boolean
}) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewLead, setViewLead] = useState<LeadRecord | null>(null)
  const [editLead, setEditLead] = useState<LeadRecord | null>(null)
  const [assignLead, setAssignLead] = useState<LeadRecord | null>(null)
  const [noteLead, setNoteLead] = useState<LeadRecord | null>(null)
  const [returnLead, setReturnLead] = useState<LeadRecord | null>(null)
  const [deleteLead, setDeleteLead] = useState<LeadRecord | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()

  const queueCounts = useMemo(() => ({
    main_queue: leads.filter((lead) => lead.queue_level === 'main_queue' && !lead.last_returned_at).length,
    suboffice_queue: leads.filter((lead) => lead.queue_level === 'suboffice_queue' && !lead.last_returned_at).length,
    assigned: leads.filter((lead) => lead.queue_level === 'agent').length,
    returned: leads.filter((lead) => Boolean(lead.last_returned_at) && lead.queue_level !== 'agent').length,
  }), [leads])

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        (lead.lead_name || '').toLowerCase().includes(query) ||
        (lead.project_name || '').toLowerCase().includes(query) ||
        (lead.assigned_agent || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesProject = projectFilter === 'all' || String(lead.project_id ?? '') === projectFilter
      const matchesQueue =
        queueFilter === 'all'
          ? true
          : queueFilter === 'assigned'
            ? lead.queue_level === 'agent'
            : queueFilter === 'returned'
              ? Boolean(lead.last_returned_at) && lead.queue_level !== 'agent'
              : lead.queue_level === queueFilter && !lead.last_returned_at

      return matchesSearch && matchesStatus && matchesProject && matchesQueue
    })
  }, [leads, search, queueFilter, statusFilter, projectFilter])

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

  function handleReturnToQueue() {
    if (!returnLead) return
    startTransition(async () => {
      const result = await returnLeadToQueueAction(returnLead.id)
      if (!result.success || !result.data) {
        toast({ title: 'Return failed', description: result.message, variant: 'destructive' })
        return
      }
      patchLead(result.data)
      setReturnLead(null)
      toast({ title: 'Lead returned', description: result.message })
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-slate-900">Sales Leads</CardTitle>
              <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
                <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search leads" />
                </div>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed_won">Closed Won</SelectItem>
                    <SelectItem value="closed_lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {canCreate ? <LeadCreateModal users={users} agents={agents} projects={projects} onSaved={addLead} /> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <QueueFilterButton active={queueFilter === 'all'} count={leads.length} label="All" onClick={() => { setQueueFilter('all'); setPage(1) }} />
              <QueueFilterButton active={queueFilter === 'main_queue'} count={queueCounts.main_queue} label="Main Queue" onClick={() => { setQueueFilter('main_queue'); setPage(1) }} />
              <QueueFilterButton active={queueFilter === 'suboffice_queue'} count={queueCounts.suboffice_queue} label="Suboffice Queue" onClick={() => { setQueueFilter('suboffice_queue'); setPage(1) }} />
              <QueueFilterButton active={queueFilter === 'assigned'} count={queueCounts.assigned} label="Assigned" onClick={() => { setQueueFilter('assigned'); setPage(1) }} />
              <QueueFilterButton active={queueFilter === 'returned'} count={queueCounts.returned} label="Returned / Expired" onClick={() => { setQueueFilter('returned'); setPage(1) }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Lead</th>
                <th className="px-4 py-4">Office</th>
                <th className="px-4 py-4">Queue</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Assigned To</th>
                <th className="px-4 py-4">Expires</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedLeads.length ? paginatedLeads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{lead.lead_name || 'Unnamed lead'}</p>
                      <p className="mt-1 text-xs text-slate-500">{lead.source || 'Unknown source'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{lead.routing_office_name || 'Main Office'}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">{getQueueLabel(lead)}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{lead.project_name || 'Not linked'}</td>
                  <td className="px-4 py-4 text-slate-600">{lead.assigned_agent || 'Unassigned'}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {lead.assignment_expires_at ? formatDate(lead.assignment_expires_at) : lead.last_returned_at ? `Returned ${formatDate(lead.last_returned_at)}` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{lead.status.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(lead.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                        <DropdownMenuItem onClick={() => setViewLead(lead)}><Eye size={15} />View Lead</DropdownMenuItem>
                        {canEdit ? <DropdownMenuItem onClick={() => setEditLead(lead)}><Pencil size={15} />Edit Lead</DropdownMenuItem> : null}
                        {canAssign ? <DropdownMenuItem onClick={() => { setAssignLead(lead); setAssignedTo(lead.assigned_to ?? '') }}><UserCog size={15} />Assign Agent</DropdownMenuItem> : null}
                        {canReturn && lead.queue_level === 'agent' ? <DropdownMenuItem onClick={() => setReturnLead(lead)}><ArrowLeftCircle size={15} />Return To Queue</DropdownMenuItem> : null}
                        {canEdit ? <DropdownMenuItem onClick={() => handleStatusChange(lead, lead.status === 'new' ? 'contacted' : lead.status === 'contacted' ? 'qualified' : lead.status === 'qualified' ? 'proposal_sent' : lead.status === 'proposal_sent' ? 'negotiation' : lead.status === 'negotiation' ? 'closed_won' : lead.status)}><Pencil size={15} />Update Status</DropdownMenuItem> : null}
                        {canEdit ? <DropdownMenuItem onClick={() => { setNoteLead(lead); setNoteText(lead.notes ?? '') }}><StickyNote size={15} />Add Note</DropdownMenuItem> : null}
                        {canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteLead(lead)}><Trash2 size={15} />Delete Lead</DropdownMenuItem></> : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-400">No leads match the current filters.</td></tr>}
            </tbody>
          </table>
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">Showing {paginatedLeads.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} leads</p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage(Math.max(page - 1, 1)) }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                const pageNumber = index + 1
                return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem>
              })}
              <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage(Math.min(page + 1, totalPages)) }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <LeadDetailsDrawer open={Boolean(viewLead)} onOpenChange={(open) => !open && setViewLead(null)} lead={viewLead} timeline={viewLead ? timelineMap.get(viewLead.id) ?? [] : []} />
      {editLead && canEdit ? <LeadCreateModal users={users} agents={agents} projects={projects} onSaved={(lead) => { patchLead(lead); setEditLead(null) }} initialLead={editLead} open={Boolean(editLead)} onOpenChange={(open) => !open && setEditLead(null)} hideTrigger /> : null}

      <Dialog open={Boolean(assignLead) && canAssign} onOpenChange={(open) => !open && setAssignLead(null)}>
        <DialogContent className="max-w-md rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
            <DialogDescription>Select the agent responsible for this lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Assigned Agent</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name}{agent.office_name ? ` (${agent.office_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAssignLead(null)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleAssign} disabled={isPending}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(noteLead) && canEdit} onOpenChange={(open) => !open && setNoteLead(null)}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Keep the latest context and sales notes attached to this lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea className="min-h-36" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setNoteLead(null)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleNoteSave} disabled={isPending}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(returnLead) && canReturn} onOpenChange={(open) => !open && setReturnLead(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Return lead to queue?</AlertDialogTitle>
            <AlertDialogDescription>This clears the active assignment and places the lead back into its owning queue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={(event) => { event.preventDefault(); handleReturnToQueue() }}>Return Lead</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteLead) && canDelete} onOpenChange={(open) => !open && setDeleteLead(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the lead from the CRM pipeline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={(event) => { event.preventDefault(); handleDelete() }}>Delete Lead</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function QueueFilterButton({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className={active ? 'rounded-full bg-[#1428ae] hover:bg-[#0f1f8a]' : 'rounded-full'}
      onClick={onClick}
    >
      {label}
      <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{count}</span>
    </Button>
  )
}
