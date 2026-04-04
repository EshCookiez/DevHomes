'use client'

import { Users, UserPlus, Home, DollarSign, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'

const salesData = [
  { name: 'Marco R.',  value: 8  },
  { name: 'Ana G.',    value: 12 },
  { name: 'Luis S.',   value: 6  },
  { name: 'Rosa M.',   value: 14 },
  { name: 'Ben C.',    value: 9  },
]
const conversionData = [
  { name: 'Jul', value: 18 }, { name: 'Aug', value: 22 }, { name: 'Sep', value: 19 },
  { name: 'Oct', value: 27 }, { name: 'Nov', value: 24 }, { name: 'Dec', value: 31 },
  { name: 'Jan', value: 28 }, { name: 'Feb', value: 34 },
]

const TEAM = [
  { name: 'Marco Reyes',   leads: 18, conversions: 8,  revenue: '₱4.2M',  listings: 7,  status: 'Active'   },
  { name: 'Ana Garcia',    leads: 24, conversions: 12, revenue: '₱6.8M',  listings: 11, status: 'Active'   },
  { name: 'Luis Santos',   leads: 14, conversions: 6,  revenue: '₱2.9M',  listings: 5,  status: 'Active'   },
  { name: 'Rosa Mendoza',  leads: 29, conversions: 14, revenue: '₱8.1M',  listings: 14, status: 'Active'   },
  { name: 'Ben Cruz',      leads: 20, conversions: 9,  revenue: '₱4.9M',  listings: 8,  status: 'Active'   },
  { name: 'Celine Ong',    leads: 10, conversions: 3,  revenue: '₱1.4M',  listings: 4,  status: 'Inactive' },
]

export default function FranchiseDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Franchise Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your team's performance and pipeline.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          Add Salesperson
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Team Sales"  value="₱27.3M" icon={DollarSign}  iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: 11.4, positive: true  }} />
        <KpiCard title="Active Leads"      value="115"    icon={UserPlus}    iconColor="text-[#1428ae]"    iconBg="bg-blue-50"    trend={{ value: 6.2,  positive: true  }} />
        <KpiCard title="Team Members"      value="6"      icon={Users}       iconColor="text-violet-600"  iconBg="bg-violet-50"  description="5 active, 1 inactive" />
        <KpiCard title="Active Listings"   value="49"     icon={Home}        iconColor="text-amber-600"   iconBg="bg-amber-50"   trend={{ value: 3.1,  positive: true  }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Conversions per Salesperson"
          subtitle="Closed deals this quarter"
          type="bar" data={salesData} dataKey="value" xKey="name" color="#7c3aed"
        />
        <DashboardChart
          title="Lead Conversion Rate"
          subtitle="% of leads converted — last 8 months"
          type="area" data={conversionData} dataKey="value" color="#22c55e"
        />
      </div>

      {/* Team table */}
      <DataTable
        title="My Team"
        data={TEAM}
        columns={[
          { key: 'name',         label: 'Name'        },
          { key: 'leads',        label: 'Leads',       render: v => <span className="font-semibold text-slate-900">{String(v)}</span> },
          { key: 'conversions',  label: 'Conversions', render: v => <span className="font-semibold text-emerald-600">{String(v)}</span> },
          { key: 'revenue',      label: 'Revenue',     render: v => <span className="font-semibold text-slate-900">{String(v)}</span> },
          { key: 'listings',     label: 'Listings'    },
          { key: 'status',       label: 'Status',      render: v => <StatusBadge status={String(v)} /> },
        ]}
      />
    </div>
  )
}
