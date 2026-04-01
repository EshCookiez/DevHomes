'use client'

import { UserPlus, Home, MessageSquare, Star, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { cn } from '@/lib/utils'

const PIPELINE_STAGES = [
  { label: 'New',           color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'    },
  { label: 'Contacted',     color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'   },
  { label: 'Qualified',     color: 'bg-violet-100 text-violet-700',dot: 'bg-violet-500'  },
  { label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500'  },
  { label: 'Negotiation',   color: 'bg-cyan-100 text-cyan-700',    dot: 'bg-cyan-500'    },
  { label: 'Closed Won',    color: 'bg-emerald-100 text-emerald-700',dot:'bg-emerald-500' },
  { label: 'Closed Lost',   color: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500'    },
]

const PIPELINE_LEADS: Record<string, { name: string; project: string; value: string }[]> = {
  'New':           [{ name: 'Santos Family',  project: 'Azure Sky',      value: '₱4.2M' }, { name: 'Tan, Maria',    project: 'BGC Tower',     value: '₱8.1M' }],
  'Contacted':     [{ name: 'Reyes, Carlos',  project: 'Davao Highlands',value: '₱3.8M' }, { name: 'Lim, Ana',     project: 'Iloilo Suite',  value: '₱2.5M' }],
  'Qualified':     [{ name: 'Cruz, Ben',      project: 'Pampanga Greens',value: '₱5.2M' }],
  'Proposal Sent': [{ name: 'Uy Family',      project: 'Azure Sky',      value: '₱9.0M' }, { name: 'Go, Rosa',     project: 'BGC Tower',     value: '₱7.6M' }],
  'Negotiation':   [{ name: 'Dela Cruz Corp', project: 'Cebu Beachside', value: '₱12M'  }],
  'Closed Won':    [{ name: 'Mendoza, Jose',  project: 'Azure Sky',      value: '₱5.8M' }, { name: 'Bautista, Lei',project: 'Iloilo Suite',  value: '₱3.1M' }],
  'Closed Lost':   [{ name: 'Ocampo, Rita',   project: 'Davao Highlands',value: '₱4.4M' }],
}

const MY_LEADS = [
  { name: 'Santos Family',   contact: '+63 912 345 6789', stage: 'New',           project: 'Azure Sky',       date: 'Feb 6, 2026'  },
  { name: 'Tan, Maria',      contact: '+63 917 234 5678', stage: 'Contacted',     project: 'BGC Tower 2',     date: 'Feb 5, 2026'  },
  { name: 'Cruz, Ben',       contact: '+63 920 111 2222', stage: 'Qualified',     project: 'Pampanga Greens', date: 'Feb 4, 2026'  },
  { name: 'Uy Family',       contact: '+63 918 888 0001', stage: 'Proposal Sent', project: 'Azure Sky',       date: 'Feb 3, 2026'  },
  { name: 'Dela Cruz Corp',  contact: '+63 915 333 4444', stage: 'Negotiation',   project: 'Cebu Beachside',  date: 'Feb 1, 2026'  },
  { name: 'Mendoza, Jose',   contact: '+63 919 555 6666', stage: 'Closed Won',    project: 'Azure Sky',       date: 'Jan 30, 2026' },
]

export default function SalespersonDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Track your leads, listings and pipeline progress.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="My Leads"         value="24"  icon={UserPlus}      iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    trend={{ value: 15.2, positive: true }} />
        <KpiCard title="My Listings"      value="11"  icon={Home}          iconColor="text-emerald-600"iconBg="bg-emerald-50" trend={{ value: 4.5,  positive: true }} />
        <KpiCard title="My Inquiries"     value="8"   icon={MessageSquare} iconColor="text-amber-600"  iconBg="bg-amber-50"   description="3 need response" />
        <KpiCard title="Saved Projects"   value="5"   icon={Star}          iconColor="text-violet-600" iconBg="bg-violet-50"  description="Bookmarked for follow-up" />
      </div>

      {/* Lead Pipeline Kanban */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Lead Pipeline</p>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const leads = PIPELINE_LEADS[stage.label] ?? []
              return (
                <div key={stage.label} className="w-48 shrink-0">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{leads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {leads.map((lead, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-200"
                      >
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', stage.dot)} />
                          <p className="text-xs font-semibold text-slate-900 leading-tight">{lead.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-3.5">{lead.project}</p>
                        <p className="text-xs font-bold text-slate-700 pl-3.5 mt-1">{lead.value}</p>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <div className="h-16 rounded-lg border-2 border-dashed border-slate-100 flex items-center justify-center">
                        <span className="text-[11px] text-slate-300">Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* My Leads table */}
      <DataTable
        title="All My Leads"
        data={MY_LEADS}
        columns={[
          { key: 'name',    label: 'Lead Name' },
          { key: 'contact', label: 'Contact',  sortable: false },
          { key: 'project', label: 'Project'   },
          { key: 'stage',   label: 'Stage', render: v => <StatusBadge status={String(v)} /> },
          { key: 'date',    label: 'Date',     sortable: false },
        ]}
      />
    </div>
  )
}
