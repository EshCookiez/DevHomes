'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HomeSearchBar() {
  const router = useRouter()
  const [locations, setLocations] = useState<{ title: string; slug: string }[]>([])
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<'all' | 'sale' | 'rent'>('all')
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')

  useEffect(() => {
    fetch('/api/site-locations')
      .then((r) => (r.ok ? r.json() : []))
      .then(setLocations)
      .catch(() => {})
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (location) params.set('location', location)
    if (type !== 'all') params.set('type', type)
    if (min) params.set('min', min)
    if (max) params.set('max', max)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 w-full">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl shadow-xl p-2">
        {/* Text input */}
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search property, project, or developer…"
            className="flex-1 py-2.5 text-sm text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-gray-200 my-1" />

        {/* Location select */}
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="sm:w-40 px-3 py-2.5 text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer rounded-xl"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l.slug} value={l.slug}>{l.title}</option>
          ))}
        </select>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-gray-200 my-1" />

        {/* Type toggle */}
        <div className="flex items-center gap-1 px-2">
          {(['all', 'sale', 'rent'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                type === t
                  ? 'bg-[#1428ae] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'all' ? 'All' : t === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0c1f4a] font-bold text-sm rounded-xl transition-colors shrink-0"
        >
          Search
        </button>
      </div>

      {/* Price range row */}
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
          <span className="text-xs text-blue-200 shrink-0">Min ₱</span>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="0"
            className="w-28 bg-transparent text-sm text-white placeholder-blue-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
          <span className="text-xs text-blue-200 shrink-0">Max ₱</span>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Any"
            className="w-28 bg-transparent text-sm text-white placeholder-blue-300 focus:outline-none"
          />
        </div>
        <p className="text-xs text-blue-300 self-center ml-1">
          Leave blank for any price range
        </p>
      </div>
    </form>
  )
}
