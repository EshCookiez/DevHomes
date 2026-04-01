'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MOCK_LISTINGS, MOCK_PROJECTS } from '@/lib/mock-data'

const fmt = (n?: number | null) => (n ? `₱ ${Number(n).toLocaleString()}` : null)

// Sample "saved" mock data — first 6 listings and 4 projects
const SAMPLE_LISTINGS = MOCK_LISTINGS.slice(0, 6)
const SAMPLE_PROJECTS = MOCK_PROJECTS.slice(0, 4)

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'projects'>('listings')
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header strip */}
      <header className="bg-[#0c1f4a] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-extrabold text-xl tracking-tight">HomesPH</Link>
          <Link href="/login" className="text-xs text-white/70 hover:text-white transition-colors">Sign In →</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Favorites</h1>
          <p className="text-sm text-gray-500 mt-1">Saved listings and projects you love</p>
        </div>

        {/* Login prompt banner */}
        {!dismissed && (
          <div className="mb-6 flex items-center gap-4 bg-[#1428ae]/8 border border-[#1428ae]/20 rounded-xl px-5 py-4">
            <span className="text-2xl">🔖</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Sign in to save your favorites</p>
              <p className="text-xs text-gray-500 mt-0.5">Create a free account to track listings and projects across devices.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/login" className="text-xs font-bold px-4 py-2 rounded-lg bg-[#1428ae] text-white hover:bg-amber-500 hover:text-[#1428ae] transition-colors">
                Sign In
              </Link>
              <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {(['listings', 'projects'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab ? 'bg-white text-[#1428ae] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'listings' ? `Listings (${SAMPLE_LISTINGS.length})` : `Projects (${SAMPLE_PROJECTS.length})`}
            </button>
          ))}
        </div>

        {/* ── Saved Listings ── */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_LISTINGS.map(l => {
              const thumb = l.property_listing_galleries?.sort((a, b) => a.display_order - b.display_order)?.[0]?.image_url
              const loc = [l.projects?.city_municipality, l.projects?.province].filter(Boolean).join(', ')
              return (
                <Link key={l.id} href={`/listings/${l.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    {thumb
                      ? <img src={thumb} alt={l.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="h-full flex items-center justify-center text-sm text-gray-400">No image</div>}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white shadow ${l.listing_type === 'rent' ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {l.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                    <button
                      className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-white transition-colors"
                      title="Remove from favorites"
                      onClick={e => { e.preventDefault() }}
                    >
                      ♥
                    </button>
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-2">{l.title}</p>
                    {loc && <p className="text-xs text-gray-400">📍 {loc}</p>}
                    <p className="text-sm font-bold text-[#1428ae]">
                      {fmt(l.price) ?? 'Price on request'}{l.listing_type === 'rent' ? ' / mo' : ''}
                    </p>
                    <div className="text-xs text-gray-400">
                      {l.project_units?.bedrooms === 0 ? 'Studio' : `${l.project_units?.bedrooms}BR`} · {l.project_units?.floor_area_sqm}sqm
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Saved Projects ── */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_PROJECTS.map(p => {
              const loc = [p.city_municipality, p.province].filter(Boolean).join(', ')
              return (
                <Link key={p.id} href={`/projects/${p.slug}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-44 bg-gray-100 overflow-hidden relative">
                    {p.main_image_url
                      ? <img src={p.main_image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="h-full flex items-center justify-center text-sm text-gray-400">No image</div>}
                    <button
                      className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-white transition-colors"
                      title="Remove from favorites"
                      onClick={e => { e.preventDefault() }}
                    >
                      ♥
                    </button>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        p.status === 'Ready for Occupancy' ? 'bg-green-50 text-green-700' :
                        p.status === 'Pre-Selling' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>{p.status}</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    {loc && <p className="text-xs text-gray-400">📍 {loc}</p>}
                    {(p.price_range_min || p.price_range_max) && (
                      <p className="text-xs font-semibold text-[#1428ae]">
                        {[
                          p.price_range_min && `₱ ${Number(p.price_range_min).toLocaleString()}`,
                          p.price_range_max && `₱ ${Number(p.price_range_max).toLocaleString()}`,
                        ].filter(Boolean).join(' – ')}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Browse More ── */}
        <div className="mt-12 bg-[#1428ae] rounded-2xl px-8 py-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Discover More Properties</h2>
          <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
            Browse thousands of listings and projects across the Philippines.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/buy" className="px-5 py-2.5 rounded-xl bg-amber-400 text-[#1428ae] font-bold text-sm hover:bg-amber-300 transition-colors">Buy Property</Link>
            <Link href="/rent" className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors">Rent Property</Link>
            <Link href="/projects" className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors">Browse Projects</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
