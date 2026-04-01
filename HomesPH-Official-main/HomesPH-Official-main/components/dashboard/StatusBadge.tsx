'use client'

import { cn } from '@/lib/utils'

const COLOR_MAP: Record<string, string> = {
  active:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
  approved:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'closed won':  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  verified:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  qualified:     'bg-blue-50 text-blue-700 ring-blue-200',
  pending:       'bg-amber-50  text-amber-700  ring-amber-200',
  contacted:     'bg-amber-50  text-amber-700  ring-amber-200',
  'proposal sent':'bg-violet-50 text-violet-700 ring-violet-200',
  negotiation:   'bg-orange-50 text-orange-700 ring-orange-200',
  new:           'bg-blue-50   text-blue-700   ring-blue-200',
  review:        'bg-amber-50  text-amber-700  ring-amber-200',
  rejected:      'bg-rose-50   text-rose-700   ring-rose-200',
  'closed lost': 'bg-rose-50   text-rose-700   ring-rose-200',
  inactive:      'bg-slate-100 text-slate-600  ring-slate-200',
  sold:          'bg-slate-100 text-slate-600  ring-slate-200',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ring-1 ring-inset',
      COLOR_MAP[key] ?? 'bg-slate-100 text-slate-600 ring-slate-200',
    )}>
      {status}
    </span>
  )
}
