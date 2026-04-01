'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; positive: boolean }
  description?: string
  className?: string
}

export default function KpiCard({
  title, value, icon: Icon,
  iconColor = 'text-[#1428ae]',
  iconBg = 'bg-blue-50',
  trend, description, className,
}: Props) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 shadow-md shadow-slate-300/50 p-5 hover:shadow-lg hover:shadow-[#1428ae]/10 transition-shadow',
      className,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
          <p className="mt-2 text-[2rem] font-black text-slate-900 leading-none tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2.5 text-xs font-semibold',
              trend.positive ? 'text-emerald-600' : 'text-rose-600',
            )}>
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{trend.value}% vs last month</span>
            </div>
          )}
          {description && !trend && (
            <p className="mt-1.5 text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className={cn('flex items-center justify-center w-11 h-11 rounded-xl shrink-0', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
