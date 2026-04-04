'use client'

import { useState } from 'react'
import { Link2, Copy, Plus, Hash, Check, Loader2, UserPlus, Trash2 } from 'lucide-react'
import { createVanityCode, deleteVanityCode } from '@/components/dashboard/ambassador/actions'
import { toast } from 'sonner'

interface ReferralCode {
  id: number
  code: string
  is_active: boolean
  clicks: number
  conversions: number
  recruit_salesperson_clicks: number
  recruit_franchise_clicks: number
}

interface RecruitmentStats {
  salesperson: { total: number; approved: number }
  franchise: { total: number; approved: number }
}

export default function LinksDashboardClient({
  initialCodes,
  ambassadorId,
  recruitmentStats,
}: {
  initialCodes: ReferralCode[]
  ambassadorId: string | null
  recruitmentStats?: RecruitmentStats
}) {
  const [codes, setCodes] = useState<ReferralCode[]>(initialCodes)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  
  // New Code Modal State
  const [showModal, setShowModal] = useState(false)
  const [newCodeVal, setNewCodeVal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(text)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDeleteCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vanity code? Tracking for this code will stop immediately.')) return

    setIsDeleting(id)
    const result = await deleteVanityCode(id)
    setIsDeleting(null)

    if (result.success) {
      setCodes(codes.filter(c => c.id !== id))
      toast.success('Code deleted successfully')
    } else {
      toast.error(result.message || 'Error deleting code')
    }
  }

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const trimmed = newCodeVal.trim().toUpperCase()
    
    if (trimmed.length < 4 || trimmed.length > 20) {
      setErrorMsg('Code must be between 4 and 20 characters.')
      return
    }

    setIsSubmitting(true)
    const result = await createVanityCode(trimmed)
    setIsSubmitting(false)

    if (!result.success) {
      setErrorMsg(result.message || 'Error creating code')
      return
    }

    // Success
    setCodes([{
      id: Date.now(),
      code: trimmed,
      is_active: true,
      clicks: 0,
      conversions: 0,
      recruit_salesperson_clicks: 0,
      recruit_franchise_clicks: 0,
    }, ...codes])
    
    setNewCodeVal('')
    setShowModal(false)
  }

  const buildProjectLink = (slug: string) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://homesph.com'
    return `${domain}/r/${slug}?ref=${ambassadorId || 'unknown'}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Links & Custom Codes</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your referral links and track how your vanity codes are performing offline and online.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Custom Vanity Code - FEATURED SIDEBAR STYLE */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#1428ae] to-[#0c1f4a] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Hash size={16} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100/80">Your Identity</p>
              </div>

              {codes.length === 0 ? (
                <div className="py-2">
                  <h3 className="text-xl font-black mb-2">No Active Code</h3>
                  <p className="text-sm text-blue-100/60 mb-6 leading-relaxed">Create your permanent referral code to start tracking your performance.</p>
                  <button 
                    onClick={() => { setShowModal(true); setErrorMsg(''); setNewCodeVal(''); }}
                    className="w-full py-3 bg-white text-[#1428ae] rounded-xl text-sm font-black shadow-lg hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Create My Code
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter mb-1 uppercase">{codes[0].code}</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live & Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                      <p className="text-2xl font-black">{codes[0].clicks}</p>
                      <p className="text-[10px] uppercase font-bold text-blue-200/60">Total Uses</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                      <p className="text-2xl font-black">{codes[0].conversions}</p>
                      <p className="text-[10px] uppercase font-bold text-blue-200/60">Successes</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleCopy(codes[0].code)}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    {copiedLink === codes[0].code ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />}
                    {copiedLink === codes[0].code ? 'Copied!' : 'Copy Vanity Code'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ambassador Tip</h4>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "Your vanity code is unique to you. Mention it in your social media captions or voiceovers to track offline conversions."
            </p>
          </div>
        </div>

        {/* Recruitment Referral Links - MAIN CONTENT AREA */}
        <div className="xl:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#1428ae]" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">Recruitment & Affiliate Links</p>
                  <p className="text-xs text-slate-500">Invite partners and earn commission overrides.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Salesperson Recruitment */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4 hover:border-blue-200 hover:bg-blue-50/10 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                      <UserPlus size={14} />
                    </div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Salespersons</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-slate-900">{recruitmentStats?.salesperson.total || 0}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Registered</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600">{recruitmentStats?.salesperson.approved || 0}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Approved</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-500 truncate shadow-inner">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/registration/salesperson?affiliate-code=${codes[0]?.code || '...'}`}
                    </div>
                    <button 
                      onClick={() => handleCopy(`${window.location.origin}/registration/salesperson?affiliate-code=${codes[0]?.code || 'YOURCODE'}`)}
                      className="p-3 rounded-xl bg-[#1428ae] text-white hover:bg-[#0c1f4a] transition-all shadow-md shadow-blue-950/10 active:scale-95"
                    >
                      {copiedLink?.includes('salesperson') ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1 font-medium italic">Best for Instagram Bios and Facebook ads.</p>
                </div>
              </div>

              {/* Franchise Recruitment */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                      <Plus size={14} />
                    </div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Franchise Owners</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-slate-900">{recruitmentStats?.franchise.total || 0}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Registered</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600">{recruitmentStats?.franchise.approved || 0}</span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Approved</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-500 truncate shadow-inner">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/registration/franchise?affiliate-code=${codes[0]?.code || '...'}`}
                    </div>
                    <button 
                      onClick={() => handleCopy(`${window.location.origin}/registration/franchise?affiliate-code=${codes[0]?.code || 'YOURCODE'}`)}
                      className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-900 transition-all shadow-md shadow-indigo-950/10 active:scale-95"
                    >
                      {copiedLink?.includes('franchise') ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1 font-medium italic">Direct link for potential business partners.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Clicks</span>
                  <span className="text-sm font-black text-slate-900">{(codes[0]?.recruit_salesperson_clicks || 0) + (codes[0]?.recruit_franchise_clicks || 0)}</span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Partners</span>
                  <span className="text-sm font-black text-emerald-600">{(recruitmentStats?.salesperson.total || 0) + (recruitmentStats?.franchise.total || 0)}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <Check size={10} className="text-emerald-500" />
                Cookie Lifetime: 90 Days
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
