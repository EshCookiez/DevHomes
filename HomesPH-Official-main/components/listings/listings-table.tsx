'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Eye, Image as ImageIcon, MoreHorizontal, Search, Sparkles, Trash2 } from 'lucide-react'
import { deleteListingAction, setListingFeaturedAction, setListingStatusAction } from '@/app/dashboard/listings/actions'
import ListingCreateModal from '@/components/listings/listing-create-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type {
  ListingDeveloperOptionRecord,
  ListingListRecord,
  ListingProjectOptionRecord,
  ListingRecord,
  ListingUnitOptionRecord,
} from '@/lib/listings-types'

const PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

function formatPrice(currency: string | null, value: number | null) {
  if (value === null) return 'Not set'
  return `${currency || 'PHP'} ${Number(value).toLocaleString()}`
}

function statusBadgeClass(status: string | null) {
  if (status === 'published') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'archived') return 'border-slate-200 bg-slate-100 text-slate-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export default function ListingsTable({
  initialListings,
  developers,
  projects,
  units,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canManage = true,
}: {
  initialListings: ListingListRecord[]
  developers: ListingDeveloperOptionRecord[]
  projects: ListingProjectOptionRecord[]
  units: ListingUnitOptionRecord[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canManage?: boolean
}) {
  const { toast } = useToast()
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [developerFilter, setDeveloperFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'price-desc' | 'price-asc' | 'created-desc' | 'created-asc'>('created-desc')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ListingListRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...listings]
      .filter((listing) => {
        const matchesSearch = !query || listing.title.toLowerCase().includes(query)
        const matchesProject = projectFilter === 'all' || String(listing.project_id ?? '') === projectFilter
        const matchesDeveloper = developerFilter === 'all' || String(listing.developer_id ?? '') === developerFilter
        const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
        return matchesSearch && matchesProject && matchesDeveloper && matchesStatus
      })
      .sort((left, right) => {
        if (sortBy === 'price-asc') return (left.price ?? 0) - (right.price ?? 0)
        if (sortBy === 'price-desc') return (right.price ?? 0) - (left.price ?? 0)
        if (sortBy === 'created-asc') return new Date(left.created_at ?? 0).getTime() - new Date(right.created_at ?? 0).getTime()
        return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime()
      })
  }, [listings, search, projectFilter, developerFilter, statusFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / PAGE_SIZE))
  const paginatedListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  function patchListing(nextListing: ListingRecord) {
    setListings((current) => current.map((listing) => listing.id === nextListing.id ? nextListing : listing))
  }

  function addListing(nextListing: ListingListRecord) {
    setListings((current) => [nextListing, ...current])
  }

  function handleFeatureToggle(listing: ListingListRecord) {
    startTransition(async () => {
      const result = await setListingFeaturedAction(listing.id, !listing.is_featured)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }
      patchListing(result.data)
      toast({ title: result.data.is_featured ? 'Listing featured' : 'Listing unfeatured', description: result.message })
    })
  }

  function handleStatusChange(listing: ListingListRecord, status: 'draft' | 'published' | 'archived') {
    startTransition(async () => {
      const result = await setListingStatusAction(listing.id, status)
      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }
      patchListing(result.data)
      toast({ title: 'Listing updated', description: result.message })
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    const previous = listings
    setListings((current) => current.filter((listing) => listing.id !== deleteTarget.id))

    startTransition(async () => {
      const result = await deleteListingAction(deleteTarget.id)
      if (!result.success) {
        setListings(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Listing deleted', description: result.message })
      setDeleteTarget(null)
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-slate-900">Listings Inventory</CardTitle>
            <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
              <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search listings" />
              </div>
              <Select value={projectFilter} onValueChange={(value) => { setProjectFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[200px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={developerFilter} onValueChange={(value) => { setDeveloperFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[190px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All developers</SelectItem>
                  {developers.map((developer) => <SelectItem key={developer.id} value={String(developer.id)}>{developer.developer_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[170px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: 'price-desc' | 'price-asc' | 'created-desc' | 'created-asc') => setSortBy(value)}>
                <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Newest First</SelectItem>
                  <SelectItem value="created-asc">Oldest First</SelectItem>
                  <SelectItem value="price-desc">Price High to Low</SelectItem>
                  <SelectItem value="price-asc">Price Low to High</SelectItem>
                </SelectContent>
              </Select>
              {canCreate ? <ListingCreateModal developers={developers} projects={projects} units={units} onCreated={addListing} /> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-4 py-4">Listing Title</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">Developer</th>
                <th className="px-4 py-4">Unit Type</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Listing Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Views</th>
                <th className="px-4 py-4">Inquiries</th>
                <th className="px-4 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedListings.length ? paginatedListings.map((listing) => (
                <tr key={listing.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {listing.listing_image_url ? (
                      <img src={listing.listing_image_url} alt={listing.title} className="h-12 w-12 rounded-xl border border-slate-200 object-cover bg-white" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{listing.title}</p>
                      {listing.is_featured ? <Badge variant="outline" className="mt-2 rounded-full border-blue-200 bg-blue-50 text-blue-700"><Sparkles size={12} />Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{listing.project_name || 'Not linked'}</td>
                  <td className="px-4 py-4 text-slate-600">{listing.developer_name || 'Not linked'}</td>
                  <td className="px-4 py-4 text-slate-600">{listing.unit_name || listing.unit_type || 'Not linked'}</td>
                  <td className="px-4 py-4 text-slate-600">{formatPrice(listing.currency, listing.price)}</td>
                  <td className="px-4 py-4 text-slate-600 capitalize">{listing.listing_type || 'Unknown'}</td>
                  <td className="px-4 py-4"><Badge variant="outline" className={`rounded-full ${statusBadgeClass(listing.status)}`}>{listing.status || 'draft'}</Badge></td>
                  <td className="px-4 py-4 text-slate-600">{(listing.views_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-600">{(listing.inquiries_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(listing.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                        <DropdownMenuItem asChild><Link href={`/dashboard/listings/${listing.id}`}><Eye size={15} />View Listing</Link></DropdownMenuItem>
                        {canEdit || canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/listings/${listing.id}?tab=overview`}><Eye size={15} />Edit Listing</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/listings/${listing.id}?tab=gallery`}><ImageIcon size={15} />Manage Gallery</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem onClick={() => handleFeatureToggle(listing)}><Sparkles size={15} />{listing.is_featured ? 'Unfeature Listing' : 'Feature Listing'}</DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem onClick={() => handleStatusChange(listing, 'draft')}><Eye size={15} />Unpublish Listing</DropdownMenuItem> : null}
                        {canDelete ? <DropdownMenuSeparator /> : null}
                        {canDelete ? <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(listing)}><Trash2 size={15} />Delete Listing</DropdownMenuItem> : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={12} className="px-6 py-16 text-center text-slate-400">No listings match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">Showing {paginatedListings.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredListings.length)} of {filteredListings.length} listings</p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); goToPage(page - 1) }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                const pageNumber = index + 1
                return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => { event.preventDefault(); goToPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem>
              })}
              <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); goToPage(page + 1) }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the listing and all linked gallery images.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={(event) => { event.preventDefault(); handleDelete() }} disabled={isPending}>Delete Listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}