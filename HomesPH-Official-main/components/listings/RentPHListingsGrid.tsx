'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Bed, Bath, Maximize2, Search, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, Star, Phone, Mail,
  ExternalLink, SlidersHorizontal, X, ArrowUpDown,
  ChevronDown, Home,
} from 'lucide-react'

/* ── Types ── */
export interface RentPHGalleryImage {
  large: string
  thumb: string
}

export interface RentPHProperty {
  id: number
  slug: string
  title: string
  price: string        // string in API, parse with Number()
  address: string
  bed: number
  bath: number | string
  square: number       // 0 = not provided
  is_featured: boolean
  property_type: string
  category_id: number
  image: string        // primary cover image
  gallery: RentPHGalleryImage[]
  lat: number | null
  lng: number | null
  content: string      // raw HTML
  user_name: string
  agent_title: string
  agent_phone: string
  agent_email: string
  user_avatar: string
  created_at: string
  updated_at: string
}

export interface RentPHPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  has_more: boolean
}

export interface RentPHResponse {
  status: string
  data: RentPHProperty[]
  pagination: RentPHPagination
}

/* ── Helpers ── */
function formatPrice(raw: string | number): string {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  if (isNaN(n) || n === 0) return 'Price on request'
  return `₱${n.toLocaleString('en-PH')}/mo`
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function coverImage(p: RentPHProperty): string {
  if (p.image && p.image.startsWith('http')) return p.image
  if (p.gallery?.[0]?.large) return p.gallery[0].large
  return ''
}

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
]

type SortValue = 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'oldest'

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm animate-pulse">
      <div className="h-52 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  )
}

