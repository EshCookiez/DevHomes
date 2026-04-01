'use client'

import React, { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PublicProject } from '@/lib/projects-public'
import { BedDouble, Bath, Square } from 'lucide-react'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

interface ProjectMapProps {
  projects: PublicProject[]
  selectedProjectId?: number | null
  onMarkerClick?: (projectId: number) => void
}

export default function ProjectMap({ projects, selectedProjectId, onMarkerClick }: ProjectMapProps) {
  const [activeMarker, setActiveMarker] = useState<number | null>(null)

  // Fix Leaflet default marker icons in Next.js/webpack
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])

  const validProjects = useMemo(() =>
    projects.filter(p => p.latitude && p.longitude),
    [projects]
  )

  return (
    <MapContainer
      center={[14.6760, 121.0437]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validProjects.map((p) => (
        <Marker
          key={p.id}
          position={[Number(p.latitude), Number(p.longitude)]}
          eventHandlers={{
            click: () => {
              setActiveMarker(p.id)
              if (onMarkerClick) onMarkerClick(p.id)
            }
          }}
        >
          <Popup>
            <div className="w-[240px] font-outfit">
              <div className="relative aspect-[16/10] mb-2 overflow-hidden rounded-[6px]">
                <img
                  src={p.main_image_url || `https://picsum.photos/seed/${p.slug}/300/200`}
                  className="w-full h-full object-cover"
                  alt={p.name}
                />
              </div>
              <p className="text-[15px] font-semibold text-[#002143] mb-1">
                ₱ {Number(p.price_range_min).toLocaleString()}
              </p>
              <div className="flex items-center gap-3 text-[#002143] mb-1 opacity-80">
                <div className="flex items-center gap-1">
                  <BedDouble size={13} />
                  <span className="text-[12px] font-light">{Math.max(...(p.project_units?.map(u => u.bedrooms ?? 0) ?? [0]))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath size={13} />
                  <span className="text-[12px] font-light">{Math.max(...(p.project_units?.map(u => u.bathrooms ?? 0) ?? [0]))}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square size={12} />
                  <span className="text-[12px] font-light">{Math.max(...(p.project_units?.map(u => u.floor_area_sqm ?? 0) ?? [0]))} sqm</span>
                </div>
              </div>
              <p className="text-[12px] font-light text-[#002143] line-clamp-1">
                {p.name}, {p.city_municipality}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
