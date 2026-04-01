'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { replyToInquiryAction } from '@/app/dashboard/inquiries/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { InquiryRecord } from '@/lib/inquiries-types'

export default function InquiryReplyBox({ inquiry, onReplied }: { inquiry: InquiryRecord; onReplied: (inquiry: InquiryRecord) => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleReply() {
    startTransition(async () => {
      const result = await replyToInquiryAction(inquiry.id, message)
      if (!result.success || !result.data) {
        toast({ title: 'Reply failed', description: result.message, variant: 'destructive' })
        return
      }

      onReplied(result.data)
      router.refresh()
      setMessage('')
      toast({ title: 'Reply sent', description: 'The inquiry was marked as replied. Connect an email or messaging provider to deliver outbound replies.' })
    })
  }

  return <div className="space-y-3"><Label>Reply</Label><Textarea className="min-h-32" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your reply to the buyer here." /><Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleReply} disabled={isPending}><Send size={15} />Send Reply</Button></div>
}