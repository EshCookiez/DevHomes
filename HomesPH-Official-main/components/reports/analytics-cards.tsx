'use client'

import DashboardChart from '@/components/dashboard/DashboardChart'
import { Card, CardContent } from '@/components/ui/card'
import type { ReportsCountRecord } from '@/lib/reports-types'

export default function AnalyticsCards({ cards }: { cards: Array<{ title: string; value: number; delta: number; trend: Array<{ label: string; value: number }> }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const isPositive = card.delta >= 0
        return (
          <Card key={card.title} className="border-slate-200 shadow-sm">
            <CardContent className="px-5 py-5">
              <p className="text-sm text-slate-500">{card.title}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{card.value.toLocaleString()}</p>
              <p className={`mt-1 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? '+' : ''}{card.delta}% this period</p>
              <div className="mt-4 h-20"><DashboardChart title="" type="area" data={card.trend} dataKey="value" xKey="label" color={isPositive ? '#059669' : '#dc2626'} className="border-0 p-0 shadow-none" /></div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function calculateDelta(record: ReportsCountRecord) {
  if (record.previous === 0) {
    return record.current > 0 ? 100 : 0
  }

  return Number((((record.current - record.previous) / record.previous) * 100).toFixed(1))
}