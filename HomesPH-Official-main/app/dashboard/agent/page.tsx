'use client'

import { Home, MessageSquare, Target, FolderOpen, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'
import DashboardChart from '@/components/dashboard/DashboardChart'

const leadFlow = [
  { name: 'Oct', value: 7 },
  { name: 'Nov', value: 11 },
  { name: 'Dec', value: 13 },
  { name: 'Jan', value: 16 },
  { name: 'Feb', value: 21 },
]

const assignedLeads = [
  { name: 'Santos Family', project: 'Azure Sky', stage: 'Qualified', source: 'Website', updated: '2h ago' },
  { name: 'Maria Tan', project: 'BGC Tower 2', stage: 'Contacted', source: 'Referral', updated: '5h ago' },
  { name: 'Celine Ong', project: 'Iloilo Suites', stage: 'New', source: 'Walk-in', updated: '1d ago' },
  { name: 'Jose Mercado', project: 'Cloud 9', stage: 'Negotiation', source: 'Website', updated: '1d ago' },
]

export default function AgentDashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Agent Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Focus on assigned leads, available inventory, and inquiry visibility within your scope.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          Add Lead Note
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Assigned Leads" value="21" icon={Target} iconColor="text-[#1428ae]" iconBg="bg-blue-50" trend={{ value: 8.4, positive: true }} />
        <KpiCard title="Visible Listings" value="67" icon={Home} iconColor="text-emerald-600" iconBg="bg-emerald-50" description="Read-only marketplace access" />
        <KpiCard title="Project Access" value="14" icon={FolderOpen} iconColor="text-amber-600" iconBg="bg-amber-50" description="Projects in current selling area" />
        <KpiCard title="Inquiries" value="9" icon={MessageSquare} iconColor="text-violet-600" iconBg="bg-violet-50" description="View-only communication history" />
      </div>

      <DashboardChart
        title="Assigned Lead Flow"
        subtitle="Lead volume handled in the last five months"
        type="area"
        data={leadFlow}
        dataKey="value"
        color="#2563eb"
      />

      <DataTable
        title="Assigned Leads"
        data={assignedLeads}
        columns={[
          { key: 'name', label: 'Lead' },
          { key: 'project', label: 'Project' },
          { key: 'source', label: 'Source', sortable: false },
          { key: 'stage', label: 'Stage', render: (value) => <StatusBadge status={String(value)} /> },
          { key: 'updated', label: 'Updated', sortable: false },
        ]}
      />
    </div>
  )
}