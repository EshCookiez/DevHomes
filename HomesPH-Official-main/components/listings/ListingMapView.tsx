'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { BedDouble, Bath, Maximize2, MapPin, LayoutList } from 'lucide-react'
import type { PublicListingSearchRecord, ListingSearchMode } from '@/lib/property-search'
import type { PublicProject } from '@/lib/projects-public'
import type { ListingPopupData } from '@/components/projects/ProjectMap'

const ProjectMap = dynamic(() => import('@/components/projects/ProjectMap'), { ssr: false })

interface ListingMapViewProps {
  listings: PublicListingSearchRecord[]
  mode: ListingSearchMode
  searchParams: Record<string, string | undefined>
}

function ListingMapCard({
  listing,
  onClick,
  isSelected,
}: {
  listing: PublicListingSearchRecord
  onClick?: () => void
  isSelected?: boolean
}) {
  const [isHovered, setIsHovered] = React.useState(false)
  const price = listing.price
    ? `PHP ${Number(listing.price).toLocaleString()}`
    : 'Price on request'

  const unit = listing.project_units
  const beds = unit?.bedrooms
  const baths = unit?.bathrooms
  const area = unit?.floor_area_sqm

  const image =
    listing.property_listing_galleries[0]?.image_url ||
    listing.projects?.main_image_url ||
    `https://picsum.photos/seed/${listing.id}/260/186`

  const location = [
    listing.projects?.city_municipality,
    listing.projects?.province,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '260px',
        background: '#FFFFFF',
        borderRadius: '10px',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : undefined,
        outline: isSelected ? '2.5px solid #1428AE' : undefined,
        outlineOffset: '-2.5px',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered ? '0px 20px 40px rgba(0,33,67,0.12)' : undefined,
        zIndex: isHovered ? 50 : undefined,
        transition: 'transform 0.3s, box-shadow 0.3s',
        position: 'relative',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '260px',
          height: '185.71px',
          background: '#D9D9D9',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={image}
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Carousel dots */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '7.24px', height: '8px', background: '#FFFFFF', borderRadius: '50%' }} />
          <div style={{ width: '5.43px', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
          <div style={{ width: '5.43px', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
          <div style={{ width: '5.43px', height: '6px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ paddingTop: '14.72px' }}>
        {/* Price */}
        <div
          style={{
            fontFamily: 'Outfit',
            fontWeight: 500,
            fontSize: '25px',
            lineHeight: '25px',
            color: '#002143',
            marginBottom: '8px',
          }}
        >
          {price}
        </div>

        {/* Beds / Baths / Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <BedDouble size={20} color="#002143" />
          <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
            {beds !== null && beds !== undefined ? beds : '—'}
          </span>
          <Bath size={20} color="#002143" style={{ transform: 'scaleX(-1)' }} />
          <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
            {baths !== null && baths !== undefined ? baths : '—'}
          </span>
          <Maximize2 size={20} color="#002143" style={{ transform: 'scaleX(-1)' }} />
          <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
            {area !== null && area !== undefined && area > 0 ? `${area} sqm` : '—'}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: 'Outfit',
            fontWeight: 300,
            fontSize: '15px',
            lineHeight: '15px',
            color: '#002143',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {listing.title}
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily: 'Outfit',
            fontWeight: 300,
            fontSize: '13px',
            lineHeight: '13px',
            color: '#7D868F',
          }}
        >
          {location}
        </div>
      </div>
    </div>
  )
}

function listingsToMapProjects(listings: PublicListingSearchRecord[]): PublicProject[] {
  const projectMap = new Map<number, PublicProject & { _minPrice: number | null }>()

  for (const listing of listings) {
    const p = listing.projects
    if (!p?.id || p.latitude == null || p.longitude == null) continue

    if (!projectMap.has(p.id)) {
      projectMap.set(p.id, {
        id: p.id,
        name: p.name,
        slug: p.slug,
        project_type: p.project_type,
        status: 'published',
        province: p.province,
        city_municipality: p.city_municipality,
        price_range_min: listing.price,
        price_range_max: null,
        main_image_url:
          listing.property_listing_galleries[0]?.image_url ?? p.main_image_url,
        video_tour_url: null,
        is_featured: false,
        created_at: listing.created_at ?? '',
        latitude: p.latitude,
        longitude: p.longitude,
        developers_profiles: listing.developers_profiles
          ? {
              developer_name: listing.developers_profiles.developer_name ?? '',
              logo_url: listing.developers_profiles.logo_url,
            }
          : null,
        project_units: [],
        project_amenities: [],
        _minPrice: listing.price,
      })
    } else {
      const existing = projectMap.get(p.id)!
      if (
        listing.price !== null &&
        (existing._minPrice === null || listing.price < existing._minPrice)
      ) {
        existing.price_range_min = listing.price
        existing._minPrice = listing.price
      }
    }

    if (listing.project_units) {
      const proj = projectMap.get(p.id)!
      const unit = listing.project_units
      if (!proj.project_units.some((u) => u.id === unit.id)) {
        proj.project_units.push({
          id: unit.id,
          unit_type: unit.unit_type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          floor_area_sqm: unit.floor_area_sqm,
        })
      }
    }
  }

  return Array.from(projectMap.values())
}

export default function ListingMapView({ listings, mode, searchParams }: ListingMapViewProps) {
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null)
  const [mapProjectId, setMapProjectId] = useState<number | null>(null)

  const mapProjects = useMemo(() => listingsToMapProjects(listings), [listings])

  const selectedProjectId = mapProjectId

  const selectedProject =
    mapProjectId != null
      ? (mapProjects.find((p) => p.id === mapProjectId) ?? null)
      : null

  const selectedListingData = useMemo((): ListingPopupData | null => {
    if (selectedListingId == null) return null
    const l = listings.find((r) => r.id === selectedListingId)
    if (!l) return null
    return {
      price: l.price ?? null,
      bedrooms: l.project_units?.bedrooms ?? null,
      bathrooms: l.project_units?.bathrooms ?? null,
      floor_area_sqm: l.project_units?.floor_area_sqm ?? null,
      image_url: l.property_listing_galleries[0]?.image_url ?? l.projects?.main_image_url ?? null,
      title: l.title,
    }
  }, [selectedListingId, listings])

  const locationText = searchParams.location || 'Philippines'
  const contractText = mode === 'sale' ? 'sale' : 'rent'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '772px',
        width: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT PANEL (860px) ── */}
      <div
        style={{
          width: '860px',
          flexShrink: 0,
          height: '772px',
          position: 'relative',
          background: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar row */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '118px',
            background: '#FFFFFF',
            zIndex: 20,
            borderBottom: '1px solid #D3D3D3',
          }}
        >
          <Link
            href={{ query: { ...searchParams, view: 'list' } }}
            style={{
              position: 'absolute',
              top: '17px',
              left: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Outfit',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '16px',
              color: '#001392',
              textDecoration: 'none',
            }}
          >
            <svg width="8" height="16" viewBox="0 0 8 16" fill="none" style={{ transform: 'scaleX(-1)' }}>
              <path d="M1 1l6 7-6 7" stroke="#001392" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Return to regular search
          </Link>

          <button
            onClick={() => {
              const base = mode === 'sale' ? '/buy' : '/rent'
              window.location.href = base
            }}
            style={{
              position: 'absolute',
              top: '17px',
              left: '753px',
              fontFamily: 'Outfit',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '16px',
              color: '#001392',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear Filters
          </button>

          <h2
            style={{
              position: 'absolute',
              top: '63px',
              left: '20px',
              fontFamily: 'Outfit',
              fontWeight: 400,
              fontSize: '35px',
              lineHeight: '35px',
              color: '#002143',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Properties for {contractText} in {locationText}
          </h2>
        </div>

        {/* Scrollable cards area */}
        <div
          style={{
            position: 'absolute',
            top: '118px',
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingTop: '20px',
            paddingBottom: '40px',
          }}
          className="scrollbar-hide"
        >
          {listings.length === 0 ? (
            <div style={{ paddingTop: '80px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Outfit', fontSize: '18px', color: '#7D868F' }}>
                No properties found matching your filters.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 260px)',
                columnGap: '20px',
                rowGap: '32px',
              }}
            >
              {listings.map((listing) => (
                <ListingMapCard
                  key={listing.id}
                  listing={listing}
                  isSelected={selectedListingId === listing.id}
                  onClick={() => {
                    const newId = selectedListingId === listing.id ? null : listing.id
                    setSelectedListingId(newId)
                    setMapProjectId(newId != null ? (listing.projects?.id ?? null) : null)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL (map, flex-1) ── */}
      <div
        style={{
          flex: 1,
          height: '772px',
          position: 'relative',
          background: '#EBEBEB',
          overflow: 'hidden',
        }}
      >
        {/* List / Map toggle */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '10px',
            width: '229.67px',
            height: '45.73px',
            background: '#FFFFFF',
            border: '1px solid #D3D3D3',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            padding: '3px',
            zIndex: 1000,
            boxSizing: 'border-box',
          }}
        >
          <Link
            href={{ query: { ...searchParams, view: 'list' } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100px',
              height: '100%',
              fontFamily: 'Outfit',
              fontWeight: 300,
              fontSize: '18px',
              lineHeight: '18px',
              color: '#8187B0',
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <LayoutList size={18} color="#8187B0" />
            List
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flex: 1,
              height: '100%',
              background: '#DFE3FF',
              borderRadius: '8px',
              fontFamily: 'Outfit',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '18px',
              color: '#1428AE',
            }}
          >
            <MapPin size={18} color="#1428AE" />
            Map
          </div>
        </div>

        <ProjectMap
          projects={mapProjects}
          selectedProjectId={selectedProjectId}
          onMarkerClick={(id) => setMapProjectId((prev) => (prev === id ? null : id))}
          selectedProject={selectedProject}
          onPopupClose={() => { setMapProjectId(null); setSelectedListingId(null) }}
          selectedListing={selectedListingData}
        />
      </div>
    </div>
  )
}
