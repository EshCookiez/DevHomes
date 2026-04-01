'use client'

import { FolderOpen, Home, DollarSign, MessageSquare, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'

const inquiryData = [
  { name: 'Jul', value: 28  }, { name: 'Aug', value: 36  }, { name: 'Sep', value: 44  },
  { name: 'Oct', value: 52  }, { name: 'Nov', value: 61  }, { name: 'Dec', value: 74  },
  { name: 'Jan', value: 68  }, { name: 'Feb', value: 83  },
]
const soldData = [
  { name: 'Azure Sky',      value: 48 },
  { name: 'Cebu Beachside', value: 32 },
  { name: 'Garden Suites',  value: 21 },
  { name: 'Cloud 9 Res.',   value: 37 },
]

const PROJECTS = [
  { name: 'Azure Sky Residences',   location: 'Cebu IT Park',   units: 320, sold: 87,  inquiries: 142, status: 'Active'   },
  { name: 'Cebu Beachside Suites',  location: 'Mactan, Cebu',   units: 160, sold: 52,  inquiries: 88,  status: 'Active'   },
  { name: 'Iloilo Garden Suites',   location: 'Iloilo City',    units: 96,  sold: 31,  inquiries: 54,  status: 'Active'   },
  { name: 'Cloud 9 Residences',     location: 'CDO City',       units: 200, sold: 64,  inquiries: 113, status: 'Active'   },
  { name: 'Davao Green Heights',    location: 'Davao City',     units: 140, sold: 0,   inquiries: 29,  status: 'Pending'  },
  { name: 'Bacolod Sun Terrace',    location: 'Bacolod City',   units: 88,  sold: 88,  inquiries: 201, status: 'Sold'     },
]

const UNITS = [
  { unit: 'Unit 304-A', project: 'Azure Sky', type: '3BR Corner', floor: '3F', sqm: '92 sqm', price: '₱6.8M',  status: 'Active'   },
  { unit: 'Unit 512-B', project: 'Azure Sky', type: '2BR Studio', floor: '5F', sqm: '58 sqm', price: '₱4.2M',  status: 'Pending'  },
  { unit: 'Unit 201-A', project: 'Cebu Bch.', type: '1BR Sea View',floor:'2F', sqm: '42 sqm', price: '₱3.1M',  status: 'Active'   },
  { unit: 'Unit 808-C', project: 'Cloud 9',   type: '3BR Penthouse',floor:'8F',sqm: '110 sqm',price: '₱14.5M', status: 'Active'   },
  { unit: 'Unit 103-B', project: 'Garden S.', type: '1BR Studio',  floor: '1F',sqm: '34 sqm', price: '₱2.2M',  status: 'Sold'     },
]

export default function DeveloperDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Developer Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your projects, units and buyer inquiries.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          New Project
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="My Projects"      value="6"      icon={FolderOpen}    iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    trend={{ value: 0,    positive: true  }} description="Across 5 cities" />
        <KpiCard title="Active Listings"  value="234"    icon={Home}          iconColor="text-emerald-600"iconBg="bg-emerald-50" trend={{ value: 5.2,  positive: true  }} />
        <KpiCard title="Units Sold"       value="322"    icon={DollarSign}    iconColor="text-amber-600"  iconBg="bg-amber-50"   trend={{ value: 9.1,  positive: true  }} />
        <KpiCard title="Inquiries"        value="627"    icon={MessageSquare} iconColor="text-violet-600" iconBg="bg-violet-50"  trend={{ value: 12.4, positive: true  }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Inquiries Over Time"
          subtitle="Buyer inquiries across all your projects"
          type="area" data={inquiryData} dataKey="value" color="#7c3aed"
        />
        <DashboardChart
          title="Units Sold per Project"
          subtitle="Total sold units by project"
          type="bar" data={soldData} dataKey="value" xKey="name" color="#f59e0b"
        />
      </div>

      {/* Projects table */}
      <DataTable
        title="My Projects"
        data={PROJECTS}
        columns={[
          { key: 'name',     label: 'Project'   },
          { key: 'location', label: 'Location'  },
          { key: 'units',    label: 'Total Units', render: v => <span className="font-semibold text-slate-900">{String(v)}</span> },
          { key: 'sold',     label: 'Sold',    render: v => <span className="font-semibold text-emerald-600">{String(v)}</span> },
          { key: 'inquiries',label: 'Inquiries' },
          { key: 'status',   label: 'Status',  render: v => <StatusBadge status={String(v)} /> },
        ]}
      />

      {/* Units table */}
      <DataTable
        title="Unit Inventory"
        data={UNITS}
        columns={[
          { key: 'unit',    label: 'Unit'    },
          { key: 'project', label: 'Project' },
          { key: 'type',    label: 'Type'    },
          { key: 'sqm',     label: 'Size',   sortable: false },
          { key: 'price',   label: 'Price',  render: v => <span className="font-bold text-[#1428ae]">{String(v)}</span> },
          { key: 'status',  label: 'Status', render: v => <StatusBadge status={String(v)} /> },
        ]}
      />
    </div>
  )
}
