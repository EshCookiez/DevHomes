'use client'

import { UserPlus, DollarSign, Star, Link2, Copy, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import StatusBadge from '@/components/dashboard/StatusBadge'

const referralData = [
  { name: 'Jul', value: 4 }, { name: 'Aug', value: 6  }, { name: 'Sep', value: 5  },
  { name: 'Oct', value: 9 }, { name: 'Nov', value: 11 }, { name: 'Dec', value: 13 },
  { name: 'Jan', value: 10}, { name: 'Feb', value: 15 },
]

const REFERRALS = [
  { name: 'Marco Santos',  contact: '+63 912 111 2222', project: 'Azure Sky',       status: 'Closed Won', earnings: '₱42,000',  date: 'Feb 5, 2026'  },
  { name: 'Rose Tan',      contact: '+63 917 333 4444', project: 'BGC Tower 2',     status: 'Negotiation',earnings: 'Pending',   date: 'Feb 4, 2026'  },
  { name: 'Luis Reyes',    contact: '+63 920 555 6666', project: 'Pampanga Greens', status: 'Qualified',  earnings: 'Pending',   date: 'Feb 3, 2026'  },
  { name: 'Celine Go',     contact: '+63 918 777 8888', project: 'Iloilo Suite',    status: 'New',        earnings: '—',         date: 'Feb 1, 2026'  },
  { name: 'Ben Uy',        contact: '+63 915 999 0000', project: 'Davao Highlands', status: 'Closed Won', earnings: '₱28,500',  date: 'Jan 28, 2026' },
  { name: 'Ana Cruz',      contact: '+63 919 123 4567', project: 'Azure Sky',       status: 'Contacted',  earnings: 'Pending',   date: 'Jan 25, 2026' },
]

const ACTIVITY_ITEMS = [
  { id: 1, icon: UserPlus,  iconColor: 'text-[#1428ae]',    iconBg: 'bg-blue-50',    title: 'New referral registered',  description: 'Celine Go signed up via your link', time: '1h ago'  },
  { id: 2, icon: Star,      iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', title: 'Referral closed deal',     description: 'Ben Uy closed — ₱28,500 earned',   time: '3h ago'  },
  { id: 3, icon: DollarSign,iconColor: 'text-amber-600',   iconBg: 'bg-amber-50',   title: 'Commission processed',     description: '₱42,000 sent to your GCash wallet', time: '1d ago'  },
  { id: 4, icon: Link2,     iconColor: 'text-violet-600',  iconBg: 'bg-violet-50',  title: 'Link click milestone',     description: 'Your BGC Tower link hit 200 clicks', time: '2d ago' },
]

const REFERRAL_LINKS = [
  { project: 'Azure Sky Residences',  link: 'homesph.com/r/azure-sky?ref=amb001',   clicks: 312, conversions: 3 },
  { project: 'BGC Tower 2',           link: 'homesph.com/r/bgc-tower?ref=amb001',   clicks: 214, conversions: 2 },
  { project: 'Pampanga Greens',       link: 'homesph.com/r/pampanga?ref=amb001',    clicks: 98,  conversions: 1 },
]

export default function AmbassadorDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Ambassador Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Track your referrals, links, and commission earnings.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          New Referral
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Referral Leads"        value="24"      icon={UserPlus}   iconColor="text-[#1428ae]"    iconBg="bg-blue-50"    trend={{ value: 18.4, positive: true }} />
        <KpiCard title="Successful Referrals"  value="8"       icon={Star}       iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: 14.2, positive: true }} />
        <KpiCard title="Referral Earnings"     value="₱82.5K"  icon={DollarSign} iconColor="text-amber-600"   iconBg="bg-amber-50"   trend={{ value: 22.1, positive: true }} />
        <KpiCard title="Active Links"          value="3"       icon={Link2}      iconColor="text-violet-600"  iconBg="bg-violet-50"  description="Tracking live" />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Referrals per Month"
          subtitle="New leads generated from your links"
          type="area" data={referralData} dataKey="value" color="#f59e0b"
        />
        <ActivityFeed title="Recent Activity" items={ACTIVITY_ITEMS} />
      </div>

      {/* Referral links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">My Referral Links</p>
        </div>
        <div className="divide-y divide-slate-50">
          {REFERRAL_LINKS.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.project}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate font-mono">{item.link}</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-base font-black text-slate-900">{item.clicks}</p>
                <p className="text-[11px] text-slate-400">Clicks</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-base font-black text-emerald-600">{item.conversions}</p>
                <p className="text-[11px] text-slate-400">Converted</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors shrink-0">
                <Copy size={12} />
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals table */}
      <DataTable
        title="My Referrals"
        data={REFERRALS}
        columns={[
          { key: 'name',     label: 'Name'     },
          { key: 'project',  label: 'Project'  },
          { key: 'status',   label: 'Status',  render: v => <StatusBadge status={String(v)} /> },
          { key: 'earnings', label: 'Earnings', render: v => <span className="font-semibold text-emerald-700">{String(v)}</span> },
          { key: 'date',     label: 'Date',     sortable: false },
        ]}
      />
    </div>
  )
}
