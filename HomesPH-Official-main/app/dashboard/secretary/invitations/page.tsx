'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Link2,
  Loader2,
  Mail,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  cancelInvitationAction,
  createCompanyInvitationAction,
  fetchCompanyInvitations,
  removeInvitationAction,
  resendInvitationAction,
} from './actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface CompanyInvitation {
  id: string
  email: string
  invited_role: string
  status: string
  expires_at: string
}

type InvitationFeedback = {
  title: string
  message: string
  type: 'success' | 'error'
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<InvitationFeedback | null>(null)

  const loadData = async () => {
    try {
      const data = await fetchCompanyInvitations()
      setInvitations(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const getInviteStatus = (invite: CompanyInvitation) => {
    if (invite.status === 'pending' && new Date(invite.expires_at).getTime() < Date.now()) {
      return 'expired'
    }

    return invite.status
  }

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!emailInput) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createCompanyInvitationAction(emailInput, 'salesperson')
      await loadData()

      if (result.success) {
        setFeedback({
          type: 'success',
          title: 'Invitation sent',
          message: result.message,
        })
        toast.success(result.message)
        setEmailInput('')
        return
      }

      setFeedback({
        type: 'error',
        title: 'Invitation failed',
        message: result.message,
      })
      toast.error(result.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create invitation.'
      setFeedback({
        type: 'error',
        title: 'Invitation failed',
        message,
      })
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async (invite: CompanyInvitation) => {
    setBusyInvitationId(invite.id)

    try {
      const result = await resendInvitationAction(invite.id)

      if (result.success) {
        setFeedback({
          type: 'success',
          title: 'Invitation resent',
          message: result.message,
        })
        toast.success(result.message)
      } else {
        setFeedback({
          type: 'error',
          title: 'Resend failed',
          message: result.message,
        })
        toast.error(result.message)
      }

      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend invitation.'
      setFeedback({
        type: 'error',
        title: 'Resend failed',
        message,
      })
      toast.error(message)
    } finally {
      setBusyInvitationId(null)
    }
  }

  const handleCancel = async (invite: CompanyInvitation) => {
    if (!window.confirm(`Cancel the invitation for ${invite.email}?`)) {
      return
    }

    setBusyInvitationId(invite.id)

    try {
      const result = await cancelInvitationAction(invite.id)
      setFeedback({
        type: 'success',
        title: 'Invitation cancelled',
        message: result.message,
      })
      toast.success(result.message)
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to cancel invitation.'
      setFeedback({
        type: 'error',
        title: 'Cancel failed',
        message,
      })
      toast.error(message)
    } finally {
      setBusyInvitationId(null)
    }
  }

  const handleRemove = async (invite: CompanyInvitation) => {
    if (!window.confirm(`Remove the invitation record for ${invite.email}? This cannot be undone.`)) {
      return
    }

    setBusyInvitationId(invite.id)

    try {
      const result = await removeInvitationAction(invite.id)
      setFeedback({
        type: 'success',
        title: 'Invitation removed',
        message: result.message,
      })
      toast.success(result.message)
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove invitation.'
      setFeedback({
        type: 'error',
        title: 'Remove failed',
        message,
      })
      toast.error(message)
    } finally {
      setBusyInvitationId(null)
    }
  }

  const filteredInvites = invitations.filter((invite) =>
    invite.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Invitations</h1>
          <p className="mt-1 font-medium text-slate-500">Send and track recruitment links for new agents.</p>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-white px-3 py-1 font-bold text-slate-500">
          {invitations.length} Total Sent
        </Badge>
      </div>

      <Card className="overflow-hidden border-[#1428ae]/10 bg-gradient-to-br from-white to-slate-50 shadow-lg shadow-slate-200/50">
        <CardContent className="pt-6">
          {feedback ? (
            <Alert
              variant={feedback.type === 'error' ? 'destructive' : 'default'}
              className={`mb-5 rounded-xl ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 /> : <AlertTriangle />}
              <AlertTitle>{feedback.title}</AlertTitle>
              <AlertDescription className={feedback.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}>
                {feedback.message}
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleCreateInvite} className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Enter new agent's email address..."
                className="h-12 rounded-xl border-slate-200 bg-white pl-11"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                type="email"
                required
              />
            </div>
            <Button
              disabled={isSubmitting}
              className="h-12 rounded-xl bg-[#1428ae] px-6 font-black text-white shadow-md transition-all hover:bg-[#1e3dc4]"
            >
              <UserPlus size={18} className="mr-2" />
              {isSubmitting ? 'Sending...' : 'Invite Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 text-amber-700" size={16} />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-amber-900">Why &quot;Auth Session Missing&quot; Happens</p>
          <p className="max-w-4xl text-xs leading-relaxed text-amber-800">
            Secretary invites use the real Supabase account-creation invite flow. Another browser is not required.
            The invited agent can complete the setup in the same browser after signing out the secretary account first.
            The important part is opening the latest invitation email link so the callback can establish the invited
            auth session before the form is submitted.
          </p>
          <p className="text-xs font-medium text-amber-800">
            If the error still appears, resend the invite and use the newest email link. Incognito or another browser is only a fallback for avoiding mixed account sessions.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 py-4">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Invitations</CardTitle>
            <CardDescription className="text-xs">Track pending invites, resend access, or cancel outdated links.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Search by email..."
              className="h-9 rounded-lg border-slate-200 bg-white pl-9 text-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-20 text-center font-medium italic text-slate-400">Loading invitations...</div>
            ) : filteredInvites.length === 0 ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                  <Link2 size={24} />
                </div>
                <p className="font-medium text-slate-400">No invitations found.</p>
              </div>
            ) : (
              filteredInvites.map((invite) => {
                const status = getInviteStatus(invite)
                const isBusy = busyInvitationId === invite.id

                return (
                  <div
                    key={invite.id}
                    className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-600'
                            : status === 'expired'
                              ? 'bg-rose-50 text-rose-600'
                              : status === 'cancelled'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {status === 'accepted' ? <CheckCircle2 size={18} /> : null}
                        {status === 'expired' ? <XCircle size={18} /> : null}
                        {status === 'cancelled' ? <Ban size={18} /> : null}
                        {status === 'pending' ? <Clock size={18} /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{invite.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {invite.invited_role}
                          </span>
                          <span className="text-slate-300">|</span>
                          <Badge
                            variant="outline"
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              status === 'accepted'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : status === 'expired'
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : status === 'cancelled'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-blue-200 bg-blue-50 text-blue-700'
                            }`}
                          >
                            {status}
                          </Badge>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] text-slate-500">
                            Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status !== 'accepted' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          className="border border-transparent text-xs font-bold text-slate-500 hover:border-slate-200 hover:bg-white hover:text-[#1428ae]"
                          onClick={() => void handleResend(invite)}
                        >
                          {isBusy ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw size={14} className="mr-1.5" />
                          )}
                          Resend
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400" disabled={isBusy}>
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200">
                          {status !== 'accepted' ? (
                            <DropdownMenuItem onClick={() => void handleResend(invite)}>
                              <RefreshCw size={14} />
                              Resend invitation
                            </DropdownMenuItem>
                          ) : null}
                          {status === 'pending' ? (
                            <DropdownMenuItem onClick={() => void handleCancel(invite)}>
                              <Ban size={14} />
                              Cancel invitation
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => void handleRemove(invite)}>
                            <Trash2 size={14} />
                            Remove invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <Link2 className="mt-0.5 text-blue-600" size={16} />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-blue-900">Tracking Logic</p>
          <p className="max-w-3xl text-xs leading-relaxed text-blue-700">
            Invitations are tracked using a secure token behind the Supabase invite email. When an agent completes the
            invited registration flow, the system automatically links them to your franchise. Cancelled invites stop
            working immediately, and expired or cancelled invites can be reissued with the resend action.
          </p>
        </div>
      </div>
    </div>
  )
}
