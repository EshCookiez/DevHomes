'use client'

import { UserPlus, DollarSign, Star, Link2, Copy, Plus, ArrowUpRight, Megaphone, Facebook, Instagram, Share2 } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createCampaign } from '@/components/dashboard/affiliate/actions'

interface ReferralCode {
  id: number
  code: string
  is_active: boolean
  clicks: number
  conversions: number
  recruit_salesperson_clicks: number
  recruit_franchise_clicks: number
}

interface ProjectLink {
  id: number
  title: string
  slug: string
}

interface RecruitmentStats {
  salesperson: { total: number; approved: number }
  franchise: { total: number; approved: number }
}

interface ActivityItem {
  id: string
  title: string
  description: string
  created_at: string
  type: string
}

interface CampaignStat {
  source_name: string
  campaign_name?: string
  clicks: number
  registrations?: number
  code_id: number
  referral_codes?: { code: string } | { code: string }[]
}

export default function AffiliateDashboardClient({
  initialCodes,
  recruitmentStats,
  chartData,
  activities,
  campaignStats,
}: {
  initialCodes: ReferralCode[]
  recruitmentStats?: RecruitmentStats
  chartData: { name: string, value: number }[]
  activities: ActivityItem[]
  campaignStats: CampaignStat[]
}) {
  const { toast } = useToast()
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  
  // Campaign Creator State
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selCode, setSelCode] = useState(initialCodes[0]?.code || '')
  const [selSource, setSelSource] = useState('Facebook')
  const [campaignName, setCampaignName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate totals from codes
  const totalClicksFromCodes = initialCodes.reduce((acc, curr) => acc + (curr.clicks || 0), 0)
  const totalConversionsFromCodes = initialCodes.reduce((acc, curr) => acc + (curr.conversions || 0), 0)

  // Overall Campaign Stats
  const overallCampaignClicks = campaignStats.reduce((acc, curr) => acc + (curr.clicks || 0), 0)
  const overallCampaignRegs = campaignStats.reduce((acc, curr) => acc + (curr.registrations || 0), 0)

  // Platform Breakdown Calculations
  const platformStats = {
    Facebook: campaignStats.filter(s => s.source_name === 'Facebook').reduce((a, c) => a + (c.clicks || 0), 0),
    Instagram: campaignStats.filter(s => s.source_name === 'Instagram').reduce((a, c) => a + (c.clicks || 0), 0),
    TikTok: campaignStats.filter(s => s.source_name === 'TikTok').reduce((a, c) => a + (c.clicks || 0), 0),
  }
  
  const getPlatformPercentage = (clicks: number) => {
    if (overallCampaignClicks === 0) return 0
    return Math.round((clicks / overallCampaignClicks) * 100)
  }
  
  // Total registrations among all codes
  const totalRegistrations = (recruitmentStats?.salesperson.total || 0) + (recruitmentStats?.franchise.total || 0)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(text)
    toast({
      title: "Link Copied",
      description: "Referral link copied to clipboard!",
    })
    setTimeout(() => setCopiedLink(null), 2000)
  }

  // Format activity items for the feed
  const formattedActivities = activities.map(act => ({
    id: act.id,
    title: act.title,
    description: act.description,
    time: new Date(act.created_at).toLocaleDateString(),
    icon: act.type === 'conversion' ? Star : (act.type === 'click' ? Link2 : UserPlus),
    iconColor: act.type === 'conversion' ? 'text-emerald-600' : (act.type === 'click' ? 'text-violet-600' : 'text-blue-600'),
    iconBg: act.type === 'conversion' ? 'bg-emerald-50' : (act.type === 'click' ? 'bg-violet-50' : 'bg-blue-50'),
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-[#1428ae]" />
                <h3 className="text-lg font-black text-slate-900 leading-none">Create Campaign</h3>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Campaign Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Summer Sale Promo"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#1428ae]/20 focus:border-[#1428ae] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Campaign Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Facebook', 'Instagram', 'TikTok', 'Email', 'Twitter', 'Other'].map(src => (
                    <button
                      key={src}
                      onClick={() => setSelSource(src)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                        selSource === src 
                        ? 'bg-[#1428ae] border-[#1428ae] text-white shadow-md shadow-[#1428ae]/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={isSubmitting || initialCodes.length === 0 || !campaignName.trim()}
                  onClick={async () => {
                    if (isSubmitting) return;
                    setIsSubmitting(true)
                    try {
                      const res = await createCampaign(selCode, selSource, campaignName)
                      if (res.success) {
                        toast({
                          title: "Campaign Created",
                          description: res.message,
                        })
                        setCampaignName('') // Clear input
                        setShowCampaignModal(false)
                      } else {
                        toast({
                          title: "Error",
                          description: res.message,
                          variant: "destructive",
                        })
                      }
                    } catch (err) {
                      toast({
                        title: "Error",
                        description: "Failed to create campaign",
                        variant: "destructive",
                      })
                      console.error(err)
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#1428ae] to-[#0c1f4a] text-white text-sm font-bold shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? <Plus className="animate-spin" size={16} /> : <Plus size={16} />}
                  Start Campaign Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Affiliate Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Track your referrals, links, and commission earnings.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          New Referral
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <KpiCard 
          title="Successful Referrals" 
          value={totalConversionsFromCodes.toString()} 
          icon={Star} 
          iconColor="text-emerald-600" 
          iconBg="bg-emerald-50" 
          trend={{ value: 14.2, positive: true }} 
        />
        <KpiCard 
          title="Direct Registrations" 
          value={totalRegistrations.toString()} 
          icon={UserPlus} 
          iconColor="text-blue-600" 
          iconBg="bg-blue-50" 
          description="Salespeople & Franchises"
        />
        <KpiCard 
          title="Campaign Results" 
          value={`${overallCampaignClicks} Clicks / ${overallCampaignRegs} Regs`} 
          icon={Megaphone} 
          iconColor="text-orange-600" 
          iconBg="bg-orange-50" 
          description="Total from all campaigns" 
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Referrals per Month"
          subtitle="Referrals converted from your shared links"
          type="area" data={chartData} dataKey="value" color="#f59e0b"
        />
        <ActivityFeed title="Recent Activity" items={formattedActivities} />
      </div>

      {/* Campaign / Source Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-[#1428ae]" />
              <p className="text-sm font-bold text-slate-900">Campaign Performance</p>
            </div>
            <button 
              onClick={() => setShowCampaignModal(true)}
              className="text-xs font-bold text-[#1428ae] hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              Create Campaign
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {campaignStats.length === 0 ? (
              <div className="px-5 py-12 text-center text-slate-400">
                <p className="text-sm">No campaigns active. Create one to track sources like Facebook or Instagram.</p>
              </div>
            ) : (
              campaignStats.map((stat, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {stat.source_name === 'Facebook' ? <Facebook size={18} /> : 
                       stat.source_name === 'Instagram' ? <Instagram size={18} /> : <Share2 size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{stat.campaign_name || stat.source_name}</p>
                      <p className="text-[11px] text-slate-500">Source: <span className="font-bold">{stat.source_name}</span> | Code: <span className="font-mono font-bold text-[#1428ae]">
                        {Array.isArray(stat.referral_codes) 
                          ? stat.referral_codes[0]?.code 
                          : stat.referral_codes?.code || 'Default'}
                      </span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{stat.clicks}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Clicks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">{stat.registrations || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Regs</p>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
                      <button 
                        onClick={() => {
                          const code = Array.isArray(stat.referral_codes) ? stat.referral_codes[0]?.code : (typeof stat.referral_codes === 'object' && stat.referral_codes !== null ? (stat.referral_codes as any).code : '')
                          const url = new URL(`${origin || 'https://homesph.com'}/registration/salesperson`)
                          url.searchParams.set('ref', code)
                          if (stat.campaign_name) url.searchParams.set('campaign', stat.campaign_name)
                          // Source is hidden as per request
                          handleCopy(url.toString())
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Copy Salesperson Link"
                      >
                        <Copy size={12} />
                        SALESPERSON
                      </button>
                      <button 
                        onClick={() => {
                          const code = Array.isArray(stat.referral_codes) ? stat.referral_codes[0]?.code : (typeof stat.referral_codes === 'object' && stat.referral_codes !== null ? (stat.referral_codes as any).code : '')
                          const url = new URL(`${origin || 'https://homesph.com'}/registration/franchise`)
                          url.searchParams.set('ref', code)
                          if (stat.campaign_name) url.searchParams.set('campaign', stat.campaign_name)
                          // Source is hidden as per request
                          handleCopy(url.toString())
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Copy Franchise Link"
                      >
                        <Copy size={12} />
                        FRANCHISE
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1428ae] to-[#0c1f4a] rounded-xl p-6 text-white shadow-lg shadow-blue-900/10 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
              <Megaphone size={24} className="text-[#f59e0b]" />
            </div>
            <h3 className="text-xl font-black mb-2">Platform Tracking</h3>
            <p className="text-blue-100/70 text-sm leading-relaxed">
              Create specific links for Facebook, Instagram, or TikTok to see exactly where your leads are coming from.
            </p>
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
              <Facebook size={16} className="text-blue-400" />
              <div className="flex-1">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${getPlatformPercentage(platformStats.Facebook)}%` }} />
                </div>
              </div>
              <span className="text-[10px] font-bold">{getPlatformPercentage(platformStats.Facebook)}%</span>
            </div>
            {platformStats.Instagram > 0 && (
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                <Instagram size={16} className="text-pink-400" />
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 rounded-full transition-all duration-500" style={{ width: `${getPlatformPercentage(platformStats.Instagram)}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold">{getPlatformPercentage(platformStats.Instagram)}%</span>
              </div>
            )}
            {platformStats.TikTok > 0 && (
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                <Share2 size={16} className="text-teal-400" />
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: `${getPlatformPercentage(platformStats.TikTok)}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold">{getPlatformPercentage(platformStats.TikTok)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">My Referral Links</p>
          <p className="text-xs text-slate-400 font-medium">{initialCodes.length} Active Codes</p>
        </div>
        <div className="divide-y divide-slate-50">
          {initialCodes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400">No referral codes created yet.</p>
            </div>
          ) : (
            initialCodes.map((code) => (
              <div key={code.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Code: {code.code}</p>
                    {code.is_active && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div className="flex items-center gap-2 group">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1 rounded">Sales</span>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {`${origin || 'https://homesph.com'}/registration/salesperson?ref=${code.code}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1 rounded">Branch</span>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {`${origin || 'https://homesph.com'}/registration/franchise?ref=${code.code}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 px-4">
                  <div className="text-center shrink-0">
                    <p className="text-base font-black text-slate-900">{code.clicks}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clicks</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-base font-black text-emerald-600">{code.conversions}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regs</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button 
                    onClick={() => handleCopy(`${origin || 'https://homesph.com'}/registration/salesperson?ref=${code.code}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all border border-blue-200/50 shadow-sm shadow-blue-900/5"
                  >
                    <Copy size={12} />
                    SALESPERSON
                  </button>
                  <button 
                    onClick={() => handleCopy(`${origin || 'https://homesph.com'}/registration/franchise?ref=${code.code}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-200/50 shadow-sm shadow-indigo-900/5"
                  >
                    <Copy size={12} />
                    FRANCHISE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
