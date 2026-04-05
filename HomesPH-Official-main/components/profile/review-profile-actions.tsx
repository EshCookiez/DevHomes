'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CorrectionRequestDialog } from '@/components/secretary/correction-request-dialog'
import { OwnerRejectionDialog } from '@/components/profile/owner-rejection-dialog'
import {
  ACCOUNT_STATUS_APPROVED,
  ACCOUNT_STATUS_CORRECTION_REQUIRED,
  ACCOUNT_STATUS_PENDING_APPROVAL,
  ACCOUNT_STATUS_REJECTED,
  ACCOUNT_STATUS_UNDER_REVIEW,
  type AccountStatus,
} from '@/lib/account-status'
import { approveAgentAsFranchiseOwner, rejectAgentAsFranchiseOwner } from '@/app/dashboard/franchise/actions'
import { markAgentAsReviewed, returnAgentForCorrection } from '@/app/dashboard/secretary/actions'

type ReviewProfileActionsProps = {
  accountStatus: AccountStatus
  applicantName: string
  profileId: string
  viewerOrganizationRole?: string | null
  viewerRole: string
}

export function ReviewProfileActions({
  accountStatus,
  applicantName,
  profileId,
  viewerOrganizationRole,
  viewerRole,
}: ReviewProfileActionsProps) {
  const router = useRouter()
  const [busyAction, setBusyAction] = useState<'approve' | 'correction' | 'reject' | 'review' | null>(null)
  const canSecretaryFinalApprove =
    viewerRole === 'franchise_secretary' && viewerOrganizationRole === 'main_secretary'

  const handleReview = async () => {
    setBusyAction('review')

    try {
      const result = await markAgentAsReviewed(profileId)
      toast.success(result.message)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark this application as reviewed.'
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleCorrection = async (feedback: string) => {
    setBusyAction('correction')

    try {
      const result = await returnAgentForCorrection(profileId, feedback)
      toast.success(result.message)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request a correction.'
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleApprove = async () => {
    setBusyAction('approve')

    try {
      const result = await approveAgentAsFranchiseOwner(profileId)
      toast.success(result.message)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve this application.'
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleReject = async (reason: string) => {
    setBusyAction('reject')

    try {
      const result = await rejectAgentAsFranchiseOwner(profileId, reason)
      toast.success(result.message)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject this application.'
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  if (canSecretaryFinalApprove) {
    if (
      accountStatus === ACCOUNT_STATUS_PENDING_APPROVAL ||
      accountStatus === ACCOUNT_STATUS_UNDER_REVIEW
    ) {
      return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row md:flex-col md:items-end">
          <CorrectionRequestDialog
            applicantName={applicantName}
            isSubmitting={busyAction === 'correction'}
            onSubmit={handleCorrection}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            >
              <AlertCircle size={14} className="mr-2" />
              Request Correction
            </Button>
          </CorrectionRequestDialog>
          <OwnerRejectionDialog
            applicantName={applicantName}
            isSubmitting={busyAction === 'reject'}
            onSubmit={handleReject}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            >
              <XCircle size={14} className="mr-2" />
              Reject Application
            </Button>
          </OwnerRejectionDialog>
          <Button type="button" size="sm" onClick={handleApprove} disabled={busyAction !== null}>
            <ShieldCheck size={14} className="mr-2" />
            {busyAction === 'approve' ? 'Approving...' : 'Approve Agent'}
          </Button>
        </div>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_CORRECTION_REQUIRED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-slate-200 text-slate-500"
        >
          <Clock3 size={14} className="mr-2" />
          Awaiting Re-submission
        </Button>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_APPROVED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        >
          <ShieldCheck size={14} className="mr-2" />
          Approved
        </Button>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_REJECTED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          <XCircle size={14} className="mr-2" />
          Rejected
        </Button>
      )
    }

    return null
  }

  if (viewerRole === 'franchise_secretary') {
    if (accountStatus === ACCOUNT_STATUS_PENDING_APPROVAL) {
      return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row md:flex-col md:items-end">
          <CorrectionRequestDialog
            applicantName={applicantName}
            isSubmitting={busyAction === 'correction'}
            onSubmit={handleCorrection}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            >
              <AlertCircle size={14} className="mr-2" />
              Request Correction
            </Button>
          </CorrectionRequestDialog>
          <Button type="button" size="sm" onClick={handleReview} disabled={busyAction !== null}>
            <CheckCircle2 size={14} className="mr-2" />
            {busyAction === 'review' ? 'Updating...' : 'Mark as Reviewed'}
          </Button>
        </div>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_CORRECTION_REQUIRED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-slate-200 text-slate-500"
        >
          <Clock3 size={14} className="mr-2" />
          Awaiting Re-submission
        </Button>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_UNDER_REVIEW) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        >
          <CheckCircle2 size={14} className="mr-2" />
          Ready for Final Approval
        </Button>
      )
    }

    return null
  }

  if (viewerRole === 'franchise') {
    if (
      accountStatus === ACCOUNT_STATUS_UNDER_REVIEW ||
      accountStatus === ACCOUNT_STATUS_PENDING_APPROVAL
    ) {
      return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row md:flex-col md:items-end">
          <OwnerRejectionDialog
            applicantName={applicantName}
            isSubmitting={busyAction === 'reject'}
            onSubmit={handleReject}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              className="border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            >
              <XCircle size={14} className="mr-2" />
              Reject Application
            </Button>
          </OwnerRejectionDialog>
          <Button type="button" size="sm" onClick={handleApprove} disabled={busyAction !== null}>
            <ShieldCheck size={14} className="mr-2" />
            {busyAction === 'approve' ? 'Approving...' : 'Approve Agent'}
          </Button>
        </div>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_CORRECTION_REQUIRED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-slate-200 text-slate-500"
        >
          <Clock3 size={14} className="mr-2" />
          Awaiting Agent Correction
        </Button>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_APPROVED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-emerald-100 bg-emerald-50 text-emerald-700"
        >
          <ShieldCheck size={14} className="mr-2" />
          Approved
        </Button>
      )
    }

    if (accountStatus === ACCOUNT_STATUS_REJECTED) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          <XCircle size={14} className="mr-2" />
          Rejected
        </Button>
      )
    }
  }

  return null
}