/* ── Property Card ── */
function PropertyCard({ p }: { p: RentPHProperty }) {
  const img = coverImage(p)
  const price = formatPrice(p.price)
  const desc = stripHtml(p.content).slice(0, 100)
  const baths = Number(p.bath) || 0
  const sqm = Number(p.square) || 0

  return (
    <Link
      href={`/rent/${p.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden shrink-0">
        {img ? (
          <img
            src={img}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Home size={36} className="text-slate-300" />
          </div>
        )}

        {/* Featured badge */}
        {p.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
            <Star size={10} fill="currentColor" />
            Featured
          </div>
        )}

        {/* RentPH logo badge */}
        <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-1 shadow-md">
          <img
            src="https://rent.ph/uploads/0000/1/2025/02/06/rentlogo-official1.png"
            alt="Rent.PH"
            className="h-4 w-auto object-contain"
          />
        </div>

        {/* Property type */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-lg">
          {p.property_type || 'Property'}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Price */}
        <p className="text-[#1428ae] font-black text-xl leading-tight">
          {price}
        </p>

        {/* Title */}
        <h3 className="text-slate-900 font-semibold text-sm leading-snug line-clamp-2">
          {p.title}
        </h3>

        {/* Specs */}
        <div className="flex items-center gap-3 text-slate-600 text-xs flex-wrap">
          {p.bed > 0 && (
            <span className="flex items-center gap-1">
              <Bed size={13} className="text-[#1428ae]" />
              {p.bed} {p.bed === 1 ? 'Bed' : 'Beds'}
            </span>
          )}
          {baths > 0 && (
            <>
              {p.bed > 0 && <span className="text-slate-200">|</span>}
              <span className="flex items-center gap-1">
                <Bath size={13} className="text-[#1428ae]" />
                {baths} {baths === 1 ? 'Bath' : 'Baths'}
              </span>
            </>
          )}
          {sqm > 0 && (
            <>
              {(p.bed > 0 || baths > 0) && <span className="text-slate-200">|</span>}
              <span className="flex items-center gap-1">
                <Maximize2 size={13} className="text-[#1428ae]" />
                {sqm} sqm
              </span>
            </>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-slate-500 text-xs">
          <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{p.address}</span>
        </div>

        {/* Description snippet */}
        {desc && (
          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mt-auto pt-1 border-t border-slate-100">
            {desc}
          </p>
        )}

        {/* Agent */}
        {p.user_name && (
          <div className="flex items-center gap-2 pt-1">
            {p.user_avatar && (
              <img
                src={p.user_avatar}
                alt={p.user_name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <span className="text-[11px] text-slate-500 truncate">{p.user_name}</span>
            {p.agent_title && (
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                {p.agent_title}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ── Sort dropdown ── */
function SortDropdown({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  const [open, setOpen] = useState(false)
  const label = SORT_OPTIONS.find(o => o.value === value)?.label ?? 'Sort'
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-[#1428ae]/40 hover:text-[#1428ae] transition-all shadow-sm"
      >
        <ArrowUpDown size={14} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 overflow-hidden">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value as SortValue); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === o.value
                  ? 'bg-[#1428ae]/8 text-[#1428ae] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Component ── */
export default function RentPHListingsGrid() {
  const [items, setItems] = useState<RentPHProperty[]>([])
  const [pagination, setPagination] = useState<RentPHPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortValue>('popular')
  const abortRef = useRef<AbortController | null>(null)

  const fetchListings = useCallback(async (p: number, q: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(p), per_page: '12' })
      if (q) params.set('search', q)

      const res = await fetch(`/api/rentph/properties?${params}`, {
        signal: ctrl.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: RentPHResponse = await res.json()

      if (json.status !== 'success') throw new Error('API returned error status')

      let data = json.data ?? []

      // Client-side sort
      switch (sort) {
        case 'price_asc':
          data = [...data].sort((a, b) => Number(a.price) - Number(b.price))
          break
        case 'price_desc':
          data = [...data].sort((a, b) => Number(b.price) - Number(a.price))
          break
        case 'newest':
          data = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
        case 'oldest':
          data = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          break
        // 'popular' = default API order
      }

      setItems(data)
      setPagination(json.pagination ?? null)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError('Failed to load RentPH listings. Please try again.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => {
    fetchListings(page, search)
  }, [page, search, sort, fetchListings])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const totalPages = pagination?.last_page ?? 1
  const totalCount = pagination?.total ?? 0

  return (
    <div className="space-y-5">
      {/* ── Header bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div>
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading…' : totalCount > 0
              ? `${totalCount.toLocaleString()} rental properties from Rent.PH`
              : 'No results found'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search rentals…"
              className="pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30 focus:border-[#1428ae]/40 transition-all shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Sort */}
          <SortDropdown value={sort} onChange={v => { setSort(v); setPage(1) }} />
        </div>
      </div>

      {/* ── Active search chip ── */}
      {search && !loading && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Showing results for:</span>
          <span className="flex items-center gap-1.5 text-xs font-medium bg-[#1428ae]/8 text-[#1428ae] px-2.5 py-1 rounded-full">
            "{search}"
            <button onClick={clearSearch} className="hover:opacity-70">
              <X size={11} />
            </button>
          </span>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-rose-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{error}</p>
            <p className="text-sm text-slate-500 mt-1">Check your connection or try again.</p>
          </div>
          <button
            onClick={() => fetchListings(page, search)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1428ae] text-white text-sm font-semibold rounded-xl hover:bg-[#0f1f8a] transition-colors shadow-sm"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Home size={28} className="text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">No rentals found</p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? `No results for "${search}". Try a different keyword.` : 'No listings available at the moment.'}
            </p>
          </div>
          {search && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 text-sm font-semibold text-[#1428ae] border border-[#1428ae]/30 rounded-xl hover:bg-[#1428ae]/5 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {(loading || items.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map(p => <PropertyCard key={p.id} p={p} />)
          }
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(v => Math.max(1, v - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-[#1428ae]/40 hover:text-[#1428ae] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={15} />
            Prev
          </button>

          {/* Page number pills */}
          {(() => {
            const pages: (number | '...')[] = []
            const delta = 2
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i)
              } else if (pages[pages.length - 1] !== '...') {
                pages.push('...')
              }
            }
            return pages.map((p2, i) =>
              p2 === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
              ) : (
                <button
                  key={p2}
                  onClick={() => setPage(p2 as number)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                    p2 === page
                      ? 'bg-[#1428ae] text-white shadow-sm shadow-[#1428ae]/30'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-[#1428ae]/40 hover:text-[#1428ae]'
                  }`}
                >
                  {p2}
                </button>
              )
            )
          })()}

          <button
            onClick={() => setPage(v => Math.min(totalPages, v + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-[#1428ae]/40 hover:text-[#1428ae] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Footer attribution ── */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
          <span>Listings powered by</span>
          <a
            href="https://rent.ph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#1428ae] font-semibold hover:underline"
          >
            Rent.PH <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}
