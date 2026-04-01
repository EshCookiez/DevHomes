'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { ChevronLeft, Copy, FolderOpen, HardDrive, ImageIcon, Trash2 } from 'lucide-react'
import { createMediaFolderAction, deleteMediaFileAction, listMediaLibraryAction, uploadMediaFilesAction } from '@/app/dashboard/media/actions'
import MediaGrid from '@/components/media/media-grid'
import MediaPreviewModal from '@/components/media/media-preview-modal'
import MediaTable from '@/components/media/media-table'
import MediaToolbar from '@/components/media/media-toolbar'
import MediaUploadModal from '@/components/media/media-upload-modal'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'
import type { MediaFileFilter, MediaFileRecord, MediaLibrarySnapshot, MediaViewMode } from '@/lib/media-types'
import type { StorageProvider } from '@/lib/storage'

const PAGE_SIZE = 12

function normalizeFolder(value: string | null) {
  return value?.replace(/^\/+|\/+$/g, '') || null
}

function matchesFilter(file: MediaFileRecord, filter: MediaFileFilter) {
  if (filter === 'all') return true
  if (filter === 'images') return file.category === 'image'
  if (filter === 'documents') return file.category === 'document'
  if (filter === 'videos') return file.category === 'video'
  return true
}

export default function MediaManager({ initialSnapshot }: { initialSnapshot: MediaLibrarySnapshot }) {
  const { toast } = useToast()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid')
  const [filter, setFilter] = useState<MediaFileFilter>('all')
  const [search, setSearch] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [previewFile, setPreviewFile] = useState<MediaFileRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFileRecord | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [provider, setProvider] = useState<StorageProvider>(initialSnapshot.provider)
  const [isPending, startTransition] = useTransition()

  const activeFolder = normalizeFolder(currentFolder)
  const searchTerm = search.trim().toLowerCase()

  const visibleFolders = useMemo(() => snapshot.folders.filter((folder) => {
    const parent = normalizeFolder(folder.parentPath)
    const inFolder = activeFolder ? parent === activeFolder : parent === null
    const matches = !searchTerm || folder.name.toLowerCase().includes(searchTerm) || folder.path.toLowerCase().includes(searchTerm)
    return inFolder && matches
  }), [snapshot.folders, activeFolder, searchTerm])

  const filteredFiles = useMemo(() => snapshot.files.filter((file) => {
    const inFolder = activeFolder ? normalizeFolder(file.folder) === activeFolder : true
    const matchesSearch = !searchTerm || file.name.toLowerCase().includes(searchTerm) || file.folder.toLowerCase().includes(searchTerm)
    return inFolder && matchesSearch && matchesFilter(file, filter)
  }), [snapshot.files, activeFolder, searchTerm, filter])

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE))
  const paginatedFiles = useMemo(() => filteredFiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredFiles, page])

  const currentFolderLabel = activeFolder || 'All folders'
  const currentUploadFolder = activeFolder || 'media/uploads'

  function applySnapshot(next: MediaLibrarySnapshot) {
    setSnapshot(next)
    setPage(1)
  }

  function showResult(success: boolean, message: string, successTitle: string, failureTitle: string) {
    toast({ title: success ? successTitle : failureTitle, description: message, variant: success ? 'default' : 'destructive' })
  }

  function handleProviderChange(nextProvider: StorageProvider) {
    setProvider(nextProvider)
    startTransition(async () => {
      const result = await listMediaLibraryAction(nextProvider)
      showResult(result.success, result.message, 'Storage loaded', 'Load failed')
      if (result.success && result.data) {
        applySnapshot(result.data)
        setCurrentFolder(null)
        setProvider(result.data.provider)
      }
    })
  }

  async function handleUpload(files: File[], folderPath: string) {
    const formData = new FormData()
    formData.set('provider', provider)
    formData.set('folderPath', folderPath)
    for (const file of files) {
      formData.append('files', file)
    }

    const result = await uploadMediaFilesAction(formData)
    showResult(result.success, result.message, 'Upload complete', 'Upload failed')
    if (result.success && result.data) {
      applySnapshot(result.data)
      setProvider(result.data.provider)
      return true
    }

    return false
  }

  function handleCreateFolder() {
    startTransition(async () => {
      const result = await createMediaFolderAction(activeFolder || '', folderName, provider)
      showResult(result.success, result.message, 'Folder created', 'Folder creation failed')
      if (result.success && result.data) {
        applySnapshot(result.data)
        setProvider(result.data.provider)
        setCreateFolderOpen(false)
        setFolderName('')
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteMediaFileAction(deleteTarget.path, provider)
      showResult(result.success, result.message, 'File deleted', 'Delete failed')
      if (result.success && result.data) {
        applySnapshot(result.data)
        setProvider(result.data.provider)
        setDeleteTarget(null)
      }
    })
  }

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  async function handleCopyUrl(file: MediaFileRecord) {
    try {
      await navigator.clipboard.writeText(file.url)
      toast({ title: 'URL copied', description: 'The public URL was copied to the clipboard.' })
    } catch {
      toast({ title: 'Copy failed', description: 'Unable to copy the URL.', variant: 'destructive' })
    }
  }

  const stats = useMemo(() => ({
    totalFiles: snapshot.files.length,
    images: snapshot.files.filter((file) => file.category === 'image').length,
    folders: snapshot.folders.length,
  }), [snapshot])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] px-6 py-6 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_55%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Media Library</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage uploaded assets across Supabase Storage and S3-compatible buckets with search, folder organization, previews, and bulk uploads.</p>
          </div>
          <div className="grid min-w-[18rem] gap-3 sm:grid-cols-3">
            <StatCard icon={HardDrive} label="Files" value={stats.totalFiles} tone="bg-blue-50 text-blue-700" />
            <StatCard icon={ImageIcon} label="Images" value={stats.images} tone="bg-emerald-50 text-emerald-700" />
            <StatCard icon={FolderOpen} label="Folders" value={stats.folders} tone="bg-amber-50 text-amber-700" />
          </div>
        </div>
      </div>

      <MediaToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1) }}
        filter={filter}
        onFilterChange={(value) => { setFilter(value); setPage(1) }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        provider={provider}
        onProviderChange={handleProviderChange}
        currentFolder={currentFolderLabel}
        onUploadClick={() => setUploadOpen(true)}
        onCreateFolderClick={() => setCreateFolderOpen(true)}
      />

      <div className="flex flex-wrap items-center gap-3">
        {activeFolder ? <Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setCurrentFolder(snapshot.folders.find((folder) => folder.path === activeFolder)?.parentPath ?? null)}><ChevronLeft size={15} />Back</Button> : null}
        <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">Provider: {snapshot.provider}</Badge>
        <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">Folder: {currentFolderLabel}</Badge>
        <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-slate-600">Showing: {filteredFiles.length} files</Badge>
      </div>

      {viewMode === 'grid' ? <MediaGrid files={paginatedFiles} folders={visibleFolders} onOpenFolder={setCurrentFolder} onPreview={setPreviewFile} onCopyUrl={handleCopyUrl} onDelete={setDeleteTarget} /> : <MediaTable files={paginatedFiles} onPreview={setPreviewFile} onCopyUrl={handleCopyUrl} onDelete={setDeleteTarget} />}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <Pagination className="mx-0 w-auto justify-start md:justify-end">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.max(1, current - 1)) }} /></PaginationItem>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                const pageNumber = index + 1
                return <PaginationItem key={pageNumber}><PaginationLink href="#" isActive={pageNumber === page} onClick={(event) => { event.preventDefault(); setPage(pageNumber) }}>{pageNumber}</PaginationLink></PaginationItem>
              })}
              <PaginationItem><PaginationNext href="#" onClick={(event) => { event.preventDefault(); setPage((current) => Math.min(totalPages, current + 1)) }} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>

      <MediaUploadModal open={uploadOpen} onOpenChange={setUploadOpen} folderPath={currentUploadFolder} isUploading={isPending} onSubmit={handleUpload} />
      <MediaPreviewModal file={previewFile} open={Boolean(previewFile)} onOpenChange={(open) => !open && setPreviewFile(null)} onCopyUrl={handleCopyUrl} />

      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="max-w-lg rounded-xl border-slate-200">
          <DialogHeader><DialogTitle>Create Folder</DialogTitle><DialogDescription>Create a new virtual folder in the current storage provider.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Parent Folder</Label><Input value={currentFolderLabel} readOnly className="h-11 rounded-xl border-slate-200 bg-slate-50" /></div>
            <div className="space-y-2"><Label>Folder Name</Label><Input value={folderName} onChange={(event) => setFolderName(event.target.value)} className="h-11 rounded-xl border-slate-200" placeholder="projects" /></div>
          </div>
          <DialogFooter><Button variant="outline" className="rounded-xl border-slate-200" onClick={() => setCreateFolderOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleCreateFolder} disabled={isPending || !folderName.trim()}>Create Folder</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-slate-200">
          <AlertDialogHeader><AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle><AlertDialogDescription>This asset will be removed from {deleteTarget?.provider === 's3' ? 'the S3 bucket' : 'Supabase Storage'} permanently.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleDelete}><Trash2 size={15} />Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof HardDrive; label: string; value: number; tone: string }) {
  return <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm"><div className="flex items-center gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span><div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div></div></div>
}