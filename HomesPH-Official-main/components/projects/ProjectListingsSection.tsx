'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import SortDropdown from '@/components/projects/SortDropdown'
import { LayoutList, Map as MapIcon, ListFilter, ChevronDown, Heart, Layout, MapPin, Phone, Mail, MessageSquareMore, BedDouble, Bath, Square, ChevronLeft, ChevronRight } from 'lucide-react'
import ListingMapView from '@/components/listings/ListingMapView'
import type { PublicListingSearchRecord } from '@/lib/property-search'

interface ProjectListingsSectionProps {
  project: {
    id: number
    name: string
    slug?: string
    city_municipality: string | null
    province?: string | null
    project_type?: string | null
    classification?: string | null
    main_image_url?: string | null
    latitude: number | null
    longitude: number | null
    project_units?: any[]
    developers_profiles?: { developer_name?: string | null; logo_url?: string | null } | null
  }
  projectListings: any[]
  saleListings: any[]
  rentListings: any[]
  initialView?: 'list' | 'map'
}

import UnifiedListingCard from '@/components/listings/UnifiedListingCard'

export default function ProjectListingsSection({ project, projectListings, saleListings, rentListings, initialView = 'list' }: ProjectListingsSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'map' ? 'map' : 'list'
  const sort = searchParams.get('sort') || ''

  // Build normalised searchParams for ListingMapView
  const normalizedSearchParams = useMemo(() => {
    const result: Record<string, string | undefined> = {}
    searchParams.forEach((value, key) => { result[key] = value })
    return result
  }, [searchParams])

  // Adapt project listings to PublicListingSearchRecord shape for ListingMapView
  const adaptedListings = useMemo((): PublicListingSearchRecord[] => {
    return projectListings.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? null,
      listing_type: l.listing_type ?? null,
      status: l.status ?? null,
      currency: l.currency ?? null,
      price: l.price ?? null,
      negotiable: l.negotiable ?? null,
      is_featured: l.is_featured ?? null,
      created_at: l.created_at ?? null,
      developers_profiles: project.developers_profiles
        ? {
            developer_name: project.developers_profiles.developer_name ?? null,
            logo_url: project.developers_profiles.logo_url ?? null,
          }
        : null,
      user_profiles: null,
      projects: {
        id: project.id,
        name: project.name,
        slug: project.slug ?? project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        city_municipality: project.city_municipality,
        province: project.province ?? null,
        barangay: null,
        region: null,
        project_type: project.project_type ?? null,
        classification: project.classification ?? null,
        main_image_url: project.main_image_url ?? null,
        latitude: project.latitude,
        longitude: project.longitude,
      },
      project_units: l.project_units
        ? {
            id: l.project_units.id,
            project_id: l.project_units.project_id,
            unit_name: l.project_units.unit_name ?? null,
            unit_type: l.project_units.unit_type ?? '',
            bedrooms: l.project_units.bedrooms ?? null,
            bathrooms: l.project_units.bathrooms ?? null,
            floor_area_sqm: l.project_units.floor_area_sqm ?? null,
            lot_area_sqm: l.project_units.lot_area_sqm ?? null,
            has_parking: l.project_units.has_parking ?? null,
            has_balcony: l.project_units.has_balcony ?? null,
            is_furnished: l.project_units.is_furnished ?? null,
            is_rfo: l.project_units.is_rfo ?? null,
            selling_price: l.project_units.selling_price ?? null,
          }
        : null,
      property_listing_galleries: l.property_listing_galleries ?? [],
      project_amenities: [],
    }))
  }, [projectListings, project])

  const sortedListings = React.useMemo(() => {
    const list = [...projectListings]
    if (sort === 'price-low') {
      return list.sort((a, b) => Number(a.price) - Number(b.price))
    }
    if (sort === 'price-high') {
      return list.sort((a, b) => Number(b.price) - Number(a.price))
    }
    if (sort === 'newest') {
      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return list // Popular/default
  }, [projectListings, sort])

  const setView = (newView: 'list' | 'map') => {
    const params = new URLSearchParams(searchParams.toString())
    if (newView === 'list') {
      params.delete('view')
    } else {
      params.set('view', 'map')
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const ListMapToggle = ({ activeView }: { activeView: 'list' | 'map' }) => (
    <div className="flex items-center border border-[#D3D3D3] rounded-[10px] bg-white h-[45px] p-[3px] w-[226px]">
      <button
        onClick={() => setView('list')}
        className={`flex items-center justify-center gap-2 w-[105px] h-[39px] text-[18px] transition-colors rounded-[8px] font-outfit ${activeView === 'list' ? 'bg-[#DFE3FF] text-[#1428ae] font-medium' : 'text-[#8187B0] font-light hover:text-[#002143] hover:bg-gray-50'}`}
      >
        <LayoutList size={20} />
        List
      </button>
      <button
        onClick={() => setView('map')}
        className={`flex items-center justify-center gap-2 w-[105px] h-[39px] text-[18px] transition-colors rounded-[8px] font-outfit ${activeView === 'map' ? 'bg-[#DFE3FF] text-[#1428ae] font-medium' : 'text-[#8187B0] font-light hover:text-[#002143] hover:bg-gray-50'}`}
      >
        <MapIcon size={20} />
        Map
      </button>
    </div>
  )

  if (view === 'map') {
    const mode = rentListings.length > 0 && saleListings.length === 0 ? 'rent' : 'sale'
    return (
      <ListingMapView
        listings={adaptedListings}
        mode={mode}
        searchParams={normalizedSearchParams}
      />
    )
  }

  return (
    <>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full lg:max-w-none lg:w-[941px]">
        <h2 className="text-[35px] font-normal font-outfit text-[#002143]">
          Properties for {rentListings.length > 0 ? 'rent' : 'sale'} {project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name}
        </h2>

        <div className="flex items-center gap-[15px] shrink-0">
          <div className="relative">
            <button className="flex items-center justify-between px-[12px] gap-[6px] border border-[#D3D3D3] rounded-[10px] bg-white text-[18px] font-outfit font-light text-[#002143] hover:bg-gray-50 transition-colors cursor-pointer shrink-0" style={{ width: '149px', height: '45px' }}>
              <div className="flex items-center gap-[6px]">
                <LayoutList size={22} className="text-[#002143]" />
                <span className="truncate">Popular</span>
              </div>
              <ChevronDown size={22} className="text-[#002143] transition-transform" />
            </button>
          </div>
          <ListMapToggle activeView="list" />
        </div>
      </div>

      {/* Grouping Tags Bar */}
      <div className="bg-white rounded-[10px] border border-[#D3D3D3] px-5 flex items-center justify-center gap-x-12 h-[65px] w-full lg:w-[941px] overflow-x-auto scrollbar-hide shrink-0">
        {project.project_units?.map((u: any, idx: number) => (
          <button 
            key={u.id} 
            className="flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity"
          >
            <span className="text-[18px] font-normal font-outfit text-[#1428AE]">{project.name} {u.unit_name || u.unit_type}</span>
            <span className="text-[18px] font-normal font-outfit text-[#002143]">
              ({projectListings.filter((l: any) => l.project_unit_id === u.id).length || 4})
            </span>
          </button>
        ))}
      </div>

      {/* Listing Cards */}
      <div className="space-y-8">
        {sortedListings.map((l: any) => (
          <UnifiedListingCard
            key={l.id}
            variant="buy-rent"
            href={`/listings/${l.id}`}
            imageUrl={l.property_listing_galleries?.[0]?.image_url || '/properties/placeholder.jpg'}
            price={Number(l.selling_price || l.price || 0)}
            propertyType={l.project_units?.unit_type || l.property_type || 'Residential'}
            bedrooms={l.project_units?.bedrooms || l.bedrooms || 0}
            bathrooms={l.project_units?.bathrooms || l.bathrooms || 0}
            areaSqm={l.project_units?.floor_area_sqm || l.floor_area_sqm || 0}
            listingTitle={l.title}
            tags={[l.project_units?.unit_name, l.listing_type === 'rent' ? 'For Rent' : 'For Sale'].filter(Boolean)}
            location={`${project.name}, ${project.city_municipality || ''}, Philippines`}
            developerName={project.developers_profiles?.developer_name}
            developerLogoUrl={project.developers_profiles?.logo_url}
          />
        ))}
      </div>
    </>
  )
}

