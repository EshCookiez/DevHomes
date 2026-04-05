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

type CorrectionRequestDialogProps = {
  applicantName: string
  children: ReactElement
  isSubmitting?: boolean
  onSubmit: (feedback: string) => Promise<void>
}

export function CorrectionRequestDialog({
  applicantName,
  children,
  isSubmitting = false,
  onSubmit,
}: CorrectionRequestDialogProps) {
  const [feedback, setFeedback] = useState('')
  const [open, setOpen] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!open && !isSubmitting) {
      setFeedback('')
      setValidationError('')
    }
  }, [isSubmitting, open])

  const handleSubmit = async () => {
    const trimmedFeedback = feedback.trim()

    if (trimmedFeedback.length < 10) {
      setValidationError('Add a short explanation so the agent knows exactly what to fix.')
      return
    }

    setValidationError('')

    try {
      await onSubmit(trimmedFeedback)
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
          <DialogTitle>Request Correction</DialogTitle>
          <DialogDescription>
            Tell {applicantName} what needs to be fixed before this application can move forward.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Example: Please re-upload a clearer valid ID photo and add your PRC number."
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
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Correction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
