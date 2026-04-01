'use client'

import { useState, useTransition } from 'react'
import { Building2, Loader2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createDeveloperAction, uploadDeveloperLogoAction } from '@/app/dashboard/developers/actions'
import { useToast } from '@/hooks/use-toast'
import type { DeveloperFormInput, ManagedDeveloperRecord } from '@/lib/developers-types'
import type { StorageProvider } from '@/lib/storage'

const INITIAL_FORM: DeveloperFormInput = {
  developer_name: '',
  industry: '',
  website_url: '',
  description: '',
}

export default function DeveloperCreateModal({
  onCreated,
}: {
  onCreated: (developer: ManagedDeveloperRecord) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DeveloperFormInput>(INITIAL_FORM)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [provider, setProvider] = useState<StorageProvider>('auto')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setForm(INITIAL_FORM)
    setLogoFile(null)
    setProvider('auto')
  }

  function handleSubmit() {
    startTransition(async () => {
      const created = await createDeveloperAction(form)

      if (!created.success || !created.data) {
        toast({ title: 'Create failed', description: created.message, variant: 'destructive' })
        return
      }

      let resolvedDeveloper = created.data

      if (logoFile) {
        const formData = new FormData()
        formData.set('file', logoFile)
        formData.set('developerId', String(created.data.id))
        formData.set('provider', provider)

        const uploaded = await uploadDeveloperLogoAction(formData)
        if (!uploaded.success || !uploaded.data) {
          toast({ title: 'Logo upload failed', description: uploaded.message, variant: 'destructive' })
        } else {
          resolvedDeveloper = uploaded.data
        }
      }

      onCreated(resolvedDeveloper)
      toast({ title: 'Developer created', description: created.message })
      setOpen(false)
      reset()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
        <Building2 size={15} />
        Add Developer
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Add Developer</DialogTitle>
            <DialogDescription>Create a new developer company record and optionally upload a logo.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Developer Name</Label>
              <Input value={form.developer_name} onChange={(event) => setForm(current => ({ ...current, developer_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(event) => setForm(current => ({ ...current, industry: event.target.value }))} placeholder="Residential, Mixed-Use, Hospitality" />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input value={form.website_url} onChange={(event) => setForm(current => ({ ...current, website_url: event.target.value }))} placeholder="https://developer.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea className="min-h-28" value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Logo Upload</Label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <UploadCloud size={16} className="shrink-0 text-slate-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Storage Provider</Label>
              <Select value={provider} onValueChange={(value: StorageProvider) => setProvider(value)}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="supabase">Supabase Storage</SelectItem>
                  <SelectItem value="s3">S3 Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Building2 size={15} />}
              Create Developer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}