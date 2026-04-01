'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useMap } from 'react-leaflet'
import SortDropdown from '@/components/projects/SortDropdown'
import { LayoutList, Map as MapIcon, ListFilter, ChevronDown, Heart, Layout, MapPin, Phone, Mail, MessageSquareMore, BedDouble, Bath, Square, ChevronLeft, ChevronRight } from 'lucide-react'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])
  return null
}

interface ProjectListingsSectionProps {
  project: {
    id: number
    name: string
    city_municipality: string | null
    latitude: number | null
    longitude: number | null
    project_units?: any[]
    slug?: string
  }
  projectListings: any[]
  saleListings: any[]
  rentListings: any[]
  initialView?: 'list' | 'map'
}

export default function ProjectListingsSection({ project, projectListings, saleListings, rentListings, initialView = 'list' }: ProjectListingsSectionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'map' ? 'map' : 'list'
  const sort = searchParams.get('sort') || ''

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

  // Fix Leaflet default marker icons in Next.js/webpack
  useEffect(() => {
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const mapCenter: [number, number] = project.latitude && project.longitude
    ? [Number(project.latitude), Number(project.longitude)]
    : [14.6760, 121.0437]

  const ListMapToggle = ({ activeView }: { activeView: 'list' | 'map' }) => (
    <div className="flex items-center border border-[#D3D3D3] rounded-lg bg-white shadow-sm h-[48px] p-1">
      <button
        onClick={() => setView('list')}
        className={`flex items-center justify-center gap-2 w-[105px] h-full text-[18px] transition-colors rounded-[8px] font-outfit ${activeView === 'list' ? 'bg-[#DFE3FF] text-[#1428ae] font-medium' : 'text-gray-400 font-light hover:text-[#002143] hover:bg-gray-50'}`}
      >
        <LayoutList size={18} />
        List
      </button>
      <button
        onClick={() => setView('map')}
        className={`flex items-center justify-center gap-2 w-[105px] h-full text-[18px] transition-colors rounded-[8px] font-outfit ${activeView === 'map' ? 'bg-[#DFE3FF] text-[#1428ae] font-medium' : 'text-gray-400 font-light hover:text-[#002143] hover:bg-gray-50'}`}
      >
        <MapIcon size={18} />
        Map
      </button>
    </div>
  )

  if (view === 'map') {
    return (
      <div className="flex h-[calc(100vh-116px)] -mx-4 md:-mx-8 lg:-mx-12 xl:-mx-24 2xl:-mx-[296px] -mt-8">
        {/* Left Side: Scrollable Listing Cards */}
        <div className="w-[45%] h-full overflow-y-auto px-8 py-6 bg-white border-r border-gray-200 scrollbar-hide">
          {/* Action links */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-[#001392] font-outfit font-medium text-[16px] hover:underline transition-all"
            >
              <ChevronLeft size={18} />
              Return to regular search
            </button>
            <Link 
              href="/projects"
              className="text-[#001392] font-outfit font-medium text-[16px] hover:underline"
            >
              Clear Filters
            </Link>
          </div>

          <h2 className="text-[35px] font-outfit font-normal text-[#002143] mb-8 leading-tight">
            Properties for {rentListings.length > 0 ? 'rent' : 'sale'} {project.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {sortedListings.map((l: any) => (
              <div key={l.id} className="group bg-white rounded-[10px] border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={l.property_listing_galleries?.[0]?.image_url || `https://picsum.photos/seed/list${l.id}/400/300`}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  </div>
                </div>
                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[20px] font-outfit font-medium text-[#002143] mb-1">
                    ₱ {Number(l.price).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 text-[#002143] mb-3">
                    <div className="flex items-center gap-1.5">
                      <BedDouble size={18} />
                      <span className="text-[14px] font-outfit font-light">{l.project_units?.bedrooms || 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath size={18} />
                      <span className="text-[14px] font-outfit font-light">{l.project_units?.bathrooms || 2}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Square size={16} />
                      <span className="text-[14px] font-outfit font-light">{l.project_units?.floor_area_sqm || 0} sqm</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 text-[#002143]">
                    <MapPin size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[13px] font-outfit font-light leading-snug line-clamp-1">
                      {project.name}, {project.city_municipality}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projectListings.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-xl font-outfit text-gray-500">No listings found for this project.</p>
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="flex-1 h-full bg-gray-100 relative">
          <MapContainer center={mapCenter} zoom={15} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
            <MapResizer />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {project.latitude && project.longitude && (
              <Marker position={mapCenter}>
                <Popup>
                  <div className="font-outfit">
                    <p className="font-semibold text-[#002143]">{project.name}</p>
                    <p className="text-[12px] font-light text-[#002143]">{project.city_municipality}, Philippines</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* List / Map toggle */}
          <div className="absolute top-4 left-4 z-[1000]">
            <ListMapToggle activeView="map" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full lg:max-w-none lg:w-[941px]">
        <h2 className="text-[35px] font-normal font-outfit text-[#002143]">
          Properties for {rentListings.length > 0 ? 'rent' : 'sale'} {project.name}
        </h2>

        <div className="flex items-center gap-4">
          <SortDropdown />
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
              ({projectListings.filter((l: any) => l.project_unit_id === u.id).length || Math.floor(Math.random() * 10) + 1})
            </span>
          </button>
        ))}
      </div>

      {/* Listing Cards */}
      <div className="space-y-8">
        {sortedListings.map((l: any) => (
          <div key={l.id} className="bg-white rounded-[10px] w-[941px] h-[316px] border border-[#D3D3D3] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row group p-[11px] gap-[11px]">
            {/* Card Image */}
            <div className="w-full lg:w-[451px] h-[280px] lg:h-[294px] relative bg-gray-100 shrink-0 rounded-[10px] overflow-hidden">
              <img
                src={l.property_listing_galleries?.[0]?.image_url || `https://picsum.photos/seed/list${l.id}/600/400`}
                alt={l.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <div className="h-[32px] bg-gradient-to-r from-[#2D43D8] to-[#081148] text-white px-4 rounded-r-[10px] flex items-center text-[15px] font-light font-outfit">
                  TopBroker
                </div>
              </div>
              <button className="absolute top-3 right-3 bg-white/30 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-white transition-colors group/heart">
                <Heart size={20} className="text-white group-hover/heart:text-[#1428ae]" />
              </button>
            </div>

            {/* Card Content */}
            <div className="flex-1 flex flex-col justify-between py-1 lg:py-2 pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[30px] font-medium text-[#002143] font-outfit mt-1">Php</span>
                  <h3 className="text-[40px] font-medium text-[#002143] font-outfit leading-none">{Number(l.price).toLocaleString()}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[15px] font-light text-[#002143] font-outfit">
                  <span>Apartment</span>
                  <div className="w-px h-5 bg-[#D3D3D3] hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Layout size={18} className="text-[#002143]" />
                    <span>{l.project_units?.bedrooms || 1}</span>
                  </div>
                  <div className="w-px h-5 bg-[#D3D3D3] hidden md:block" />
                  <div className="flex items-center gap-2">
                    <LayoutList size={18} className="text-[#002143]" />
                    <span>{l.project_units?.bathrooms || 2}</span>
                  </div>
                  <div className="w-px h-5 bg-[#D3D3D3] hidden md:block" />
                  <span>Area: {l.project_units?.floor_area_sqm || 500} sqm</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {['Spacious 1BR Apartment', 'High Finishing', 'Prime Location'].map((tag, i) => (
                    <React.Fragment key={i}>
                      <span className="text-[15px] font-light text-[#1428AE] font-outfit whitespace-nowrap">{tag}</span>
                      {i < 2 && <div className="w-px h-4 bg-[#D3D3D3] hidden md:block" />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[#002143] text-[15px] font-light font-outfit">
                  <MapPin size={18} className="text-[#002143]" />
                  <span>{project.name}, {project.city_municipality}, Philippines</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6 lg:mt-0">
                <button className="flex-1 h-[50px] bg-[#DFE3FF] text-[#1428AE] rounded-[10px] font-normal text-[18px] flex items-center justify-center gap-2 hover:bg-[#D0D7FF] transition-all font-outfit shadow-sm">
                  <Mail size={20} /> Email
                </button>
                <button className="flex-1 h-[50px] bg-[#DFE3FF] text-[#1428AE] rounded-[10px] font-normal text-[18px] flex items-center justify-center gap-2 hover:bg-[#D0D7FF] transition-all font-outfit shadow-sm">
                  <Phone size={20} /> Call
                </button>
                <button className="flex-[1.5] h-[50px] bg-[#E1FFDF] text-[#00A629] rounded-[10px] font-normal text-[18px] flex items-center justify-center gap-2 hover:bg-[#D4F7DB] transition-all font-outfit shadow-sm">
                  <MessageSquareMore size={20} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

