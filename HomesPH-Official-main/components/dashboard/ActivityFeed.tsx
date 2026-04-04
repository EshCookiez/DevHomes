'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface ActivityItem {
  id: number | string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  description: string
  time: string
}

interface Props {
  title?: string
  items: ActivityItem[]
  className?: string
}

export default function ActivityFeed({ title, items, className }: Props) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">{title}</p>
        </div>
      )}
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center bg-slate-50/30">
            <p className="text-sm text-slate-400">No recent activity</p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5', item.iconBg)}>
                  <Icon size={14} className={item.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{item.time}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
