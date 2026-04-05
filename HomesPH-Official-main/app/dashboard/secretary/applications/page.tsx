'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ClipboardList, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Eye,
  FileText,
  User,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CorrectionRequestDialog } from '@/components/secretary/correction-request-dialog'
import { 
  getPendingFranchiseAgents, 
  markAgentAsReviewed, 
  notifyOwnerReadyForApproval,
  sendApplicationReminder,
  returnAgentForCorrection 
} from '@/app/dashboard/secretary/actions'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ApplicationsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'correction'>('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getPendingFranchiseAgents()
      setAgents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReview = async (id: string) => {
    setBusyId(id)
    try {
      const result = await markAgentAsReviewed(id)
      toast.success(result.message)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleCorrection = async (id: string, reason: string) => {
    setBusyId(id)
    try {
      const result = await returnAgentForCorrection(id, reason)
      toast.success(result.message)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
      throw err
    } finally {
      setBusyId(null)
    }
  }

  const handleReminder = async (id: string) => {
    setBusyId(id)
    try {
      const result = await sendApplicationReminder(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleOwnerNotice = async (id: string) => {
    setBusyId(id)
    try {
      const result = await notifyOwnerReadyForApproval(id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.full_name.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'pending') return a.account_status === 'pending_approval'
    if (filter === 'under_review') return a.account_status === 'under_review'
    if (filter === 'correction') return a.account_status === 'correction_required'
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Application Review Desk</h1>
          <p className="text-slate-500 font-medium mt-1">Verify new agent registrations and document completeness.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
             {agents.filter(a => a.account_status === 'pending_approval').length} New
           </Badge>
           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">
             {agents.filter(a => a.account_status === 'under_review').length} Reviewed
           </Badge>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by agent name or email..." 
            className="pl-11 h-11 rounded-xl border-slate-200 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <Button 
            variant={filter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={`h-9 px-4 rounded-lg font-bold text-xs ${filter === 'all' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            onClick={() => setFilter('all')}
          >All</Button>
          <Button 
            variant={filter === 'pending' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={`h-9 px-4 rounded-lg font-bold text-xs ${filter === 'pending' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            onClick={() => setFilter('pending')}
          >Pending</Button>
          <Button 
            variant={filter === 'under_review' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={`h-9 px-4 rounded-lg font-bold text-xs ${filter === 'under_review' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            onClick={() => setFilter('under_review')}
          >Reviewed</Button>
          <Button 
            variant={filter === 'correction' ? 'secondary' : 'ghost'} 
            size="sm" 
            className={`h-9 px-4 rounded-lg font-bold text-xs ${filter === 'correction' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            onClick={() => setFilter('correction')}
          >Correction</Button>
        </div>
      </div>

      {/* ── Table / Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
           <div className="py-20 text-center text-slate-400 font-medium italic">Scanning applications...</div>
        ) : filteredAgents.length === 0 ? (
           <div className="py-20 text-center space-y-4">
             <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
               <ClipboardList size={24} />
             </div>
             <p className="text-slate-400 font-medium">No applications found in this category.</p>
           </div>
        ) : filteredAgents.map(agent => (
          <Card key={agent.id} className="border-slate-200 hover:shadow-md transition-shadow group overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1428ae]/5 flex items-center justify-center text-[#1428ae] shrink-0">
                  <User size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 leading-none">{agent.full_name}</h3>
                    {agent.account_status === 'pending_approval' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase">Pending Review</Badge>}
                    {agent.account_status === 'under_review' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-black uppercase">Reviewed by Sec</Badge>}
                    {agent.account_status === 'correction_required' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[10px] font-black uppercase">Correction Required</Badge>}
                  </div>
                  <p className="text-sm font-medium text-slate-500">{agent.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{agent.role}</span>
                    <span className="text-slate-300">•</span>
                    <span>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                  </div>
                  {agent.rejection_reason && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2">
                      <AlertCircle className="text-rose-600 mt-0.5" size={14} />
                      <p className="text-xs text-rose-700 italic">"Correction: {agent.rejection_reason}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="h-9 font-bold text-xs border-slate-200">
                  <Link href={`/dashboard/profile/${agent.id}`}>
                    <FileText size={14} className="mr-2" />
                    View Docs
                  </Link>
                </Button>
                
                {agent.account_status === 'pending_approval' ? (
                  <div className="flex items-center gap-2">
                    <CorrectionRequestDialog
                      applicantName={agent.full_name}
                      isSubmitting={busyId === agent.id}
                      onSubmit={(feedback) => handleCorrection(agent.id, feedback)}
                    >
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        disabled={busyId === agent.id}
                        className="h-9 font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <AlertCircle size={14} className="mr-2" />
                        Request Correction
                      </Button>
                    </CorrectionRequestDialog>
                    <Button 
                      onClick={() => handleReview(agent.id)}
                      disabled={busyId === agent.id}
                      size="sm" 
                      className="h-9 font-bold text-xs bg-[#1428ae] hover:bg-[#1e3dc4] text-white"
                    >
                      <CheckCircle2 size={14} className="mr-2" />
                      {busyId === agent.id ? 'Updating...' : 'Mark as Reviewed'}
                    </Button>
                  </div>
                ) : agent.account_status === 'correction_required' ? (
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="h-9 font-bold text-xs text-slate-500 border-slate-200"
                     disabled
                   >
                     Awaiting Re-submission
                   </Button>
                ) : (
                  <Button 
                     variant="outline" 
                     size="sm" 
                     className="h-9 font-bold text-xs text-emerald-600 border-emerald-100 bg-emerald-50 pointer-events-none"
                  >
                     <CheckCircle2 size={14} className="mr-2" />
                     Ready for Final Approval
                  </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400" disabled={busyId === agent.id}>
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => handleReminder(agent.id)}
                        disabled={busyId === agent.id || agent.account_status !== 'correction_required'}
                      >
                        {busyId === agent.id && agent.account_status === 'correction_required' ? 'Sending...' : 'Send Reminder Email'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleOwnerNotice(agent.id)}
                        disabled={busyId === agent.id || agent.account_status !== 'under_review'}
                      >
                        {busyId === agent.id && agent.account_status === 'under_review' ? 'Sending...' : 'Notify Final Approver'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  )
}
