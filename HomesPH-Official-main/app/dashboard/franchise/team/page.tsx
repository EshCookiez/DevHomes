'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Calendar,
  Edit3,
  FileText,
  Mail,
  Phone,
  Search,
  UserCheck,
  Users,
  UserX,
  UserPlus,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  fetchFranchiseAssignableOffices,
  fetchFranchiseTeamMembers,
  removeFranchiseMemberAction,
  setFranchiseMemberActiveAction,
  updateFranchiseMemberRecordAction,
} from './actions'

type StatusFilter = 'all' | 'active' | 'inactive' | 'onboarding'

type MemberRecord = Awaited<ReturnType<typeof fetchFranchiseTeamMembers>>[number]
type OfficeOption = Awaited<ReturnType<typeof fetchFranchiseAssignableOffices>>[number]

function getMemberStatusBadgeClass(status: string) {
  switch (status) {
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'under_review':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'correction_required':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'manually_disabled':
      return 'border-slate-300 bg-slate-100 text-slate-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

export default function FranchiseTeamPage() {
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [officeOptions, setOfficeOptions] = useState<OfficeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedOfficeId, setSelectedOfficeId] = useState('')
  const [organizationRole, setOrganizationRole] = useState('agent')
  const [pendingAction, setPendingAction] = useState<'save' | 'status' | 'remove' | null>(null)
  const [statusTarget, setStatusTarget] = useState<MemberRecord | null>(null)
  const [removeTarget, setRemoveTarget] = useState<MemberRecord | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [memberData, officeData] = await Promise.all([
        fetchFranchiseTeamMembers(),
        fetchFranchiseAssignableOffices(),
      ])

      setMembers(memberData)
      setOfficeOptions(officeData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const closeEditor = (force = false) => {
    if (pendingAction && !force) {
      return
    }

    setIsEditing(false)
    setSelectedMember(null)
  }

  const handleEdit = (member: MemberRecord) => {
    const fullName = member.fullName ?? ''
    const [firstName, ...remaining] = fullName.split(' ')

    setSelectedMember(member)
    setFname(firstName || '')
    setLname(remaining.join(' ') || '')
    setPhone(member.phone || '')
    setSelectedOfficeId(String(member.companyId))
    setOrganizationRole(member.organizationRole || 'agent')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedMember) {
      return
    }

    setPendingAction('save')
    try {
      const result = await updateFranchiseMemberRecordAction(selectedMember.profileId, {
        fname,
        lname,
        organizationRole,
        phone,
        targetCompanyId: selectedOfficeId ? Number(selectedOfficeId) : undefined,
      })

      toast.success(result.message)
      closeEditor(true)
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleStatusToggle = async () => {
    if (!statusTarget) {
      return
    }

    setPendingAction('status')
    try {
      const result = await setFranchiseMemberActiveAction(statusTarget.profileId, !statusTarget.isActive)
      toast.success(result.message)
      if (selectedMember?.profileId === statusTarget.profileId) {
        setIsEditing(false)
        setSelectedMember(null)
      }
      setStatusTarget(null)
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPendingAction(null)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) {
      return
    }

    setPendingAction('remove')
    try {
      const result = await removeFranchiseMemberAction(removeTarget.profileId)
      toast.success(result.message)
      if (selectedMember?.profileId === removeTarget.profileId) {
        setIsEditing(false)
        setSelectedMember(null)
      }
      setRemoveTarget(null)
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setPendingAction(null)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.invitedBy.toLowerCase().includes(search.toLowerCase()) ||
      member.assignedSuboffice.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) {
      return false
    }

    if (statusFilter === 'active') {
      return member.isActive
    }

    if (statusFilter === 'inactive') {
      return !member.isActive
    }

    if (statusFilter === 'onboarding') {
      return Boolean(member.onboardingNote)
    }

    return true
  })

  const selectedOffice = officeOptions.find((office) => String(office.id) === selectedOfficeId) ?? null
  const organizationRoleOptions = selectedOffice?.isParent
    ? [
        { label: 'Agent', value: 'agent' },
        { label: 'Main Secretary', value: 'main_secretary' },
      ]
    : [
        { label: 'Agent', value: 'agent' },
        { label: 'Suboffice Secretary', value: 'suboffice_secretary' },
      ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Team</h1>
          <p className="mt-1 font-medium text-slate-500">
            Manage member records, move members across offices, and control access across your franchise scope.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/dashboard/franchise/applications">
              <FileText size={16} className="mr-2" />
              Review Applications
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1428ae] hover:bg-[#1e3dc4]">
            <Link href="/dashboard/franchise/invitations">
              <UserPlus size={16} className="mr-2" />
              Invite Agent
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by member, email, inviter, or office..."
            className="h-11 rounded-xl border-slate-200 bg-white pl-11 shadow-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {([
            ['all', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
            ['onboarding', 'Onboarding'],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? 'secondary' : 'ghost'}
              className={`h-9 rounded-lg px-4 text-xs font-bold ${statusFilter === value ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center font-medium italic text-slate-400">Synchronizing team records...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="space-y-4 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Users size={24} />
            </div>
            <p className="font-medium text-slate-400">No team members match the current filters.</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden border-slate-200 transition-shadow hover:shadow-md">
              <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      member.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {member.isActive ? <UserCheck size={24} /> : <UserX size={24} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black leading-none text-slate-900">{member.fullName}</h3>
                      {member.isCurrentUser ? (
                        <Badge className="border-blue-200 bg-blue-50 px-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-50">
                          Current User
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {member.role}
                      </Badge>
                      <Badge variant="outline" className={`px-2 text-[10px] font-black uppercase tracking-widest ${getMemberStatusBadgeClass(member.status)}`}>
                        {member.statusLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Mail size={12} className="text-slate-400" />
                      {member.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Phone size={12} className="text-slate-400" />
                      {member.phone || 'No phone recorded'}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suboffice</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{member.assignedSuboffice}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invited By</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{member.invitedBy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joined Date</p>
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <Calendar size={10} className="text-slate-400" />
                          {member.joined ? new Date(member.joined).toLocaleDateString() : 'Not available'}
                        </p>
                      </div>
                    </div>
                    {member.onboardingNote ? (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2">
                        <AlertCircle className="mt-0.5 text-amber-600" size={14} />
                        <p className="text-xs text-amber-800">{member.onboardingNote}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="h-9 border-slate-200 text-xs font-bold">
                    <Link href={`/dashboard/profile/${member.profileId}`}>
                      <FileText size={14} className="mr-2" />
                      View Profile
                    </Link>
                  </Button>
                  <Button
                    onClick={() => handleEdit(member)}
                    variant="outline"
                    size="sm"
                    className="h-9 border-slate-200 text-xs font-bold hover:bg-slate-50"
                  >
                    <Edit3 size={14} className="mr-2" />
                    Manage Member
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => !open ? closeEditor() : setIsEditing(true)}>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-2xl p-0 sm:max-w-[1120px] sm:max-h-[92vh] sm:overflow-hidden">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="text-xl font-black text-slate-900">Manage Member</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">
              Update member details, office placement, and franchise responsibility from one wide owner panel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">First Name</label>
                  <Input value={fname} onChange={(event) => setFname(event.target.value)} className="h-11 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Last Name</label>
                  <Input value={lname} onChange={(event) => setLname(event.target.value)} className="h-11 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Primary Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 rounded-xl border-slate-200 pl-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Office</label>
                  <Select
                    value={selectedOfficeId}
                    onValueChange={setSelectedOfficeId}
                    disabled={!selectedMember?.canManagePlacement || pendingAction !== null}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="Select an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {officeOptions.map((office) => (
                        <SelectItem key={office.id} value={String(office.id)}>
                          {office.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Franchise Responsibility</label>
                  <Select
                    value={organizationRole}
                    onValueChange={setOrganizationRole}
                    disabled={!selectedMember?.canManagePlacement || pendingAction !== null}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                      <SelectValue placeholder="Select a franchise responsibility" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationRoleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2 text-xs text-slate-500">
                    <p>
                      Use office assignment to place members into suboffices or transfer them back to the main office.
                    </p>
                    <p>
                      Franchise responsibility controls organization authority only. The member keeps their main app role as salesperson.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {selectedMember ? (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Member Details</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invited By</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.invitedBy}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved By</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.approvedBy}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned By</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.assignedBy}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Suboffice</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.assignedSuboffice}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invitation Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.invitationType}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Owner Actions</p>
                  <div className="mt-3 grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-slate-200"
                      disabled={!selectedMember.canToggleActive || pendingAction !== null}
                      onClick={() => setStatusTarget(selectedMember)}
                    >
                      {selectedMember.isActive ? 'Deactivate Member' : 'Reactivate Member'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                      disabled={!selectedMember.canRemove || pendingAction !== null}
                      onClick={() => setRemoveTarget(selectedMember)}
                    >
                      Remove From Franchise
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Deactivate keeps the record but blocks dashboard access. Remove unlinks the member from this franchise scope.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-between">
            <Button variant="outline" onClick={() => closeEditor()} disabled={pendingAction !== null} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={pendingAction !== null} className="rounded-xl bg-[#1428ae] px-8 font-black text-white hover:bg-[#1e3dc4]">
              {pendingAction === 'save' ? 'Saving...' : 'Save Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && !pendingAction && setStatusTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.isActive ? 'Deactivate member?' : 'Reactivate member?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.isActive
                ? 'This keeps the member record, but blocks dashboard access until you reactivate it.'
                : 'This restores dashboard access for the selected member.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={pendingAction !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={(event) => {
                event.preventDefault()
                void handleStatusToggle()
              }}
            >
              {pendingAction === 'status'
                ? 'Updating...'
                : statusTarget?.isActive
                  ? 'Deactivate Member'
                  : 'Reactivate Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && !pendingAction && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member from franchise?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the member from your franchise scope. If they have no remaining organization memberships, their access will also be disabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={pendingAction !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              onClick={(event) => {
                event.preventDefault()
                void handleRemove()
              }}
            >
              {pendingAction === 'remove' ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
