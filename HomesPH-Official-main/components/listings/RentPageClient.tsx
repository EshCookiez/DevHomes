'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { UnifiedListing } from '@/types/unified-listing'
import {
  Search, SlidersHorizontal, MapPin, Bed, Bath, Maximize2,
  ChevronLeft, ChevronRight, Heart, Share2, Star, X,
  ChevronDown, ArrowUpDown, Home, Building2, ArrowRight,
  Phone, Mail, ExternalLink,
} from 'lucide-react'

const RENTPH_LOGO = 'https://rent.ph/uploads/0000/1/2025/02/06/rentlogo-official1.png'

interface Props {
  listings: UnifiedListing[]
  totalListings: number
  currentPage: number
  totalPages: number
  rentPHTotal: number
  homesPHTotal: number
  searchParams: Record<string, any>
}

/* ─── Unified Listing Card ──────────────────────────────────────── */
function UnifiedCard({ listing }: { listing: UnifiedListing }) {
  const isRentPH = listing.source === 'rentph'

  return (
    <Link
      href={listing.href}
      className="unified-card"
      style={{
        display: 'flex',
        background: '#FFFFFF',
        border: '1px solid #E2E5F0',
        borderRadius: '12px',
        overflow: 'hidden',
        height: '220px',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
        position: 'relative',
      }}
    >
      {/* ── Image ── */}
      <div style={{ width: '340px', flexShrink: 0, position: 'relative', overflow: 'hidden', background: '#D9D9D9' }}>
        {listing.coverImage ? (
          <img
            src={listing.coverImage}
            alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>
            <Home size={40} color="#CBD5E1" />
          </div>
        )}

        {/* Featured badge */}
        {listing.isFeatured && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#F59E0B', color: 'white',
            fontSize: '11px', fontWeight: 700,
            padding: '3px 10px', borderRadius: '20px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Star size={9} fill="white" />
            Featured
          </div>
        )}

        {/* Source badge */}
        {isRentPH ? (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'white', borderRadius: '6px',
            padding: '3px 7px', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          }}>
            <img src={RENTPH_LOGO} alt="Rent.PH" style={{ height: '16px', display: 'block', objectFit: 'contain' }} />
          </div>
        ) : listing.developerLogo ? (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'white', borderRadius: '6px',
            padding: '3px 7px', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            maxWidth: '80px',
          }}>
            <img src={listing.developerLogo} alt="Developer" style={{ height: '20px', width: '100%', objectFit: 'contain' }} />
          </div>
        ) : null}

        {/* Image overlay icons */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: '10px' }}>
          <Heart size={20} color="white" fill="none" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.4))' }} />
          <Share2 size={20} color="white" fill="none" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.4))' }} />
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, position: 'relative' }}>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '22px', color: '#002143' }}>Php</span>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: '32px', color: '#002143', lineHeight: 1 }}>
            {listing.price != null ? listing.price.toLocaleString('en-PH') : 'Ask'}
          </span>
          {listing.priceSuffix && (
            <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: '#888' }}>{listing.priceSuffix}</span>
          )}
        </div>

        {/* Specs row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', rowGap: '4px' }}>
          <span style={{ fontFamily: "'Outfit'", fontSize: '14px', color: '#002143', fontWeight: 400 }}>{listing.propertyType}</span>
          {listing.beds > 0 && (
            <>
              <div style={{ width: '1px', height: '16px', background: '#D3D3D3', margin: '0 10px' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Outfit'", fontSize: '14px', color: '#002143' }}>
                <Bed size={15} color="#1428AE" />
                {listing.beds}
              </span>
            </>
          )}
          {listing.baths > 0 && (
            <>
              <div style={{ width: '1px', height: '16px', background: '#D3D3D3', margin: '0 10px' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Outfit'", fontSize: '14px', color: '#002143' }}>
                <Bath size={15} color="#1428AE" />
                {listing.baths}
              </span>
            </>
          )}
          {listing.areaSqm > 0 && (
            <>
              <div style={{ width: '1px', height: '16px', background: '#D3D3D3', margin: '0 10px' }} />
              <span style={{ fontFamily: "'Outfit'", fontSize: '14px', color: '#002143' }}>
                Area: {listing.areaSqm} sqm
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <div style={{ overflow: 'hidden' }}>
          <span style={{
            fontFamily: "'Outfit'", fontWeight: 300, fontSize: '14px',
            color: '#1428AE', display: 'block',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
          }}>
            {listing.title}
          </span>
        </div>

        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="#002143" />
          <span style={{
            fontFamily: "'Outfit'", fontSize: '13px', color: '#555',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {listing.address}
          </span>
        </div>

        {/* Bottom row: agent + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Agent info */}
          {listing.agentName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              {listing.agentAvatar ? (
                <img
                  src={listing.agentAvatar}
                  alt={listing.agentName}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#DFE3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1428AE' }}>
                    {listing.agentName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Outfit'", fontSize: '12px', color: '#333', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px' }}>{listing.agentName}</div>
                {listing.agentTitle && (
                  <div style={{ fontFamily: "'Outfit'", fontSize: '11px', color: '#888' }}>{listing.agentTitle}</div>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <div style={{ height: '36px', background: '#DFE3FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0 14px' }}>
              <Mail size={14} color="#1428AE" />
              <span style={{ fontFamily: "'Outfit'", fontSize: '13px', color: '#1428AE', fontWeight: 400 }}>Email</span>
            </div>
            <div style={{ height: '36px', background: '#DFE3FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0 14px' }}>
              <Phone size={14} color="#1428AE" />
              <span style={{ fontFamily: "'Outfit'", fontSize: '13px', color: '#1428AE', fontWeight: 400 }}>Call</span>
            </div>
            {isRentPH && (
              <div style={{ height: '36px', background: '#F0F4FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '0 12px', border: '1px solid #DFE3FF' }}>
                <img src={RENTPH_LOGO} alt="Rent.PH" style={{ height: '14px', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      display: 'flex', background: '#FFF', border: '1px solid #E2E5F0',
      borderRadius: '12px', overflow: 'hidden', height: '220px',
    }}>
      <div style={{ width: '340px', background: '#E8ECF0', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ height: '36px', background: '#E8ECF0', borderRadius: '8px', width: '60%', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ height: '16px', background: '#E8ECF0', borderRadius: '6px', width: '80%' }} />
        <div style={{ height: '16px', background: '#E8ECF0', borderRadius: '6px', width: '70%' }} />
        <div style={{ height: '16px', background: '#E8ECF0', borderRadius: '6px', width: '50%' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <div style={{ height: '36px', background: '#E8ECF0', borderRadius: '8px', width: '80px' }} />
          <div style={{ height: '36px', background: '#E8ECF0', borderRadius: '8px', width: '80px' }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Sort Dropdown ───────────────────────────────────────────── */
function SortButton({ current, onChange }: { current: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const options = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
  ]
  const label = options.find(o => o.value === current)?.label ?? 'Sort'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', background: 'white', border: '1px solid #D1D5DB',
          borderRadius: '10px', cursor: 'pointer', fontFamily: "'Outfit'",
          fontSize: '14px', color: '#374151', fontWeight: 500,
        }}
      >
        <ArrowUpDown size={14} />
        {label}
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 50,
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '180px', overflow: 'hidden',
        }}>
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', cursor: 'pointer',
                fontFamily: "'Outfit'", fontSize: '14px',
                background: current === o.value ? '#EDF0FF' : 'transparent',
                color: current === o.value ? '#1428AE' : '#374151',
                fontWeight: current === o.value ? 600 : 400,
                border: 'none',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main Client Component ───────────────────────────────────── */
export default function RentPageClient({
  listings,
  totalListings,
  currentPage,
  totalPages,
  rentPHTotal,
  homesPHTotal,
  searchParams,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(String(searchParams.q ?? ''))
  const [sort, setSort] = useState(String(searchParams.sort ?? 'newest'))
  const [showFilters, setShowFilters] = useState(false)

  function navigate(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    }
    next.delete('page') // reset to page 1 on filter change
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function goPage(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ q: searchInput || null })
  }

  return (
    <>
      <style>{`
        .unified-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,33,67,0.12);
          z-index: 2;
        }
        @keyframes shimmer {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* ── Hero / Search Bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A124D 0%, #1428AE 60%, #2D43D8 100%)',
        padding: '40px 0 32px',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
          <h1 style={{ fontFamily: "'Outfit'", fontWeight: 700, fontSize: '28px', color: 'white', margin: '0 0 20px', letterSpacing: '-0.3px' }}>
            Properties for Rent
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '14px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 500, verticalAlign: 'middle' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              {totalListings.toLocaleString()} listings
            </span>
          </h1>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search input */}
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by location, property type, keywords…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: '42px', paddingRight: searchInput ? '36px' : '14px',
                  height: '48px', border: 'none', borderRadius: '10px',
                  fontFamily: "'Outfit'", fontSize: '14px', color: '#111',
                  background: 'white', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); navigate({ q: null }) }}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} color="#9CA3AF" />
                </button>
              )}
            </div>

            {/* Beds quick filter */}
            <select
              value={String(searchParams.beds ?? '')}
              onChange={e => navigate({ beds: e.target.value || null })}
              style={{
                height: '48px', padding: '0 14px', border: 'none',
                borderRadius: '10px', background: 'white',
                fontFamily: "'Outfit'", fontSize: '14px', color: '#111',
                cursor: 'pointer', minWidth: '130px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <option value="">Any Beds</option>
              <option value="1">1+ Beds</option>
              <option value="2">2+ Beds</option>
              <option value="3">3+ Beds</option>
              <option value="4">4+ Beds</option>
            </select>

            {/* Price range */}
            <select
              value={String(searchParams.maxPrice ?? '')}
              onChange={e => navigate({ maxPrice: e.target.value || null })}
              style={{
                height: '48px', padding: '0 14px', border: 'none',
                borderRadius: '10px', background: 'white',
                fontFamily: "'Outfit'", fontSize: '14px', color: '#111',
                cursor: 'pointer', minWidth: '150px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <option value="">Any Price</option>
              <option value="10000">Under ₱10,000</option>
              <option value="20000">Under ₱20,000</option>
              <option value="50000">Under ₱50,000</option>
              <option value="100000">Under ₱100,000</option>
              <option value="200000">Under ₱200,000</option>
            </select>

            {/* Property type */}
            <select
              value={String(searchParams.type ?? '')}
              onChange={e => navigate({ type: e.target.value || null })}
              style={{
                height: '48px', padding: '0 14px', border: 'none',
                borderRadius: '10px', background: 'white',
                fontFamily: "'Outfit'", fontSize: '14px', color: '#111',
                cursor: 'pointer', minWidth: '150px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <option value="">All Types</option>
              <option value="Condominium">Condominium</option>
              <option value="House & Lot">House &amp; Lot</option>
              <option value="Apartment">Apartment</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Commercial">Commercial</option>
              <option value="Lot Only">Lot Only</option>
            </select>

            {/* Search button */}
            <button
              type="submit"
              style={{
                height: '48px', padding: '0 28px',
                background: '#F59E0B', border: 'none',
                borderRadius: '10px', cursor: 'pointer',
                fontFamily: "'Outfit'", fontSize: '15px',
                fontWeight: 700, color: '#002143',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Source stats bar ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={15} color="#1428AE" />
            <span style={{ fontFamily: "'Outfit'", fontSize: '13px', color: '#374151' }}>
              <strong style={{ color: '#1428AE' }}>{homesPHTotal}</strong> HomesPH listings
            </span>
          </div>
          <div style={{ width: '1px', height: '16px', background: '#E5E7EB' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={RENTPH_LOGO} alt="Rent.PH" style={{ height: '16px', objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Outfit'", fontSize: '13px', color: '#374151' }}>
              <strong style={{ color: '#1428AE' }}>{rentPHTotal.toLocaleString()}</strong> Rent.PH listings
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px', background: '#F0FDF4', color: '#16A34A', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                Live
              </span>
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SortButton current={sort} onChange={v => { setSort(v); navigate({ sort: v }) }} />
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* Active filters */}
        {(searchParams.q || searchParams.beds || searchParams.maxPrice || searchParams.type) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {searchParams.q && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EDF0FF', color: '#1428AE', fontSize: '13px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px' }}>
                Search: "{searchParams.q}"
                <button onClick={() => navigate({ q: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} color="#1428AE" />
                </button>
              </span>
            )}
            {searchParams.beds && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EDF0FF', color: '#1428AE', fontSize: '13px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px' }}>
                {searchParams.beds}+ Beds
                <button onClick={() => navigate({ beds: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} color="#1428AE" />
                </button>
              </span>
            )}
            {searchParams.maxPrice && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EDF0FF', color: '#1428AE', fontSize: '13px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px' }}>
                Under ₱{Number(searchParams.maxPrice).toLocaleString()}
                <button onClick={() => navigate({ maxPrice: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} color="#1428AE" />
                </button>
              </span>
            )}
            {searchParams.type && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EDF0FF', color: '#1428AE', fontSize: '13px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px' }}>
                {searchParams.type}
                <button onClick={() => navigate({ type: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} color="#1428AE" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Listings grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : listings.length > 0
              ? listings.map(l => <UnifiedCard key={l.id} listing={l} />)
              : (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B7280' }}>
                  <Home size={48} color="#D1D5DB" style={{ display: 'block', margin: '0 auto 16px' }} />
                  <p style={{ fontFamily: "'Outfit'", fontWeight: 600, fontSize: '18px', color: '#374151', margin: '0 0 8px' }}>No rentals found</p>
                  <p style={{ fontFamily: "'Outfit'", fontSize: '14px' }}>
                    Try adjusting your search or filters.
                  </p>
                </div>
              )
          }
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '48px', flexWrap: 'wrap' }}>
            <button
              onClick={() => goPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', border: '1px solid #D1D5DB',
                borderRadius: '10px', background: 'white', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1,
                fontFamily: "'Outfit'", fontSize: '14px', fontWeight: 500, color: '#374151',
              }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            {/* Page pills */}
            {(() => {
              const pills: (number | '…')[] = []
              const delta = 2
              for (let i = 1; i <= Math.min(totalPages, 3453); i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                  pills.push(i)
                } else if (pills[pills.length - 1] !== '…') {
                  pills.push('…')
                }
              }
              return pills.map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} style={{ padding: '0 6px', color: '#9CA3AF', fontFamily: "'Outfit'", fontSize: '14px' }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p as number)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      border: '1px solid',
                      borderColor: p === currentPage ? '#1428AE' : '#D1D5DB',
                      background: p === currentPage ? '#1428AE' : 'white',
                      color: p === currentPage ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontFamily: "'Outfit'", fontSize: '14px',
                      fontWeight: p === currentPage ? 700 : 400,
                      boxShadow: p === currentPage ? '0 2px 8px rgba(20,40,174,0.25)' : 'none',
                    }}
                  >
                    {p}
                  </button>
                )
              )
            })()}

            <button
              onClick={() => goPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', border: '1px solid #D1D5DB',
                borderRadius: '10px', background: 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
                fontFamily: "'Outfit'", fontSize: '14px', fontWeight: 500, color: '#374151',
              }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <p style={{ textAlign: 'center', fontFamily: "'Outfit'", fontSize: '13px', color: '#9CA3AF', marginTop: '12px' }}>
            Page {currentPage} of {totalPages.toLocaleString()} • {totalListings.toLocaleString()} total rentals
          </p>
        )}

        {/* Attribution */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
          <span style={{ fontFamily: "'Outfit'", fontSize: '12px', color: '#9CA3AF' }}>Additional listings powered by</span>
          <a href="https://rent.ph" target="_blank" rel="noopener noreferrer">
            <img src={RENTPH_LOGO} alt="Rent.PH" style={{ height: '18px', objectFit: 'contain' }} />
          </a>
        </div>
      </div>
    </>
  )
}
