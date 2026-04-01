'use client'

import { Copy, Download, Eye, FileText, FileVideo2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MediaFileRecord } from '@/lib/media-types'

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

function PreviewCell({ file }: { file: MediaFileRecord }) {
  if (file.previewable) {
    return <img src={file.url} alt={file.name} loading="lazy" className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
  }

  return <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">{file.category === 'video' ? <FileVideo2 size={18} /> : <FileText size={18} />}</span>
}

export default function MediaTable({ files, onPreview, onCopyUrl, onDelete }: { files: MediaFileRecord[]; onPreview: (file: MediaFileRecord) => void; onCopyUrl: (file: MediaFileRecord) => void; onDelete: (file: MediaFileRecord) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6">Preview</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="px-6"><PreviewCell file={file} /></TableCell>
              <TableCell><div><p className="font-semibold text-slate-900">{file.name}</p><p className="text-xs text-slate-500">{file.folder || 'Root'}</p></div></TableCell>
              <TableCell><Badge variant="outline" className="rounded-full border-slate-200 uppercase text-slate-500">{file.category}</Badge></TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell>{formatDate(file.uploadedAt)}</TableCell>
              <TableCell className="pr-6 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200">
                    <DropdownMenuItem onClick={() => onPreview(file)}><Eye size={15} />Preview</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopyUrl(file)}><Copy size={15} />Copy URL</DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={file.url} target="_blank" rel="noreferrer"><Download size={15} />Download</a></DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(file)}><Trash2 size={15} />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {files.length === 0 ? <TableRow><TableCell colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">No files match the current filters.</TableCell></TableRow> : null}
        </TableBody>
      </Table>
    </div>
  )
}