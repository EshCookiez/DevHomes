'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MailOpen, MessageSquareReply, MessageSquareX } from 'lucide-react'
import InquiriesTable from '@/components/inquiries/inquiries-table'
import { Card, CardContent } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { InquiryAgentOptionRecord, InquiryListingOptionRecord, InquiryProjectOptionRecord, InquiryRecord } from '@/lib/inquiries-types'

export default function InquiriesManagementClient({ initialInquiries, projects, listings, agents, pageTitle = 'Property Inquiries', pageDescription = 'Track inbound buyer messages, reply workflows, and inquiry status across listings and projects.', canReply = true, canUpdateStatus = true, canDelete = true, canAssign = false, canReturn = false }: { initialInquiries: InquiryRecord[]; projects: InquiryProjectOptionRecord[]; listings: InquiryListingOptionRecord[]; agents: InquiryAgentOptionRecord[]; pageTitle?: string; pageDescription?: string; canReply?: boolean; canUpdateStatus?: boolean; canDelete?: boolean; canAssign?: boolean; canReturn?: boolean }) {
  const router = useRouter()
  const [inquiries, setInquiries] = useState(initialInquiries)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase.channel('admin-inquiries-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => router.refresh()).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [router])

  const unreadCount = useMemo(() => inquiries.filter((inquiry) => inquiry.status === 'unread').length, [inquiries])
  const repliedCount = useMemo(() => inquiries.filter((inquiry) => inquiry.status === 'replied').length, [inquiries])
  const closedCount = useMemo(() => inquiries.filter((inquiry) => inquiry.status === 'closed').length, [inquiries])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{pageDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Inquiries" value={inquiries.length.toString()} icon={Mail} tone="blue" />
        <MetricCard title="Unread" value={unreadCount.toString()} icon={MailOpen} tone="amber" />
        <MetricCard title="Replied" value={repliedCount.toString()} icon={MessageSquareReply} tone="emerald" />
        <MetricCard title="Closed" value={closedCount.toString()} icon={MessageSquareX} tone="slate" />
      </div>

      <InquiriesTable inquiries={inquiries} projects={projects} listings={listings} agents={agents} onChange={setInquiries} canReply={canReply} canUpdateStatus={canUpdateStatus} canDelete={canDelete} canAssign={canAssign} canReturn={canReturn} />
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof Mail; tone: 'blue' | 'emerald' | 'amber' | 'slate' }) {
  const toneClass = { blue: 'bg-blue-50 text-blue-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-700' }[tone]
  return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-4 px-5 py-5"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}><Icon size={20} /></span><div><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p></div></CardContent></Card>
}
