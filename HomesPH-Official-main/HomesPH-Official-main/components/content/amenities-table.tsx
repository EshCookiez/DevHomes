'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Waves } from 'lucide-react'
import { createAmenityAction, deleteAmenityAction, updateAmenityAction } from '@/app/dashboard/content/actions'
import AmenityModal from '@/components/content/amenity-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import type { AmenityInput, AmenityRecord } from '@/lib/content-types'

const EMPTY_FORM: AmenityInput = { name: '', description: '' }
const PAGE_SIZE = 8

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString()
}

export default function AmenitiesTable({ initialAmenities }: { initialAmenities: AmenityRecord[] }) {
  const { toast } = useToast()
  const [amenities, setAmenities] = useState(initialAmenities)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AmenityRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AmenityRecord | null>(null)
  const [form, setForm] = useState<AmenityInput>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => amenities
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => {
      const leftTime = new Date(left.created_at ?? 0).getTime()
      const rightTime = new Date(right.created_at ?? 0).getTime()
      return sort === 'desc' ? rightTime - leftTime : leftTime - rightTime
    }), [amenities, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  function resetForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(item: AmenityRecord) {
    setEditing(item)
    setForm({ name: item.name, description: item.description ?? '' })
    setOpen(true)
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: 'Missing field', description: 'Amenity name is required.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = editing ? await updateAmenityAction(editing.id, form) : await createAmenityAction(form)
      toast({ title: result.success ? editing ? 'Amenity updated' : 'Amenity created successfully' : 'Save failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (!result.success || !result.data) return

      setAmenities((current) => editing ? current.map((item) => item.id === editing.id ? result.data as AmenityRecord : item) : [result.data as AmenityRecord, ...current])
      setOpen(false)
      resetForm()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteAmenityAction(deleteTarget.id)
      toast({ title: result.success ? 'Amenity deleted' : 'Delete failed', description: result.message, variant: result.success ? 'default' : 'destructive' })
      if (!result.success) return
      setAmenities((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Waves} title="Total Amenities" value={amenities.length} tone="bg-blue-50 text-blue-700" />
        <MetricCard icon={Plus} title="Search Matches" value={filtered.length} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard icon={Search} title="Newest First" value={sort === 'desc' ? 'On' : 'Off'} tone="bg-amber-50 text-amber-700" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-4 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search Amenities" className="rounded-xl border-slate-200 pl-10" />
              </div>
              <Select value={sort} onValueChange={(value) => { setSort(value as 'desc' | 'asc'); setPage(1) }}>
                <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={openCreate}><Plus size={16} />Add Amenity</Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Amenity Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-6 font-semibold text-slate-900">{item.name}</TableCell>
                    <TableCell className="max-w-xl text-slate-600">{item.description || 'No description provided.'}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                          <DropdownMenuItem onClick={() => openEdit(item)}><Pencil size={14} />Edit Amenity</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(item)}><Trash2 size={14} />Delete Amenity</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {paginated.length === 0 ? <TableRow><TableCell colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500">No amenities match the current search.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.max(1, current - 1)) }} /></PaginationItem>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                const pageNumber = index + 1
                return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={page === pageNumber} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem>
              })}
              <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.min(totalPages, current + 1)) }} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>

      <AmenityModal open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }} value={form} editing={editing} isPending={isPending} onChange={setForm} onSubmit={handleSubmit} />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200"><AlertDialogHeader><AlertDialogTitle>Delete amenity?</AlertDialogTitle><AlertDialogDescription>This amenity will be removed from the platform taxonomy.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function MetricCard({ icon: Icon, title, value, tone }: { icon: typeof Waves; title: string; value: number | string; tone: string }) {
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 px-5 py-5"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><Icon size={20} /></span><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div></CardContent></Card>
}