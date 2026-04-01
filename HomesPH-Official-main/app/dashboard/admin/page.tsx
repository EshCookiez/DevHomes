'use client'

import Link from 'next/link'
import { FolderOpen, Home, UserPlus, MessageSquare, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'

const inquiryData = [
  { name: 'Jul', value: 88  }, { name: 'Aug', value: 105 }, { name: 'Sep', value: 134 },
  { name: 'Oct', value: 118 }, { name: 'Nov', value: 152 }, { name: 'Dec', value: 170 },
  { name: 'Jan', value: 144 }, { name: 'Feb', value: 190 },
]
const leadData = [
  { name: 'Jul', value: 63  }, { name: 'Aug', value: 80  }, { name: 'Sep', value: 95  },
  { name: 'Oct', value: 110 }, { name: 'Nov', value: 98  }, { name: 'Dec', value: 130 },
  { name: 'Jan', value: 122 }, { name: 'Feb', value: 148 },
]

const PROJECTS = [
  { name: 'Azure Sky Residences',  location: 'Cebu IT Park',    developer: 'Megaworld',  status: 'Active',   units: 320, listed: 'Jan 12, 2026' },
  { name: 'BGC Tower 2',           location: 'BGC, Taguig',     developer: 'Ayala Land', status: 'Active',   units: 210, listed: 'Jan 18, 2026' },
  { name: 'Davao Highlands',       location: 'Davao City',      developer: 'SMDC',       status: 'Pending',  units: 180, listed: 'Feb 1, 2026'  },
  { name: 'Iloilo Garden Suites',  location: 'Iloilo City',     developer: 'DMCI',       status: 'Active',   units: 96,  listed: 'Feb 4, 2026'  },
  { name: 'Pampanga Greens',       location: 'San Fernando',    developer: 'Federal',    status: 'Pending',  units: 140, listed: 'Feb 6, 2026'  },
  { name: 'Bacolod Sun Terrace',   location: 'Bacolod City',    developer: 'Vista Land', status: 'Active',   units: 88,  listed: 'Feb 8, 2026'  },
]

const INQUIRIES = [
  { subject: '3BR Unit inquiry',   project: 'Azure Sky',     from: 'Maria Santos',   status: 'New',     date: 'Feb 8, 2026'  },
  { subject: 'Price & availability', project: 'BGC Tower 2', from: 'Ben Cruz',       status: 'Pending', date: 'Feb 7, 2026'  },
  { subject: 'Viewing request',    project: 'Davao Highlands',from: 'Rose Tan',      status: 'Active',  date: 'Feb 6, 2026'  },
  { subject: 'Payment terms',      project: 'Iloilo Garden', from: 'Luis Reyes',     status: 'New',     date: 'Feb 5, 2026'  },
  { subject: 'Investment inquiry',  project: 'Pampanga Greens',from: 'Ana Go',       status: 'Pending', date: 'Feb 4, 2026'  },
]

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage content, operations and platform activity.</p>
        </div>
        <Link href="/dashboard/role-permissions" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          Role Permissions
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Active Projects"   value="156"    icon={FolderOpen}    iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    trend={{ value: 5.2, positive: true  }} />
        <KpiCard title="Pending Listings"  value="43"     icon={Home}          iconColor="text-amber-600"  iconBg="bg-amber-50"   trend={{ value: 2.1, positive: false }} />
        <KpiCard title="New Leads"         value="284"    icon={UserPlus}      iconColor="text-emerald-600"iconBg="bg-emerald-50" trend={{ value: 9.3, positive: true  }} />
        <KpiCard title="Unread Inquiries"  value="37"     icon={MessageSquare} iconColor="text-rose-600"   iconBg="bg-rose-50"    description="Requires attention" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Inquiries per Month"
          subtitle="Total buyer inquiries received"
          type="area" data={inquiryData} dataKey="value" color="#2563eb"
        />
        <DashboardChart
          title="New Leads per Month"
          subtitle="Leads captured from all channels"
          type="bar" data={leadData} dataKey="value" color="#22c55e"
        />
      </div>

      {/* Projects table */}
      <DataTable
        title="Recent Projects"
        data={PROJECTS}
        columns={[
          { key: 'name',      label: 'Project'   },
          { key: 'location',  label: 'Location'  },
          { key: 'developer', label: 'Developer' },
          { key: 'units',     label: 'Units', render: v => <span className="font-semibold text-slate-900">{String(v)}</span> },
          { key: 'status',    label: 'Status', render: v => <StatusBadge status={String(v)} /> },
          { key: 'listed',    label: 'Listed',   sortable: false },
        ]}
      />

      {/* Inquiries table */}
      <DataTable
        title="Recent Inquiries"
        data={INQUIRIES}
        columns={[
          { key: 'subject', label: 'Subject'  },
          { key: 'project', label: 'Project'  },
          { key: 'from',    label: 'From'     },
          { key: 'status',  label: 'Status', render: v => <StatusBadge status={String(v)} /> },
          { key: 'date',    label: 'Date',     sortable: false },
        ]}
      />
    </div>
  )
}
