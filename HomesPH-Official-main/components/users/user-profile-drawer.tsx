'use client'

import { useEffect, useState } from 'react'
import { getAccountStatusLabel, normalizeAccountStatus, roleUsesTeamOwnerApproval, type AccountStatus } from '@/lib/account-status'
import { getPrcStatusDescription, getPrcStatusLabel } from '@/lib/prc-status'
import { format } from 'date-fns'
import { CalendarDays, ExternalLink, FileText, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { ManagedUserRecord } from '@/lib/users-types'
import { getUserDocumentUrl } from '@/app/dashboard/users/actions'

function formatDate(value: string | null) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Not available' : format(parsed, 'MMM d, yyyy')
}

function getInitials(user: ManagedUserRecord) {
  const source = user.full_name?.trim() || user.email
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getStatusBadgeClass(status: AccountStatus) {
  switch (status) {
    case 'pending_approval':
      return 'rounded-full border-amber-200 bg-amber-50 text-amber-700'
    case 'rejected':
      return 'rounded-full border-rose-200 bg-rose-50 text-rose-700'
    case 'manually_disabled':
      return 'rounded-full border-slate-200 bg-slate-100 text-slate-600'
    default:
      return 'rounded-full border-emerald-200 bg-emerald-50 text-emerald-700'
  }
}

function getVisibleAccountStatusLabel(user: ManagedUserRecord) {
  const status = normalizeAccountStatus(user.account_status, user.is_active)

  if (status === 'pending_approval' && roleUsesTeamOwnerApproval(user.role)) {
    return 'Pending Team Approval'
  }

  return getAccountStatusLabel(user.account_status, user.is_active)
}

export default function UserProfileDrawer({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUserRecord | null
}) {
  const status = user ? normalizeAccountStatus(user.account_status, user.is_active) : null
  const [idDocUrl, setIdDocUrl] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setIdDocUrl(null)
      return
    }
    setLoadingDoc(true)
    getUserDocumentUrl(user.id).then((url) => {
      setIdDocUrl(url)
      setLoadingDoc(false)
    })
  }, [user?.id])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto h-full w-full max-w-xl border-l border-slate-200 bg-white">
        <DrawerHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DrawerTitle>User Profile</DrawerTitle>
          <DrawerDescription>View core account details, identity, and access role information.</DrawerDescription>
        </DrawerHeader>

        {user ? (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <Avatar className="h-20 w-20 rounded-3xl">
                <AvatarImage src={user.profile_image_url ?? undefined} alt={user.full_name ?? user.email} />
                <AvatarFallback className="rounded-xl bg-slate-900 text-lg font-bold text-white">{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{user.full_name}</h2>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{(user.role ?? 'unknown').replace(/_/g, ' ')}</Badge>
                  <Badge variant="outline" className={getStatusBadgeClass(status ?? 'approved')}>
                    {getVisibleAccountStatusLabel(user)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailCard icon={Mail} label="Email" value={user.email} />
              <DetailCard icon={ShieldCheck} label="Role" value={(user.role ?? 'Not assigned').replace(/_/g, ' ')} />
              <DetailCard icon={ShieldCheck} label="Account Status" value={getVisibleAccountStatusLabel(user)} />
              <DetailCard icon={FileText} label="PRC Number" value={user.prc_number?.trim() || 'Not provided'} />
              <DetailCard icon={ShieldCheck} label="PRC Status" value={getPrcStatusLabel(user.prc_status, user.role, user.prc_number)} />
              <DetailCard icon={UserRound} label="Gender" value={user.gender ? user.gender.replace(/_/g, ' ') : 'Not set'} />
              <DetailCard icon={CalendarDays} label="Birthday" value={formatDate(user.birthday)} />
              <DetailCard icon={CalendarDays} label="Last Reviewed" value={formatDate(user.reviewed_at)} />
              <DetailCard icon={CalendarDays} label="PRC Reviewed" value={formatDate(user.prc_reviewed_at)} />
              <DetailCard icon={CalendarDays} label="Account Created" value={formatDate(user.auth_created_at ?? user.created_at)} />
              <DetailCard icon={CalendarDays} label="Last Login" value={formatDate(user.last_sign_in_at)} />
            </div>

            {user.rejection_reason ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Rejection Reason</p>
                <p className="mt-2 text-sm text-rose-800">{user.rejection_reason}</p>
              </div>
            ) : null}

            {/* ── Valid ID Document ── */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">PRC Verification</p>
              <p className="mt-2 text-sm text-slate-700">
                {getPrcStatusDescription(user.prc_status, user.role, user.prc_number, user.prc_rejection_reason)}
              </p>
              {user.prc_rejection_reason ? (
                <p className="mt-3 text-sm text-rose-700">
                  <span className="font-semibold">PRC note:</span> {user.prc_rejection_reason}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <FileText size={14} />
                Valid ID / Identity Document
              </div>
              {loadingDoc ? (
                <p className="text-sm text-slate-400 animate-pulse">Loading document…</p>
              ) : idDocUrl ? (
                <div className="space-y-2">
                  {/* If it's an image, show inline preview */}
                  {/\.(jpg|jpeg|png|webp|gif)$/i.test(idDocUrl) ? (
                    <a href={idDocUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={idDocUrl}
                        alt="Valid ID"
                        className="w-full rounded-lg border border-slate-200 object-cover max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ) : null}
                  <a
                    href={idDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-[#0c1f4a] hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Full Document
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No ID document uploaded.</p>
              )}
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
