'use client'

import { FolderPlus, Grid2X2, List, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MediaFileFilter, MediaViewMode } from '@/lib/media-types'
import type { StorageProvider } from '@/lib/storage'

export default function MediaToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  provider,
  onProviderChange,
  currentFolder,
  onUploadClick,
  onCreateFolderClick,
}: {
  search: string
  onSearchChange: (value: string) => void
  filter: MediaFileFilter
  onFilterChange: (value: MediaFileFilter) => void
  viewMode: MediaViewMode
  onViewModeChange: (value: MediaViewMode) => void
  provider: StorageProvider
  onProviderChange: (value: StorageProvider) => void
  currentFolder: string | null
  onUploadClick: () => void
  onCreateFolderClick: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search files or folders" className="h-11 rounded-xl border-slate-200 pl-10" />
          </div>
          <Select value={filter} onValueChange={(value) => onFilterChange(value as MediaFileFilter)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="documents">Documents</SelectItem>
              <SelectItem value="videos">Videos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={provider} onValueChange={(value) => onProviderChange(value as StorageProvider)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Storage source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto Detect</SelectItem>
              <SelectItem value="supabase">Supabase Storage</SelectItem>
              <SelectItem value="s3">S3 Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as MediaViewMode)}>
            <TabsList className="rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="grid" className="rounded-xl"><Grid2X2 size={16} />Grid</TabsTrigger>
              <TabsTrigger value="list" className="rounded-xl"><List size={16} />List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="rounded-xl border-slate-200" onClick={onCreateFolderClick}><FolderPlus size={16} />Create Folder</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={onUploadClick}><Upload size={16} />Upload File</Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Current folder: {currentFolder || 'All folders'}</p>
    </div>
  )
}