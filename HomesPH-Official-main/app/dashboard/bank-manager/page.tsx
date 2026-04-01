'use client'

import { FileText, CheckCircle, Clock, DollarSign, Plus } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DashboardChart from '@/components/dashboard/DashboardChart'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'

const appData = [
  { name: 'Jul', value: 14 }, { name: 'Aug', value: 18 }, { name: 'Sep', value: 22 },
  { name: 'Oct', value: 19 }, { name: 'Nov', value: 27 }, { name: 'Dec', value: 33 },
  { name: 'Jan', value: 28 }, { name: 'Feb', value: 36 },
]
const approvalData = [
  { name: 'Jul', value: 68 }, { name: 'Aug', value: 72 }, { name: 'Sep', value: 70 },
  { name: 'Oct', value: 75 }, { name: 'Nov', value: 69 }, { name: 'Dec', value: 78 },
  { name: 'Jan', value: 74 }, { name: 'Feb', value: 80 },
]

const APPLICATIONS = [
  { applicant: 'Maria Santos',   bank: 'BDO Unibank',  amount: '₱4.5M',  project: 'Azure Sky',       loanTerm: '20 yrs', status: 'Approved',  date: 'Feb 7, 2026'  },
  { applicant: 'Juan dela Cruz', bank: 'BPI',          amount: '₱7.2M',  project: 'BGC Tower 2',     loanTerm: '25 yrs', status: 'Review',    date: 'Feb 6, 2026'  },
  { applicant: 'Ana Reyes',      bank: 'Metrobank',    amount: '₱2.8M',  project: 'Iloilo Garden',   loanTerm: '15 yrs', status: 'Pending',   date: 'Feb 5, 2026'  },
  { applicant: 'Carlos Lim',     bank: 'Security Bank',amount: '₱9.1M',  project: 'Cebu Beachside',  loanTerm: '20 yrs', status: 'Approved',  date: 'Feb 4, 2026'  },
  { applicant: 'Rosa Tan',       bank: 'Landbank',     amount: '₱1.9M',  project: 'Pampanga Greens', loanTerm: '10 yrs', status: 'Rejected',  date: 'Feb 2, 2026'  },
  { applicant: 'Ben Cruz',       bank: 'RCBC',         amount: '₱5.4M',  project: 'Azure Sky',       loanTerm: '20 yrs', status: 'Review',    date: 'Feb 1, 2026'  },
  { applicant: 'Celine Go',      bank: 'BDO Unibank',  amount: '₱3.3M',  project: 'Cloud 9 Res.',    loanTerm: '15 yrs', status: 'Approved',  date: 'Jan 30, 2026' },
  { applicant: 'Luis Reyes',     bank: 'BPI',          amount: '₱6.6M',  project: 'Davao Highlands', loanTerm: '20 yrs', status: 'Pending',   date: 'Jan 28, 2026' },
]

export default function BankManagerDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bank Manager Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Review loan applications and track financing performance.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm">
          <Plus size={15} />
          New Application
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Loan Requests"        value="36"     icon={FileText}     iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    trend={{ value: 8.4,  positive: true  }} />
        <KpiCard title="Approved Loans"       value="24"     icon={CheckCircle}  iconColor="text-emerald-600"iconBg="bg-emerald-50" trend={{ value: 12.1, positive: true  }} />
        <KpiCard title="Pending Review"       value="9"      icon={Clock}        iconColor="text-amber-600"  iconBg="bg-amber-50"   description="Awaiting assessment" />
        <KpiCard title="Total Loan Value"     value="₱148M"  icon={DollarSign}   iconColor="text-violet-600" iconBg="bg-violet-50"  trend={{ value: 6.2,  positive: true  }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChart
          title="Applications per Month"
          subtitle="Loan applications received"
          type="bar" data={appData} dataKey="value" color="#2563eb"
        />
        <DashboardChart
          title="Approval Rate Trend"
          subtitle="% of applications approved monthly"
          type="area" data={approvalData} dataKey="value" color="#22c55e"
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Loan Amount', value: '₱4.1M',  sub: 'Across all approved'      },
          { label: 'Avg. Approval Time', value: '3.2 days', sub: 'From submission to approval' },
          { label: 'Approval Rate',    value: '80%',    sub: 'Last 30 days'             },
          { label: 'Active Borrowers', value: '24',     sub: 'Currently in good standing' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Applications table */}
      <DataTable
        title="Loan Applications"
        data={APPLICATIONS}
        columns={[
          { key: 'applicant', label: 'Applicant' },
          { key: 'bank',      label: 'Bank',    sortable: false },
          { key: 'amount',    label: 'Amount',  render: v => <span className="font-semibold text-slate-900">{String(v)}</span> },
          { key: 'project',   label: 'Project'  },
          { key: 'loanTerm',  label: 'Term',    sortable: false },
          { key: 'status',    label: 'Status',  render: v => <StatusBadge status={String(v)} /> },
          { key: 'date',      label: 'Applied', sortable: false },
        ]}
      />
    </div>
  )
}
