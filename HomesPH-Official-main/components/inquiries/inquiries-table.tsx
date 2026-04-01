'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Eye, Mail, MoreHorizontal, Search, Trash2 } from 'lucide-react'
import { deleteInquiryAction, updateInquiryStatusAction } from '@/app/dashboard/inquiries/actions'
import InquiryDetailsDrawer from '@/components/inquiries/inquiry-details-drawer'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { InquiryListingOptionRecord, InquiryProjectOptionRecord, InquiryRecord, InquiryStatus } from '@/lib/inquiries-types'

const PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

export default function InquiriesTable({ inquiries, projects, listings, onChange, canReply = true, canUpdateStatus = true, canDelete = true }: { inquiries: InquiryRecord[]; projects: InquiryProjectOptionRecord[]; listings: InquiryListingOptionRecord[]; onChange: (next: InquiryRecord[]) => void; canReply?: boolean; canUpdateStatus?: boolean; canDelete?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [listingFilter, setListingFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewInquiry, setViewInquiry] = useState<InquiryRecord | null>(null)
  const [deleteInquiry, setDeleteInquiry] = useState<InquiryRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = Date.now()
    return inquiries.filter((inquiry) => {
      const matchesSearch = !query || (inquiry.sender_name || '').toLowerCase().includes(query) || (inquiry.subject || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter
      const matchesProject = projectFilter === 'all' || String(inquiry.project_id ?? '') === projectFilter
      const matchesListing = listingFilter === 'all' || String(inquiry.listing_id ?? '') === listingFilter
      let matchesDate = true
      if (dateRangeFilter !== 'all' && inquiry.created_at) {
        const created = new Date(inquiry.created_at).getTime()
        const days = dateRangeFilter === '7d' ? 7 : dateRangeFilter === '30d' ? 30 : 90
        matchesDate = created >= now - days * 24 * 60 * 60 * 1000
      }
      return matchesSearch && matchesStatus && matchesProject && matchesListing && matchesDate
    })
  }, [inquiries, search, statusFilter, projectFilter, listingFilter, dateRangeFilter])

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
      <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="border-b border-slate-100 bg-white"><div className="flex flex-wrap items-center gap-3"><CardTitle className="text-slate-900">Property Inquiries</CardTitle><div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto"><div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search inquiries" /></div><Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}><SelectTrigger className="w-[170px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="unread">Unread</SelectItem><SelectItem value="read">Read</SelectItem><SelectItem value="replied">Replied</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select><Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setPage(1) }}><SelectTrigger className="w-[190px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}</SelectContent></Select><Select value={listingFilter} onValueChange={(value) => { setListingFilter(value); setPage(1) }}><SelectTrigger className="w-[210px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All listings</SelectItem>{listings.map((listing) => <SelectItem key={listing.id} value={String(listing.id)}>{listing.title}</SelectItem>)}</SelectContent></Select><Select value={dateRangeFilter} onValueChange={(value) => { setDateRangeFilter(value); setPage(1) }}><SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All dates</SelectItem><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent className="overflow-x-auto px-0"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400"><tr><th className="px-6 py-4">Sender</th><th className="px-4 py-4">Listing</th><th className="px-4 py-4">Project</th><th className="px-4 py-4">Subject</th><th className="px-4 py-4">Message Preview</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Created Date</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{paginatedInquiries.length ? paginatedInquiries.map((inquiry) => <tr key={inquiry.id} className={inquiry.status === 'unread' ? 'bg-amber-50/60 transition-colors hover:bg-amber-50' : 'transition-colors hover:bg-slate-50'}><td className="px-6 py-4 font-semibold text-slate-900">{inquiry.sender_name || 'Unknown sender'}</td><td className="px-4 py-4 text-slate-600">{inquiry.listing_title || 'Not linked'}</td><td className="px-4 py-4 text-slate-600">{inquiry.project_name || 'Not linked'}</td><td className="px-4 py-4 text-slate-600">{inquiry.subject || 'No subject'}</td><td className="px-4 py-4 text-slate-600">{inquiry.message.slice(0, 80)}{inquiry.message.length > 80 ? '...' : ''}</td><td className="px-4 py-4"><Badge variant="outline" className={`rounded-full ${inquiry.status === 'unread' ? 'border-amber-200 bg-amber-50 text-amber-700' : inquiry.status === 'read' ? 'border-blue-200 bg-blue-50 text-blue-700' : inquiry.status === 'replied' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>{inquiry.status}</Badge></td><td className="px-4 py-4 text-slate-600">{formatDate(inquiry.created_at)}</td><td className="px-6 py-4 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200"><DropdownMenuItem onClick={() => setViewInquiry(inquiry)}><Eye size={15} />View Inquiry</DropdownMenuItem>{canReply ? <DropdownMenuItem onClick={() => setViewInquiry(inquiry)}><Mail size={15} />Reply</DropdownMenuItem> : null}{canUpdateStatus ? <DropdownMenuItem onClick={() => handleStatusChange(inquiry, 'read')}><Eye size={15} />Mark as Read</DropdownMenuItem> : null}{canUpdateStatus ? <DropdownMenuItem onClick={() => handleStatusChange(inquiry, 'closed')}><Eye size={15} />Close Inquiry</DropdownMenuItem> : null}{canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteInquiry(inquiry)}><Trash2 size={15} />Delete Inquiry</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu></td></tr>) : <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400">No inquiries match the current filters.</td></tr>}</tbody></table></CardContent><div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4"><p className="text-sm text-slate-500">Showing {paginatedInquiries.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredInquiries.length)} of {filteredInquiries.length} inquiries</p><Pagination className="mx-0 w-auto justify-end"><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage(Math.max(page - 1, 1)) }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => { const pageNumber = index + 1; return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem> })}<PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage(Math.min(page + 1, totalPages)) }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination></div></Card>

      <InquiryDetailsDrawer open={Boolean(viewInquiry)} onOpenChange={(open) => !open && setViewInquiry(null)} inquiry={viewInquiry} onReplied={(inquiry) => { patchInquiry(inquiry); setViewInquiry(inquiry) }} canReply={canReply} />
      <AlertDialog open={Boolean(deleteInquiry) && canDelete} onOpenChange={(open) => !open && setDeleteInquiry(null)}><AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete inquiry?</AlertDialogTitle><AlertDialogDescription>This permanently removes the inquiry from the dashboard.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={(event) => { event.preventDefault(); handleDelete() }}>Delete Inquiry</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}