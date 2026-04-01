'use client'

import { format } from 'date-fns'
import InquiryReplyBox from '@/components/inquiries/inquiry-reply-box'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { InquiryRecord } from '@/lib/inquiries-types'

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy h:mm a')
}

export default function InquiryDetailsDrawer({ open, onOpenChange, inquiry, onReplied, canReply = true }: { open: boolean; onOpenChange: (open: boolean) => void; inquiry: InquiryRecord | null; onReplied: (inquiry: InquiryRecord) => void; canReply?: boolean }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white sm:max-w-xl">
        {inquiry ? (
          <>
            <SheetHeader className="border-b border-slate-100 px-6 py-5"><SheetTitle className="text-2xl font-black tracking-tight text-slate-900">{inquiry.subject || 'Inquiry details'}</SheetTitle><SheetDescription>Review the full buyer message and respond from the admin dashboard.</SheetDescription></SheetHeader>
            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2"><DetailCard label="Sender" value={inquiry.sender_name || 'Unknown sender'} /><DetailCard label="Listing" value={inquiry.listing_title || 'Not linked'} /><DetailCard label="Project" value={inquiry.project_name || 'Not linked'} /><DetailCard label="Inquiry Date" value={formatDate(inquiry.created_at)} /></div>
              <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-4 px-5 py-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Status</p><Badge variant="outline" className={`rounded-full ${inquiry.status === 'unread' ? 'border-amber-200 bg-amber-50 text-amber-700' : inquiry.status === 'replied' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : inquiry.status === 'closed' ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{inquiry.status}</Badge></div><div><p className="text-sm font-semibold text-slate-900">Full Message</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{inquiry.message}</p></div></CardContent></Card>
              {canReply ? <Card className="border-slate-200 shadow-sm"><CardContent className="px-5 py-5"><InquiryReplyBox inquiry={inquiry} onReplied={onReplied} /></CardContent></Card> : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-3 text-sm font-semibold text-slate-900">{value}</p></div>
}