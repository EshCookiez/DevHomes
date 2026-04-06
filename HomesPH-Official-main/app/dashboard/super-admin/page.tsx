'use client'

import Link from 'next/link'
import { Users, Building2, FolderOpen, Home, UserPlus, MessageSquare, Activity, Settings, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import StatusBadge from '@/components/dashboard/StatusBadge'

const registrationData = [
  { name: 'Jul', value: 210 }, { name: 'Aug', value: 280 }, { name: 'Sep', value: 340 },
  { name: 'Oct', value: 390 }, { name: 'Nov', value: 460 }, { name: 'Dec', value: 520 },
  { name: 'Jan', value: 490 }, { name: 'Feb', value: 580 },
]
const listingsData = [
  { name: 'Jul', value: 310 }, { name: 'Aug', value: 420 }, { name: 'Sep', value: 380 },
  { name: 'Oct', value: 510 }, { name: 'Nov', value: 490 }, { name: 'Dec', value: 620 },
  { name: 'Jan', value: 580 }, { name: 'Feb', value: 710 },
]

const USERS = [
  { name: 'Maria Santos',   email: 'maria@example.com',  role: 'Franchise',   status: 'Active',   joined: 'Jan 14, 2026' },
  { name: 'Juan dela Cruz', email: 'juan@example.com',   role: 'Salesperson', status: 'Active',   joined: 'Jan 20, 2026' },
  { name: 'Ana Reyes',      email: 'ana@example.com',    role: 'Buyer',       status: 'Pending',  joined: 'Feb 2, 2026'  },
  { name: 'Carlos Lim',     email: 'carlos@example.com', role: 'Developer',   status: 'Active',   joined: 'Feb 5, 2026'  },
  { name: 'Rosa Tan',       email: 'rosa@example.com',   role: 'Affiliate',  status: 'Inactive', joined: 'Feb 9, 2026'  },
  { name: 'Ben Uy',         email: 'ben@example.com',    role: 'Franchise',   status: 'Active',   joined: 'Feb 11, 2026' },
]

const ACTIVITY_ITEMS = [
  { id: 1, icon: UserPlus,     iconColor: 'text-[#1428ae]',    iconBg: 'bg-blue-50',    title: 'New user registered',       description: 'Maria Santos joined as Franchise',                 time: '2m ago'  },
  { id: 2, icon: FolderOpen,   iconColor: 'text-violet-600',  iconBg: 'bg-violet-50',  title: 'New project submitted',     description: 'Azure Sky Cebu submitted by Megaworld',         time: '18m ago' },
  { id: 3, icon: MessageSquare,iconColor: 'text-amber-600',   iconBg: 'bg-amber-50',   title: 'Inquiry closed',            description: 'Santos family inquiry has been resolved',       time: '1h ago'  },
  { id: 4, icon: Building2,    iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', title: 'Developer approved',        description: 'SMDC Corporation has been verified',           time: '3h ago'  },
  { id: 5, icon: Home,         iconColor: 'text-orange-600',  iconBg: 'bg-orange-50',  title: 'Listing approved',          description: '3BR condo at BGC Tower 2 is now live',         time: '5h ago'  },
  { id: 6, icon: Activity,     iconColor: 'text-slate-600',   iconBg: 'bg-slate-100',  title: 'System backup completed',   description: 'Automated daily backup finished successfully',  time: '6h ago'  },
]

export default function SuperAdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">System Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Full platform view — all operations at a glance.</p>
        </div>
        <Link href="/dashboard/role-permissions" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Settings size={15} />
          Role Permissions
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Users"      value="12,453"  icon={Users}         iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    trend={{ value: 8.2,  positive: true  }} />
        <KpiCard title="Developers"       value="342"     icon={Building2}     iconColor="text-violet-600" iconBg="bg-violet-50"  trend={{ value: 4.1,  positive: true  }} />
        <KpiCard title="Projects"         value="1,089"   icon={FolderOpen}    iconColor="text-orange-600" iconBg="bg-orange-50"  trend={{ value: 12.5, positive: true  }} />
        <KpiCard title="Active Listings"  value="8,291"   icon={Home}          iconColor="text-emerald-600"iconBg="bg-emerald-50" trend={{ value: 3.8,  positive: true  }} />
        <KpiCard title="Total Leads"      value="23,740"  icon={UserPlus}      iconColor="text-amber-600"  iconBg="bg-amber-50"   trend={{ value: 2.1,  positive: false }} />
        <KpiCard title="Inquiries"        value="5,612"   icon={MessageSquare} iconColor="text-cyan-600"   iconBg="bg-cyan-50"    trend={{ value: 6.4,  positive: true  }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="User Registrations"
          subtitle="New users per month"
          type="area" data={registrationData} dataKey="value" color="#2563eb"
        />
        <DashboardChart
          title="Listings Growth"
          subtitle="New listings added monthly"
          type="bar" data={listingsData} dataKey="value" color="#7c3aed"
        />
      </div>

      {/* Activity + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed title="Recent Activity" items={ACTIVITY_ITEMS} />
        <DataTable
          title="Recent Users"
          data={USERS}
          columns={[
            { key: 'name',   label: 'Name'   },
            { key: 'role',   label: 'Role'   },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={String(v)} /> },
            { key: 'joined', label: 'Joined', sortable: false },
          ]}
          pageSize={6}
        />
      </div>
    </div>
  )
}
