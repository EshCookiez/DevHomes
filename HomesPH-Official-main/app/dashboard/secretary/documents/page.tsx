'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  Eye,
  FileText,
  Search,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  deleteDocumentAction,
  fetchFranchiseDocuments,
  uploadSecretaryDocumentAction,
} from './actions'
import { fetchFranchiseMembers } from '@/app/dashboard/secretary/members/actions'

type DocumentRecord = {
  id: string
  name: string
  owner: string
  ownerProfileId: string
  type: string
  category: string
  uploadedAt: string
  url: string
}

type MemberOption = {
  profileId: string
  fullName: string
}

function getPreviewKind(document: DocumentRecord | null) {
  if (!document) return 'none'
  const source = `${document.name} ${document.url}`.toLowerCase()

  if (source.includes('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif|avif)/.test(source)) return 'image'
  return 'external'
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadMemberId, setUploadMemberId] = useState('')
  const [uploadDocumentType, setUploadDocumentType] = useState('valid_id')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [documents, memberRecords] = await Promise.all([
        fetchFranchiseDocuments(),
        fetchFranchiseMembers(),
      ])

      setDocs(documents)
      setMembers(
        memberRecords.map((member: any) => ({
          profileId: member.profileId,
          fullName: member.fullName,
        })),
      )

      if (!uploadMemberId && memberRecords[0]?.profileId) {
        setUploadMemberId(memberRecords[0].profileId)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredDocs = useMemo(
    () =>
      docs.filter((doc) =>
        (doc.name?.toLowerCase().includes(search.toLowerCase()) || doc.owner.toLowerCase().includes(search.toLowerCase())) &&
        (filterType === 'all' || doc.type === filterType),
      ),
    [docs, filterType, search],
  )

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this document record?')) return

    try {
      await deleteDocumentAction(id)
      toast.success('Document record removed.')
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleUpload = async () => {
    if (!uploadMemberId) {
      toast.error('Select a member first.')
      return
    }

    if (!uploadFile) {
      toast.error('Choose a file to upload.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('userProfileId', uploadMemberId)
      formData.append('documentType', uploadDocumentType)
      formData.append('file', uploadFile)

      const result = await uploadSecretaryDocumentAction(formData)
      toast.success(result.message)
      setUploadFile(null)
      setIsUploadDialogOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const previewKind = getPreviewKind(selectedDoc)

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Document Center</h1>
          <p className="mt-1 font-medium text-slate-500">Manage member IDs, licenses, and office onboarding requirements.</p>
        </div>
        <Button
          type="button"
          onClick={() => setIsUploadDialogOpen(true)}
          className="h-10 rounded-xl bg-[#1428ae] font-black text-white shadow-md hover:bg-[#1e3dc4]"
        >
          <Upload size={16} className="mr-2" />
          Upload Record
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by file name or member name..."
            className="h-11 rounded-xl border-slate-200 bg-white pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1428ae]/20"
        >
          <option value="all">All Types</option>
          <option value="valid_id">Valid ID</option>
          <option value="license">PRC License</option>
          <option value="contract">Contract / MOU</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center font-medium italic text-slate-400">Scanning document records...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full space-y-4 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <FileText size={24} />
            </div>
            <p className="font-medium text-slate-400">No documents found.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="overflow-hidden border-slate-200 transition-all hover:shadow-lg">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1428ae] shadow-sm">
                    <FileText size={20} />
                  </div>
                  <Badge variant="outline" className="border-slate-200 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {doc.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <CardTitle className="truncate text-sm font-black text-slate-900">{doc.name}</CardTitle>
                <CardDescription className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {doc.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 font-bold">
                    <User size={12} className="text-slate-400" />
                    {doc.owner}
                  </span>
                  <span className="text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 shadow-none hover:bg-slate-100"
                  >
                    <Eye size={14} className="mr-2" />
                    View Preview
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg border-slate-200 text-xs font-bold">
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      <Download size={14} className="mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDelete(doc.id)}
                    className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Upload Office Document</DialogTitle>
            <DialogDescription>Add a member document that stays accessible from the Secretary review flow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Member</label>
              <select
                value={uploadMemberId}
                onChange={(event) => setUploadMemberId(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.profileId} value={member.profileId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Document Type</label>
              <select
                value={uploadDocumentType}
                onChange={(event) => setUploadDocumentType(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="valid_id">Valid ID</option>
                <option value="license">PRC License</option>
                <option value="contract">Contract / MOU</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">File</label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="h-11 rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500">PDF and image files up to 15MB are supported.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpload} disabled={isUploading} className="bg-[#1428ae] text-white hover:bg-[#1e3dc4]">
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDoc)} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name ?? 'Document Preview'}</DialogTitle>
            <DialogDescription>
              {selectedDoc ? `${selectedDoc.owner} • ${selectedDoc.type.replace(/_/g, ' ')}` : 'Preview the selected document.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            {previewKind === 'image' && selectedDoc ? (
              <img src={selectedDoc.url} alt={selectedDoc.name} className="mx-auto h-auto max-w-full rounded-lg" />
            ) : null}
            {previewKind === 'pdf' && selectedDoc ? (
              <iframe src={selectedDoc.url} title={selectedDoc.name} className="h-[65vh] w-full rounded-lg bg-white" />
            ) : null}
            {previewKind === 'external' && selectedDoc ? (
              <div className="space-y-3 p-6 text-center">
                <p className="text-sm text-slate-600">This file type cannot be previewed inline yet.</p>
                <Button asChild>
                  <a href={selectedDoc.url} target="_blank" rel="noreferrer">
                    Open Document
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            {selectedDoc ? (
              <Button asChild variant="outline">
                <a href={selectedDoc.url} target="_blank" rel="noreferrer">
                  <Download size={14} className="mr-2" />
                  Download
                </a>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
