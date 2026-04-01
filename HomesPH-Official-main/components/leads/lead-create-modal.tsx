'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { createLeadAction, updateLeadAction } from '@/app/dashboard/leads/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { LeadInput, LeadProjectOptionRecord, LeadRecord, LeadStatus, LeadUserOptionRecord } from '@/lib/leads-types'

const INITIAL_FORM: LeadInput = {
  user_profile_id: '',
  project_id: '',
  assigned_to: '',
  source: '',
  lead_score: '',
  notes: '',
  status: 'new',
  last_contacted_at: '',
}

export default function LeadCreateModal({
  users,
  agents,
  projects,
  onSaved,
  triggerLabel = 'Create Lead',
  initialLead,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  users: LeadUserOptionRecord[]
  agents: LeadUserOptionRecord[]
  projects: LeadProjectOptionRecord[]
  onSaved: (lead: LeadRecord) => void
  triggerLabel?: string
  initialLead?: LeadRecord | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}) {
  const { toast } = useToast()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<LeadInput>(initialLead ? {
    user_profile_id: initialLead.user_profile_id ?? '',
    project_id: initialLead.project_id ? String(initialLead.project_id) : '',
    assigned_to: initialLead.assigned_to ?? '',
    source: initialLead.source ?? '',
    lead_score: initialLead.lead_score?.toString() ?? '',
    notes: initialLead.notes ?? '',
    status: initialLead.status,
    last_contacted_at: initialLead.last_contacted_at ?? '',
  } : INITIAL_FORM)

  const open = controlledOpen ?? uncontrolledOpen

  function setOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen)
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
  }

  useEffect(() => {
    setForm(initialLead ? {
      user_profile_id: initialLead.user_profile_id ?? '',
      project_id: initialLead.project_id ? String(initialLead.project_id) : '',
      assigned_to: initialLead.assigned_to ?? '',
      source: initialLead.source ?? '',
      lead_score: initialLead.lead_score?.toString() ?? '',
      notes: initialLead.notes ?? '',
      status: initialLead.status,
      last_contacted_at: initialLead.last_contacted_at ?? '',
    } : INITIAL_FORM)
  }, [initialLead])

  function reset() {
    setForm(initialLead ? {
      user_profile_id: initialLead.user_profile_id ?? '',
      project_id: initialLead.project_id ? String(initialLead.project_id) : '',
      assigned_to: initialLead.assigned_to ?? '',
      source: initialLead.source ?? '',
      lead_score: initialLead.lead_score?.toString() ?? '',
      notes: initialLead.notes ?? '',
      status: initialLead.status,
      last_contacted_at: initialLead.last_contacted_at ?? '',
    } : INITIAL_FORM)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = initialLead
        ? await updateLeadAction(initialLead.id, form)
        : await createLeadAction(form)

      if (!result.success || !result.data) {
        toast({ title: initialLead ? 'Update failed' : 'Create failed', description: result.message, variant: 'destructive' })
        return
      }

      onSaved(result.data)
      toast({ title: initialLead ? 'Lead updated' : 'Lead created', description: result.message })
      setOpen(false)
      if (!initialLead) reset()
    })
  }

  return (
    <>
      {!hideTrigger ? <Button onClick={() => setOpen(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
        <Plus size={15} />
        {triggerLabel}
      </Button> : null}

      <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset() }}>
        <DialogContent className="max-w-4xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>{initialLead ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
            <DialogDescription>Manage pipeline owner, assignment, source, scoring, and notes.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField label="Lead User" value={form.user_profile_id} onChange={(value) => setForm((current) => ({ ...current, user_profile_id: value }))} options={users.map((user) => ({ value: user.id, label: user.full_name }))} placeholder="Select lead user" />
            <SelectField label="Project" value={form.project_id} onChange={(value) => setForm((current) => ({ ...current, project_id: value }))} options={projects.map((project) => ({ value: String(project.id), label: project.name }))} placeholder="Select project" />
            <SelectField label="Assigned Agent" value={form.assigned_to} onChange={(value) => setForm((current) => ({ ...current, assigned_to: value }))} options={agents.map((agent) => ({ value: agent.id, label: agent.full_name }))} placeholder="Select agent" />
            <Field label="Source" value={form.source} onChange={(value) => setForm((current) => ({ ...current, source: value }))} />
            <Field label="Lead Score" value={form.lead_score} onChange={(value) => setForm((current) => ({ ...current, lead_score: value }))} />
            <SelectField label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value as LeadStatus }))} options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'qualified', label: 'Qualified' }, { value: 'proposal_sent', label: 'Proposal Sent' }, { value: 'negotiation', label: 'Negotiation' }, { value: 'closed_won', label: 'Closed Won' }, { value: 'closed_lost', label: 'Closed Lost' }]} placeholder="Select status" />
            <Field label="Last Contacted" type="datetime-local" value={form.last_contacted_at} onChange={(value) => setForm((current) => ({ ...current, last_contacted_at: value }))} />
            <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea className="min-h-28" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isPending}>{isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{initialLead ? 'Save Lead' : 'Create Lead'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}