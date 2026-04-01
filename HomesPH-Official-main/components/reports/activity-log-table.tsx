'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ActivityLogRecord } from '@/lib/reports-types'

function formatDate(value: string | null) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : format(parsed, 'MMM d, yyyy h:mm a')
}

export default function ActivityLogTable({ data, title = 'Recent Activity Logs' }: { data: ActivityLogRecord[]; title?: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader><TableRow><TableHead className="px-6">User</TableHead><TableHead>Action</TableHead><TableHead>Table</TableHead><TableHead>Record ID</TableHead><TableHead className="pr-6">Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((row) => <TableRow key={row.id}><TableCell className="px-6 font-semibold text-slate-900">{row.user_name || 'System'}</TableCell><TableCell>{row.action}</TableCell><TableCell>{row.table_name}</TableCell><TableCell>{row.record_id}</TableCell><TableCell className="pr-6">{formatDate(row.created_at)}</TableCell></TableRow>)}
            {data.length === 0 ? <TableRow><TableCell colSpan={5} className="px-6 py-16 text-center text-slate-400">No activity log entries available.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}