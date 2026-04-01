'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TopProjectRecord } from '@/lib/reports-types'

export default function TopProjectsTable({ data }: { data: TopProjectRecord[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100"><CardTitle>Top Performing Projects</CardTitle></CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader><TableRow><TableHead className="px-6">Project</TableHead><TableHead>Listings</TableHead><TableHead>Inquiries</TableHead><TableHead>Leads</TableHead><TableHead className="pr-6">Conversion</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => <TableRow key={row.project_id}><TableCell className="px-6"><div><p className="font-semibold text-slate-900">{row.project_name}</p><p className="text-xs text-slate-500">{row.units_count} units tracked</p></div></TableCell><TableCell>{row.listings_count}</TableCell><TableCell>{row.inquiries_count}</TableCell><TableCell>{row.leads_count}</TableCell><TableCell className="pr-6">{row.conversion_rate}%</TableCell></TableRow>)}
            {data.length === 0 ? <TableRow><TableCell colSpan={5} className="px-6 py-16 text-center text-slate-400">No project performance data in the selected range.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}