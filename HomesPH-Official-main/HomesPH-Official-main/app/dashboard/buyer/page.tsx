'use client'

import { Home, MessageSquare, Star, Eye, MapPin } from 'lucide-react'
import KpiCard from '@/components/dashboard/KpiCard'
import DataTable from '@/components/dashboard/DataTable'
import StatusBadge from '@/components/dashboard/StatusBadge'

const SAVED_LISTINGS = [
  { id: 1, title: '3BR Condo — Azure Sky',   location: 'Cebu IT Park',  price: '₱5.8M',  beds: '3BR', sqm: '82 sqm', saved: 'Feb 5, 2026'  },
  { id: 2, title: '2BR Studio — BGC Tower',  location: 'BGC, Taguig',   price: '₱9.2M',  beds: '2BR', sqm: '54 sqm', saved: 'Feb 3, 2026'  },
  { id: 3, title: '1BR Loft — Iloilo Suite', location: 'Iloilo City',   price: '₱2.4M',  beds: '1BR', sqm: '36 sqm', saved: 'Jan 30, 2026' },
  { id: 4, title: 'Studio Unit — Davao H.',  location: 'Davao City',    price: '₱1.9M',  beds: 'Studio', sqm: '28 sqm', saved: 'Jan 25, 2026' },
]

const MY_INQUIRIES = [
  { project: 'Azure Sky Residences', message: '3BR unit availability & payment terms', status: 'Pending', replied: '—',           date: 'Feb 7, 2026'  },
  { project: 'BGC Tower 2',          message: 'Price for corner unit on 14th floor',    status: 'Active',  replied: 'Feb 7, 2026', date: 'Feb 6, 2026'  },
  { project: 'Iloilo Garden Suites', message: 'Is there a flexible payment scheme?',    status: 'Active',  replied: 'Feb 5, 2026', date: 'Feb 4, 2026'  },
  { project: 'Pampanga Greens',      message: 'Site visit this weekend possible?',      status: 'Pending', replied: '—',           date: 'Feb 2, 2026'  },
]

export default function BuyerDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Browse saved properties and manage your inquiries.</p>
        </div>
        <a
          href="/buy"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-bold transition-colors shadow-sm"
        >
          <Home size={15} />
          Browse Properties
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Saved Listings"     value="12"  icon={Star}          iconColor="text-amber-600"  iconBg="bg-amber-50"   description="Properties bookmarked" />
        <KpiCard title="Inquiries Sent"     value="4"   icon={MessageSquare} iconColor="text-[#1428ae]"   iconBg="bg-blue-50"    description="2 awaiting response" />
        <KpiCard title="Recommended"        value="8"   icon={Home}          iconColor="text-emerald-600"iconBg="bg-emerald-50" description="Based on your preferences" />
        <KpiCard title="Recently Viewed"    value="19"  icon={Eye}           iconColor="text-violet-600" iconBg="bg-violet-50"  description="In the last 7 days" />
      </div>

      {/* Saved Listings cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Saved Listings</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
          {SAVED_LISTINGS.map(listing => (
            <div key={listing.id} className="p-5 hover:bg-slate-50/60 transition-colors cursor-pointer group">
              {/* Property thumbnail placeholder */}
              <div className="w-full h-28 rounded-lg bg-gradient-to-br from-slate-100 to-blue-50 mb-3 flex items-center justify-center overflow-hidden">
                <Home size={28} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-[#1428ae] transition-colors line-clamp-1">
                {listing.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <MapPin size={11} />
                {listing.location}
              </div>
              <p className="mt-2 text-base font-black text-[#1428ae]">{listing.price}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium">{listing.beds}</span>
                <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium">{listing.sqm}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Saved {listing.saved}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiries table */}
      <DataTable
        title="My Inquiries"
        data={MY_INQUIRIES}
        columns={[
          { key: 'project', label: 'Project'  },
          { key: 'message', label: 'Message', sortable: false, render: v => <span className="text-slate-500 line-clamp-1 max-w-xs">{String(v)}</span> },
          { key: 'status',  label: 'Status',  render: v => <StatusBadge status={String(v)} /> },
          { key: 'replied', label: 'Replied', sortable: false },
          { key: 'date',    label: 'Sent',    sortable: false },
        ]}
      />
    </div>
  )
}
