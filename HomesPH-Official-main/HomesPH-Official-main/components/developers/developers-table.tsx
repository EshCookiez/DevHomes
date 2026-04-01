'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Building2, Eye, MoreHorizontal, Pencil, Search, Trash2, UserCircle2, UserMinus, UserRoundCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ManagedDeveloperRecord } from '@/lib/developers-types'
import { deleteDeveloperAction, setDeveloperStatusAction } from '@/app/dashboard/developers/actions'
import DeveloperCreateModal from './developer-create-modal'
import DeveloperEditModal from './developer-edit-modal'

const PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function DevelopersTable({
  initialDevelopers,
}: {
  initialDevelopers: ManagedDeveloperRecord[]
}) {
  const { toast } = useToast()
  const [developers, setDevelopers] = useState(initialDevelopers)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const [editDeveloper, setEditDeveloper] = useState<ManagedDeveloperRecord | null>(null)
  const [statusDeveloper, setStatusDeveloper] = useState<ManagedDeveloperRecord | null>(null)
  const [deleteDeveloper, setDeleteDeveloper] = useState<ManagedDeveloperRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  const industries = useMemo(() => [...new Set(developers.map((developer) => developer.industry).filter(Boolean))] as string[], [developers])

  const filteredDevelopers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...developers]
      .filter((developer) => {
        const matchesSearch = !query || developer.developer_name.toLowerCase().includes(query)
        const matchesIndustry = industryFilter === 'all' || developer.industry === industryFilter
        return matchesSearch && matchesIndustry
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at ?? 0).getTime()
        const rightTime = new Date(right.created_at ?? 0).getTime()
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime
      })
  }, [developers, industryFilter, search, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredDevelopers.length / PAGE_SIZE))
  const paginatedDevelopers = filteredDevelopers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  function patchDeveloper(nextDeveloper: ManagedDeveloperRecord) {
    setDevelopers(current => current.map((entry) => entry.id === nextDeveloper.id ? nextDeveloper : entry))
  }

  function addDeveloper(nextDeveloper: ManagedDeveloperRecord) {
    setDevelopers(current => [nextDeveloper, ...current])
  }

  function handleStatusChange(developer: ManagedDeveloperRecord, isActive: boolean) {
    const previous = developers
    patchDeveloper({ ...developer, is_active: isActive })

    startTransition(async () => {
      const result = await setDeveloperStatusAction(developer.id, isActive)

      if (!result.success || !result.data) {
        setDevelopers(previous)
        toast({ title: 'Status update failed', description: result.message, variant: 'destructive' })
        return
      }

      patchDeveloper(result.data)
      toast({ title: isActive ? 'Developer activated' : 'Developer deactivated', description: result.message })
      setStatusDeveloper(null)
    })
  }

  function handleDelete(developer: ManagedDeveloperRecord) {
    const previous = developers
    setDevelopers(current => current.filter((entry) => entry.id !== developer.id))

    startTransition(async () => {
      const result = await deleteDeveloperAction(developer.id)
      if (!result.success) {
        setDevelopers(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Developer deleted', description: result.message })
      setDeleteDeveloper(null)
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-slate-900">Developer Companies</CardTitle>
            <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
              <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  className="rounded-xl border-slate-200 pl-9"
                  placeholder="Search developers"
                />
              </div>

              <Select value={industryFilter} onValueChange={(value) => {
                setIndustryFilter(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[190px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                <SelectTrigger className="w-[180px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>

              <DeveloperCreateModal onCreated={addDeveloper} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Logo</th>
                <th className="px-4 py-4">Developer Name</th>
                <th className="px-4 py-4">Industry</th>
                <th className="px-4 py-4">Website</th>
                <th className="px-4 py-4">Projects Count</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedDevelopers.length ? paginatedDevelopers.map((developer) => (
                <tr key={developer.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Avatar className="h-12 w-12 rounded-xl border border-slate-200 bg-white">
                      <AvatarImage src={developer.logo_url ?? undefined} alt={developer.developer_name} className="object-cover" />
                      <AvatarFallback className="rounded-xl bg-slate-100 text-slate-700">
                        {developer.logo_url ? getInitials(developer.developer_name) : <Building2 size={16} />}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{developer.developer_name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{developer.description || 'No description added yet.'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{developer.industry || 'Not specified'}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {developer.website_url ? (
                      <a href={developer.website_url} target="_blank" rel="noreferrer" className="text-[#1428ae] hover:text-[#0f1f8a] hover:underline">
                        {developer.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : 'Not set'}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{developer.projectsCount}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className={cn('rounded-full border px-2.5 py-0.5', developer.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                      {developer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(developer.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/developers/${developer.id}`}>
                            <Eye size={15} />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditDeveloper(developer)}>
                          <Pencil size={15} />
                          Edit Developer
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/developers/${developer.id}?tab=contacts`}>
                            <UserCircle2 size={15} />
                            Manage Contacts
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusDeveloper(developer)}>
                          {developer.is_active ? <UserMinus size={15} /> : <UserRoundCheck size={15} />}
                          {developer.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteDeveloper(developer)}>
                          <Trash2 size={15} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">No developers match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">Showing {paginatedDevelopers.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredDevelopers.length)} of {filteredDevelopers.length} developers</p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(event) => {
                  event.preventDefault()
                  goToPage(page - 1)
                }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                const pageNumber = index + 1
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => {
                      event.preventDefault()
                      goToPage(pageNumber)
                    }}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext href="#" onClick={(event) => {
                  event.preventDefault()
                  goToPage(page + 1)
                }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <DeveloperEditModal open={Boolean(editDeveloper)} onOpenChange={(open) => !open && setEditDeveloper(null)} developer={editDeveloper} onSaved={patchDeveloper} />

      <AlertDialog open={Boolean(statusDeveloper)} onOpenChange={(open) => !open && setStatusDeveloper(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDeveloper?.is_active ? 'Deactivate developer?' : 'Activate developer?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDeveloper?.is_active
                ? 'This developer will remain in the database but will be marked inactive in the dashboard.'
                : 'This will make the developer active again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={(event) => {
              event.preventDefault()
              if (statusDeveloper) {
                handleStatusChange(statusDeveloper, !statusDeveloper.is_active)
              }
            }}>
              {isPending ? 'Working...' : statusDeveloper?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteDeveloper)} onOpenChange={(open) => !open && setDeleteDeveloper(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete developer?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the developer record and linked child records that cascade from it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={(event) => {
              event.preventDefault()
              if (deleteDeveloper) {
                handleDelete(deleteDeveloper)
              }
            }}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}