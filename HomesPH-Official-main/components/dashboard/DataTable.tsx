'use client'

import { useState } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T & string
  label: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => React.ReactNode
  width?: string
}

interface Props<T extends Record<string, unknown>> {
  title?: string
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchKeys?: (keyof T & string)[]
  pageSize?: number
  className?: string
  emptyText?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  title, columns, data,
  searchable = true, searchKeys,
  pageSize = 8, className,
  emptyText = 'No records found.',
}: Props<T>) {
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState<keyof T | null>(null)
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [page, setPage]         = useState(1)

  const keys = searchKeys ?? columns.map(c => c.key)

  const filtered = data.filter(row =>
    !search ||
    keys.some(k => String(row[k] ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey]
        const dir = sortDir === 'asc' ? 1 : -1
        if (va == null) return dir
        if (vb == null) return -dir
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir
      })
    : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged      = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: keyof T) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1)

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}>
      {(title || searchable) && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
          {title && <p className="text-sm font-bold text-slate-900">{title}</p>}
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 ml-auto">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="bg-transparent outline-none text-slate-900 placeholder:text-slate-400 w-32 sm:w-44 text-sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap',
                    col.sortable !== false && 'cursor-pointer hover:text-slate-700 select-none',
                  )}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} className="opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center text-sm text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : paged.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-5 py-3.5 text-slate-700 align-middle">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {pageNumbers.map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg border transition-colors font-medium',
                  page === p
                    ? 'bg-[#1428ae] border-[#1428ae] text-white'
                    : 'border-slate-200 hover:bg-slate-100',
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
