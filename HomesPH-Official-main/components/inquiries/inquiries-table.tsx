'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeftCircle, Eye, Mail, MoreHorizontal, Search, Trash2, UserCog } from 'lucide-react'
import { assignInquiryAgentAction, deleteInquiryAction, returnInquiryToQueueAction, updateInquiryStatusAction } from '@/app/dashboard/inquiries/actions'
import InquiryDetailsDrawer from '@/components/inquiries/inquiry-details-drawer'
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
import { useToast } from '@/hooks/use-toast'
import type { InquiryAgentOptionRecord, InquiryListingOptionRecord, InquiryProjectOptionRecord, InquiryRecord, InquiryStatus } from '@/lib/inquiries-types'

const PAGE_SIZE = 10

type QueueFilter = 'all' | 'main_queue' | 'suboffice_queue' | 'assigned' | 'returned'

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

function getQueueLabel(inquiry: InquiryRecord) {
  if (inquiry.last_returned_at && inquiry.queue_level !== 'agent') {
    return 'Returned'
  }

  if (inquiry.queue_level === 'main_queue') return 'Main Queue'
  if (inquiry.queue_level === 'suboffice_queue') return 'Suboffice Queue'
  return 'Assigned'
}

export default function InquiriesTable({
  inquiries,
  projects,
  listings,
  agents,
  onChange,
  canReply = true,
  canUpdateStatus = true,
  canDelete = true,
  canAssign = false,
  canReturn = false,
}: {
  inquiries: InquiryRecord[]
  projects: InquiryProjectOptionRecord[]
  listings: InquiryListingOptionRecord[]
  agents: InquiryAgentOptionRecord[]
  onChange: (next: InquiryRecord[]) => void
  canReply?: boolean
  canUpdateStatus?: boolean
  canDelete?: boolean
  canAssign?: boolean
  canReturn?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewInquiry, setViewInquiry] = useState<InquiryRecord | null>(null)
  const [assignInquiry, setAssignInquiry] = useState<InquiryRecord | null>(null)
  const [returnInquiry, setReturnInquiry] = useState<InquiryRecord | null>(null)
  const [deleteInquiry, setDeleteInquiry] = useState<InquiryRecord | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [isPending, startTransition] = useTransition()

  const queueCounts = useMemo(() => ({
    main_queue: inquiries.filter((inquiry) => inquiry.queue_level === 'main_queue' && !inquiry.last_returned_at).length,
    suboffice_queue: inquiries.filter((inquiry) => inquiry.queue_level === 'suboffice_queue' && !inquiry.last_returned_at).length,
    assigned: inquiries.filter((inquiry) => inquiry.queue_level === 'agent').length,
    returned: inquiries.filter((inquiry) => Boolean(inquiry.last_returned_at) && inquiry.queue_level !== 'agent').length,
  }), [inquiries])

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return inquiries.filter((inquiry) => {
      const matchesSearch =
        !query ||
        (inquiry.sender_name || '').toLowerCase().includes(query) ||
        (inquiry.subject || '').toLowerCase().includes(query) ||
        (inquiry.assigned_agent || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter
      const matchesProject = projectFilter === 'all' || String(inquiry.project_id ?? '') === projectFilter
      const matchesListing = listingFilter === 'all' || String(inquiry.listing_id ?? '') === listingFilter
      const matchesQueue =
        queueFilter === 'all'
          ? true
          : queueFilter === 'assigned'
            ? inquiry.queue_level === 'agent'
            : queueFilter === 'returned'
              ? Boolean(inquiry.last_returned_at) && inquiry.queue_level !== 'agent'
              : inquiry.queue_level === queueFilter && !inquiry.last_returned_at

      return matchesSearch && matchesStatus && matchesProject && matchesListing && matchesQueue
    })
  }, [inquiries, search, queueFilter, statusFilter, projectFilter, listingFilter])

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE))
  const paginatedInquiries = filteredInquiries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function patchInquiry(nextInquiry: InquiryRecord) {
    onChange(inquiries.map((inquiry) => inquiry.id === nextInquiry.id ? nextInquiry : inquiry))
  }

  function handleStatusChange(inquiry: InquiryRecord, status: InquiryStatus) {
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, status)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }
      patchInquiry(result.data)
      router.refresh()
      toast({ title: status === 'read' ? 'Inquiry marked as read' : 'Inquiry updated', description: result.message })
    })
  }

  function handleAssign() {
    if (!assignInquiry) return
    startTransition(async () => {
      const result = await assignInquiryAgentAction(assignInquiry.id, assignedTo)
      if (!result.success || !result.data) {
        toast({ title: 'Assignment failed', description: result.message, variant: 'destructive' })
        return
      }
      patchInquiry(result.data)
      setAssignInquiry(null)
      router.refresh()
      toast({ title: 'Inquiry assigned', description: result.message })
    })
  }

  function handleReturnToQueue() {
    if (!returnInquiry) return
    startTransition(async () => {
      const result = await returnInquiryToQueueAction(returnInquiry.id)
      if (!result.success || !result.data) {
        toast({ title: 'Return failed', description: result.message, variant: 'destructive' })
        return
      }
      patchInquiry(result.data)
      setReturnInquiry(null)
      router.refresh()
      toast({ title: 'Inquiry returned', description: result.message })
    })
  }

  function handleDelete() {
    if (!deleteInquiry) return
    const previous = inquiries
    onChange(inquiries.filter((inquiry) => inquiry.id !== deleteInquiry.id))
    startTransition(async () => {
      const result = await deleteInquiryAction(deleteInquiry.id)
      if (!result.success) {
        onChange(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }
      setDeleteInquiry(null)
      router.refresh()
      toast({ title: 'Inquiry deleted', description: result.message })
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-slate-900">Property Inquiries</CardTitle>
              <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
                <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search inquiries" />
                </div>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[170px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[190px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={listingFilter} onValueChange={(value) => { setListingFilter(value); setPage(1) }}>
                  <SelectTrigger className="w-[210px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All listings</SelectItem>
                    {listings.map((listing) => <SelectItem key={listing.id} value={String(listing.id)}>{listing.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <QueueFilterButton active={queueFilter === 'all'} count={inquiries.length} label="All" onClick={() => { setQueueFilter('all'); setPage(1) }} />
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
                <th className="px-6 py-4">Sender</th>
                <th className="px-4 py-4">Office</th>
                <th className="px-4 py-4">Queue</th>
                <th className="px-4 py-4">Listing / Project</th>
                <th className="px-4 py-4">Assigned To</th>
                <th className="px-4 py-4">Expires</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedInquiries.length ? paginatedInquiries.map((inquiry) => (
                <tr key={inquiry.id} className={inquiry.status === 'unread' ? 'bg-amber-50/40 transition-colors hover:bg-amber-50' : 'transition-colors hover:bg-slate-50'}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{inquiry.sender_name || 'Unknown sender'}</p>
                      <p className="mt-1 text-xs text-slate-500">{inquiry.subject || 'No subject'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{inquiry.routing_office_name || 'Main Office'}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">{getQueueLabel(inquiry)}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {inquiry.listing_title || inquiry.project_name || 'Not linked'}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{inquiry.assigned_agent || 'Unassigned'}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {inquiry.assignment_expires_at ? formatDate(inquiry.assignment_expires_at) : inquiry.last_returned_at ? `Returned ${formatDate(inquiry.last_returned_at)}` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className={`rounded-full ${inquiry.status === 'unread' ? 'border-amber-200 bg-amber-50 text-amber-700' : inquiry.status === 'read' ? 'border-blue-200 bg-blue-50 text-blue-700' : inquiry.status === 'replied' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>{inquiry.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(inquiry.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                        <DropdownMenuItem onClick={() => setViewInquiry(inquiry)}><Eye size={15} />View Inquiry</DropdownMenuItem>
                        {canReply ? <DropdownMenuItem onClick={() => setViewInquiry(inquiry)}><Mail size={15} />Reply</DropdownMenuItem> : null}
                        {canAssign ? <DropdownMenuItem onClick={() => { setAssignInquiry(inquiry); setAssignedTo(inquiry.assigned_to ?? '') }}><UserCog size={15} />Assign Agent</DropdownMenuItem> : null}
                        {canReturn && inquiry.queue_level === 'agent' ? <DropdownMenuItem onClick={() => setReturnInquiry(inquiry)}><ArrowLeftCircle size={15} />Return To Queue</DropdownMenuItem> : null}
                        {canUpdateStatus ? <DropdownMenuItem onClick={() => handleStatusChange(inquiry, 'read')}><Eye size={15} />Mark as Read</DropdownMenuItem> : null}
                        {canUpdateStatus ? <DropdownMenuItem onClick={() => handleStatusChange(inquiry, 'closed')}><Eye size={15} />Close Inquiry</DropdownMenuItem> : null}
                        {canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteInquiry(inquiry)}><Trash2 size={15} />Delete Inquiry</DropdownMenuItem></> : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-400">No inquiries match the current filters.</td></tr>}
            </tbody>
          </table>
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">Showing {paginatedInquiries.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredInquiries.length)} of {filteredInquiries.length} inquiries</p>
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

      <InquiryDetailsDrawer open={Boolean(viewInquiry)} onOpenChange={(open) => !open && setViewInquiry(null)} inquiry={viewInquiry} onReplied={(inquiry) => { patchInquiry(inquiry); setViewInquiry(inquiry) }} canReply={canReply} />

      <Dialog open={Boolean(assignInquiry) && canAssign} onOpenChange={(open) => !open && setAssignInquiry(null)}>
        <DialogContent className="max-w-md rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
            <DialogDescription>Select the agent responsible for this inquiry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Assigned Agent</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}{agent.office_name ? ` (${agent.office_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAssignInquiry(null)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleAssign} disabled={isPending}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(returnInquiry) && canReturn} onOpenChange={(open) => !open && setReturnInquiry(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Return inquiry to queue?</AlertDialogTitle>
            <AlertDialogDescription>This clears the active assignment and places the inquiry back into its owning queue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={(event) => { event.preventDefault(); handleReturnToQueue() }}>Return Inquiry</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteInquiry) && canDelete} onOpenChange={(open) => !open && setDeleteInquiry(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete inquiry?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the inquiry from the dashboard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={(event) => { event.preventDefault(); handleDelete() }}>Delete Inquiry</AlertDialogAction>
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
