'use client'

import { useEffect, useMemo, useState } from 'react'
import { FolderTree, UploadCloud, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

interface UploadQueueItem {
  id: string
  file: File
  progress: number
}

export default function MediaUploadModal({ open, onOpenChange, folderPath, isUploading, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; folderPath: string; isUploading: boolean; onSubmit: (files: File[], folderPath: string) => Promise<boolean> }) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [targetFolder, setTargetFolder] = useState(folderPath)

  useEffect(() => {
    setTargetFolder(folderPath)
  }, [folderPath, open])

  useEffect(() => {
    if (!isUploading || queue.length === 0) return

    const interval = window.setInterval(() => {
      setQueue((current) => current.map((item) => ({ ...item, progress: Math.min(item.progress + 12, 92) })))
    }, 180)

    return () => window.clearInterval(interval)
  }, [isUploading, queue.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    onDrop: (acceptedFiles) => {
      setQueue((current) => [
        ...current,
        ...acceptedFiles.map((file, index) => ({ id: `${file.name}-${file.size}-${Date.now()}-${index}`, file, progress: 0 })),
      ])
    },
  })

  const totalSize = useMemo(() => queue.reduce((sum, item) => sum + item.file.size, 0), [queue])

  async function handleSubmit() {
    const shouldClose = await onSubmit(queue.map((item) => item.file), targetFolder)
    if (!shouldClose) {
      return
    }

    setQueue((current) => current.map((item) => ({ ...item, progress: 100 })))
    setTimeout(() => {
      setQueue([])
      onOpenChange(false)
    }, 180)
  }

  function removeItem(id: string) {
    setQueue((current) => current.filter((item) => item.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-xl border-slate-200 p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Drag files into the dropzone or browse from your device. Uploads default to the current folder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label>Destination Folder</Label>
            <div className="relative">
              <FolderTree size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={targetFolder} onChange={(event) => setTargetFolder(event.target.value)} className="h-11 rounded-xl border-slate-200 pl-10" placeholder="media/uploads" />
            </div>
          </div>
          <div {...getRootProps()} className={`rounded-xl border border-dashed px-6 py-10 text-center transition ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            <input {...getInputProps()} />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm"><UploadCloud size={24} className="text-[#1428ae]" /></div>
            <p className="mt-4 text-lg font-semibold text-slate-900">{isDragActive ? 'Drop files to upload' : 'Drag and drop files here'}</p>
            <p className="mt-1 text-sm text-slate-500">Supports images, documents, and optional video uploads. Multiple files are allowed.</p>
            <Button type="button" variant="outline" className="mt-4 rounded-xl border-slate-200">Choose Files</Button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><p className="text-sm font-semibold text-slate-900">Upload Queue</p><p className="text-xs text-slate-500">{queue.length} files • {(totalSize / (1024 * 1024)).toFixed(2)} MB</p></div>
            <div className="max-h-72 space-y-4 overflow-y-auto px-5 py-4">
              {queue.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="line-clamp-1 font-semibold text-slate-900">{item.file.name}</p><p className="text-xs text-slate-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p></div><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeItem(item.id)} disabled={isUploading}><X size={14} /></Button></div>
                  <Progress value={item.progress} className="mt-3 h-2 bg-slate-200" />
                </div>
              ))}
              {queue.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">No files selected yet.</div> : null}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-slate-100 px-6 py-5"><Button variant="outline" className="rounded-xl border-slate-200" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isUploading || queue.length === 0}>{isUploading ? 'Uploading...' : 'Upload Files'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}