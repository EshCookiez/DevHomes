'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  Edit3,
  FileText,
  Mail,
  Phone,
  Search,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { fetchFranchiseMembers, updateMemberRecordAction } from './actions'

type StatusFilter = 'all' | 'active' | 'inactive' | 'onboarding'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchFranchiseMembers()
      setMembers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleEdit = (member: any) => {
    const fullName = member.fullName ?? ''
    const [firstName, ...remaining] = fullName.split(' ')

    setSelectedMember(member)
    setFname(firstName || '')
    setLname(remaining.join(' ') || '')
    setPhone(member.phone || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedMember) return

    try {
      await updateMemberRecordAction(selectedMember.profileId, { fname, lname, phone })
      toast.success('Member record updated.')
      setIsEditing(false)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (statusFilter === 'active') return Boolean(member.isActive)
    if (statusFilter === 'inactive') return !member.isActive
    if (statusFilter === 'onboarding') return Boolean(member.onboardingNote)
    return true
  })

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Member Records</h1>
          <p className="mt-1 font-medium text-slate-500">Maintain office-assigned members and monitor onboarding progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
            {members.filter((member) => member.isActive).length} Active
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-500">
            {members.filter((member) => !member.isActive).length} Inactive
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by member name or email..."
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
          <div className="py-20 text-center font-medium italic text-slate-400">Synchronizing member records...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="space-y-4 py-20 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Users size={24} />
            </div>
            <p className="font-medium text-slate-400">No members match the current filters.</p>
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
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Mail size={12} className="text-slate-400" />
                      {member.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Phone size={12} className="text-slate-400" />
                      {member.phone || 'No phone recorded'}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suboffice</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{member.assignedSuboffice}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invited By</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{member.invitedBy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved By</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{member.approvedBy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joined Date</p>
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <Calendar size={10} className="text-slate-400" />
                          {member.joined ? new Date(member.joined).toLocaleDateString() : 'Not available'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Account: {member.status.replace(/_/g, ' ')}</span>
                      <span className="text-slate-300">|</span>
                      <span>{member.officeName}</span>
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

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Manage Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">First Name</label>
                <Input value={fname} onChange={(event) => setFname(event.target.value)} className="h-11 rounded-xl border-slate-200" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Last Name</label>
                <Input value={lname} onChange={(event) => setLname(event.target.value)} className="h-11 rounded-xl border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Primary Mobile</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 rounded-xl border-slate-200 pl-11" />
              </div>
            </div>
            {selectedMember ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved By</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{selectedMember.approvedBy}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 pt-4 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-[#1428ae] px-8 font-black text-white hover:bg-[#1e3dc4]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
