'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

interface ChartData {
  [key: string]: any
}

interface Props {
  title: string
  subtitle?: string
  type: 'area' | 'bar'
  data: ChartData[]
  dataKey: string
  xKey?: string
  color?: string
  className?: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-black text-slate-900">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

export default function DashboardChart({
  title, subtitle, type, data, dataKey,
  xKey = 'name', color = '#2563eb', className,
}: Props) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-5', className)}>
      <div className="mb-5">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
              fill={`url(#grad-${dataKey})`} dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
