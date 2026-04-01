'use client'

import { Copy, Download, FileText, FileVideo2, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { MediaFileRecord } from '@/lib/media-types'

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function MediaPreviewModal({ file, open, onOpenChange, onCopyUrl }: { file: MediaFileRecord | null; open: boolean; onOpenChange: (open: boolean) => void; onCopyUrl: (file: MediaFileRecord) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-xl border-slate-200 p-0 overflow-hidden">
        {file ? (
          <>
            <DialogHeader className="border-b border-slate-100 px-6 py-5"><DialogTitle>{file.name}</DialogTitle><DialogDescription>Preview the selected asset and copy its public URL.</DialogDescription></DialogHeader>
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="flex min-h-[26rem] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_52%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-6">
                {file.previewable ? <img src={file.url} alt={file.name} className="max-h-[32rem] w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm" /> : <div className="flex h-80 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-500">{file.category === 'video' ? <FileVideo2 size={52} /> : <FileText size={52} />}<p className="mt-4 text-sm">Preview not available for this file type.</p></div>}
              </div>
              <div className="space-y-5 bg-white px-6 py-6">
                <div className="flex items-center gap-2"><Badge variant="outline" className="rounded-full border-slate-200 uppercase text-slate-500">{file.category}</Badge><Badge variant="outline" className="rounded-full border-slate-200 uppercase text-slate-500">{file.provider}</Badge></div>
                <div className="space-y-3 text-sm text-slate-600">
                  <MetadataRow label="File Name" value={file.name} />
                  <MetadataRow label="Size" value={formatBytes(file.size)} />
                  <MetadataRow label="Upload Date" value={file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Unknown'} />
                  <MetadataRow label="Folder" value={file.folder || 'Root'} />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Public URL</p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs break-all">{file.url}</div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-slate-100 px-6 py-5"><Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onCopyUrl(file)}><Copy size={15} />Copy URL</Button><Button asChild variant="outline" className="rounded-xl border-slate-200"><a href={file.url} target="_blank" rel="noreferrer"><Download size={15} />Download</a></Button><Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]"><a href={file.url} target="_blank" rel="noreferrer"><LinkIcon size={15} />Open File</a></Button></DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-700">{value}</p></div>
}