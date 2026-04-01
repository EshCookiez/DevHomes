'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TopAgentRecord } from '@/lib/reports-types'

export default function TopAgentsTable({ data }: { data: TopAgentRecord[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100"><CardTitle>Top Agents / Users</CardTitle></CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader><TableRow><TableHead className="px-6">Agent</TableHead><TableHead>Leads</TableHead><TableHead>Closed Deals</TableHead><TableHead className="pr-6">Conversion Rate</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => <TableRow key={row.user_id}><TableCell className="px-6 font-semibold text-slate-900">{row.agent_name}</TableCell><TableCell>{row.leads_count}</TableCell><TableCell>{row.closed_deals}</TableCell><TableCell className="pr-6">{row.conversion_rate}%</TableCell></TableRow>)}
            {data.length === 0 ? <TableRow><TableCell colSpan={4} className="px-6 py-16 text-center text-slate-400">No agent performance data in the selected range.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}