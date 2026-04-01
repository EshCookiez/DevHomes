'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Eye, FolderCog, FolderKanban, Images, MoreHorizontal, Search, ShieldCheck, Trash2 } from 'lucide-react'
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
import type { DeveloperOptionRecord, ProjectListRecord } from '@/lib/projects-types'
import { deleteProjectAction } from '@/app/dashboard/projects/actions'
import ProjectCreateModal from './project-create-modal'

const PAGE_SIZE = 10

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy')
}

function formatPriceRange(currency: string | null, min: number | null, max: number | null) {
  const resolvedCurrency = currency || 'PHP'
  if (min === null && max === null) return 'Not set'
  if (min !== null && max !== null) return `${resolvedCurrency} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`
  return `${resolvedCurrency} ${(min ?? max ?? 0).toLocaleString()}`
}

export default function ProjectsTable({
  initialProjects,
  developers,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canManage = true,
}: {
  initialProjects: ProjectListRecord[]
  developers: DeveloperOptionRecord[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canManage?: boolean
}) {
  const { toast } = useToast()
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [developerFilter, setDeveloperFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ProjectListRecord | null>(null)
  const [isPending, startTransition] = useTransition()

  const locations = useMemo(() => [...new Set(projects.map((project) => [project.city_municipality, project.province].filter(Boolean).join(', ')).filter(Boolean))], [projects])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...projects]
      .filter((project) => {
        const location = [project.city_municipality, project.province].filter(Boolean).join(', ')
        const matchesSearch = !query || project.name.toLowerCase().includes(query)
        const matchesDeveloper = developerFilter === 'all' || String(project.developer_id) === developerFilter
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        const matchesLocation = locationFilter === 'all' || location === locationFilter
        return matchesSearch && matchesDeveloper && matchesStatus && matchesLocation
      })
      .sort((left, right) => {
        const leftTime = new Date(left.created_at ?? 0).getTime()
        const rightTime = new Date(right.created_at ?? 0).getTime()
        return sortOrder === 'newest' ? rightTime - leftTime : leftTime - rightTime
      })
  }, [projects, search, developerFilter, statusFilter, locationFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages))
  }

  function addProject(project: ProjectListRecord) {
    setProjects(current => [project, ...current])
  }

  function handleDelete(project: ProjectListRecord) {
    const previous = projects
    setProjects(current => current.filter((entry) => entry.id !== project.id))

    startTransition(async () => {
      const result = await deleteProjectAction(project.id)
      if (!result.success) {
        setProjects(previous)
        toast({ title: 'Delete failed', description: result.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Project deleted', description: result.message })
      setDeleteTarget(null)
    })
  }

  return (
    <>
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-slate-900">Projects Portfolio</CardTitle>
            <div className="ml-auto flex w-full flex-wrap gap-3 xl:w-auto">
              <div className="relative min-w-[260px] flex-1 xl:w-72 xl:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="rounded-xl border-slate-200 pl-9" placeholder="Search projects" />
              </div>
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
                  {['pre-selling', 'rfo', 'completed'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={(value) => { setLocationFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[220px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                <SelectTrigger className="w-[170px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              {canCreate ? <ProjectCreateModal developers={developers} onCreated={addProject} /> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-4 py-4">Project Name</th>
                <th className="px-4 py-4">Developer</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Price Range</th>
                <th className="px-4 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedProjects.length ? paginatedProjects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {project.main_image_url ? (
                      <img src={project.main_image_url} alt={project.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover bg-white" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                        <FolderKanban size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{project.name}</p>
                      <p className="text-xs text-slate-500">/{project.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{project.developer_name || 'Unassigned'}</td>
                  <td className="px-4 py-4 text-slate-600">{[project.city_municipality, project.province].filter(Boolean).join(', ') || 'Not set'}</td>
                  <td className="px-4 py-4"><Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{project.status || 'Unknown'}</Badge></td>
                  <td className="px-4 py-4 text-slate-600">{formatPriceRange(project.currency, project.price_range_min, project.price_range_max)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(project.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                        <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}`}><Eye size={15} />View Project</Link></DropdownMenuItem>
                        {canEdit || canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}?tab=overview`}><FolderCog size={15} />Edit Project</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}?tab=units`}><ShieldCheck size={15} />Manage Units</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}?tab=gallery`}><Images size={15} />Manage Gallery</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}?tab=amenities`}><ShieldCheck size={15} />Manage Amenities</Link></DropdownMenuItem> : null}
                        {canManage ? <DropdownMenuItem asChild><Link href={`/dashboard/projects/${project.id}?tab=documents`}><FolderCog size={15} />Manage Documents</Link></DropdownMenuItem> : null}
                        {canDelete ? <DropdownMenuSeparator /> : null}
                        {canDelete ? <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(project)}><Trash2 size={15} />Delete Project</DropdownMenuItem> : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400">No projects match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">Showing {paginatedProjects.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filteredProjects.length)} of {filteredProjects.length} projects</p>
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
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the project together with its units, galleries, attachments, and FAQs.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={(event) => { event.preventDefault(); if (deleteTarget) handleDelete(deleteTarget) }}>
              {isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}