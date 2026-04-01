'use client'

import { Copy, Download, Eye, FileText, FileVideo2, Folder, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { MediaFileRecord, MediaFolderRecord } from '@/lib/media-types'

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(value: string | null) {
  if (!value) return 'Unknown date'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown date' : parsed.toLocaleDateString()
}

function FileThumb({ file }: { file: MediaFileRecord }) {
  if (file.previewable) {
    return <img src={file.url} alt={file.name} loading="lazy" className="h-40 w-full rounded-xl object-cover" />
  }

  return <div className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-500">{file.category === 'video' ? <FileVideo2 size={42} /> : <FileText size={42} />}</div>
}

export default function MediaGrid({
  files,
  folders,
  onOpenFolder,
  onPreview,
  onCopyUrl,
  onDelete,
}: {
  files: MediaFileRecord[]
  folders: MediaFolderRecord[]
  onOpenFolder: (path: string) => void
  onPreview: (file: MediaFileRecord) => void
  onCopyUrl: (file: MediaFileRecord) => void
  onDelete: (file: MediaFileRecord) => void
}) {
  return (
    <div className="space-y-6">
      {folders.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Folders</h2><span className="text-xs text-slate-400">{folders.length} folders</span></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {folders.map((folder) => (
              <Card key={folder.path} className="cursor-pointer border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" onClick={() => onOpenFolder(folder.path)}>
                <CardContent className="flex items-center gap-4 px-5 py-5"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Folder size={22} /></span><div><p className="font-semibold text-slate-900">{folder.name}</p><p className="text-xs text-slate-500">{folder.fileCount} files</p></div></CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Files</h2><span className="text-xs text-slate-400">{files.length} files</span></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {files.map((file) => (
            <Card key={file.id} className="group overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4">
                <div className="relative">
                  <FileThumb file={file} />
                  <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/90 shadow-sm"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200">
                        <DropdownMenuItem onClick={() => onPreview(file)}><Eye size={15} />Preview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCopyUrl(file)}><Copy size={15} />Copy URL</DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={file.url} target="_blank" rel="noreferrer"><Download size={15} />Download</a></DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}><Trash2 size={15} />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2"><p className="line-clamp-1 font-semibold text-slate-900">{file.name}</p><Badge variant="outline" className="rounded-full border-slate-200 text-[10px] uppercase text-slate-500">{file.category}</Badge></div>
                  <div className="text-xs text-slate-500"><p>{formatBytes(file.size)}</p><p>{formatDate(file.uploadedAt)}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
          {files.length === 0 ? <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">No files match the current filters.</div> : null}
        </div>
      </section>
    </div>
  )
}