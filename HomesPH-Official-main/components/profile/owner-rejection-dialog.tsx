'use client'

import { useEffect, useState, type ReactElement } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type OwnerRejectionDialogProps = {
  applicantName: string
  children: ReactElement
  isSubmitting?: boolean
  onSubmit: (reason: string) => Promise<void>
}

export function OwnerRejectionDialog({
  applicantName,
  children,
  isSubmitting = false,
  onSubmit,
}: OwnerRejectionDialogProps) {
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!open && !isSubmitting) {
      setReason('')
      setValidationError('')
    }
  }, [isSubmitting, open])

  const handleSubmit = async () => {
    const trimmedReason = reason.trim()

    if (trimmedReason.length < 10) {
      setValidationError('Add a short reason so the agent understands why the application was not approved.')
      return
    }

    setValidationError('')

    try {
      await onSubmit(trimmedReason)
      setOpen(false)
    } catch {
      // Parent action handler already surfaces the failure.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!isSubmitting ? setOpen(nextOpen) : undefined)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Application</DialogTitle>
          <DialogDescription>
            Tell {applicantName} why the application was not approved. This note will be included in the rejection email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: We could not verify the submitted license details. Please contact the office for guidance."
            rows={5}
            disabled={isSubmitting}
          />
          {validationError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700">
            {isSubmitting ? 'Saving...' : 'Reject Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
