'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { PublicProject } from '@/lib/projects-public'
import { BedDouble, Bath, Maximize2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

export interface ListingPopupData {
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  floor_area_sqm: number | null
  image_url: string | null
  title: string
}

interface ProjectMapProps {
  projects: PublicProject[]
  selectedProjectId?: number | null
  onMarkerClick?: (projectId: number) => void
  selectedProject?: PublicProject | null
  onPopupClose?: () => void
  selectedListing?: ListingPopupData | null
}

interface LandmarkPin {
  id: string
  name: string
  category: string
  distanceMiles: number
  imageUrl: string | null
  latitude: number
  longitude: number
}

function FitBoundsOnMount({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) { map.setView(points[0], 13); return }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet')
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function FlyToSelected({ projects, selectedProjectId }: { projects: PublicProject[]; selectedProjectId: number | null }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedProjectId) return
    const p = projects.find(proj => proj.id === selectedProjectId)
    if (!p?.latitude || !p?.longitude) return
    map.flyTo([Number(p.latitude), Number(p.longitude)], 14, { duration: 0.8 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId])
  return null
}

function PopupCard({ project, onClose, listing }: { project: PublicProject; onClose: () => void; listing?: ListingPopupData | null }) {
  const price = listing?.price != null
    ? ('PHP ' + Number(listing.price).toLocaleString())
    : project.price_range_min
      ? ('PHP ' + Number(project.price_range_min).toLocaleString())
      : 'Price on request'
  const units = project.project_units ?? []
  const beds = listing != null ? listing.bedrooms : (units.length > 0 ? Math.max(...units.map(u => u.bedrooms ?? 0)) : null)
  const baths = listing != null ? listing.bathrooms : (units.length > 0 ? Math.max(...units.map(u => u.bathrooms ?? 0)) : null)
  const area = listing != null ? listing.floor_area_sqm : (units.length > 0 ? Math.max(...units.map(u => u.floor_area_sqm ?? 0)) : null)
  const imgSrc = listing?.image_url || project.main_image_url || ('https://picsum.photos/seed/' + project.slug + '/300/200')
  const location = [project.name, project.city_municipality, project.province].filter(Boolean).join(', ')

  return (
    <div style={{ position: 'relative', width: '331px' }}>
      {/* Card body */}
      <div
        style={{
          width: '331px',
          background: '#FFFAF1',
          boxShadow: '0px 0px 5px rgba(20, 40, 174, 0.2)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '8px', right: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: '#7D868F', lineHeight: '1', padding: '0', zIndex: 1,
          }}
        >
          &times;
        </button>

        {/* Image */}
        <div style={{ width: '104px', height: '78px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#D9D9D9' }}>
          <img src={imgSrc} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 500, fontSize: '22px', lineHeight: '22px', color: '#002143', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {price}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BedDouble size={15} color="#002143" />
            <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '12px', lineHeight: '12px', color: '#002143' }}>{beds !== null && beds !== undefined ? beds : '\u2014'}</span>
            <Bath size={15} color="#002143" style={{ transform: 'scaleX(-1)' }} />
            <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '12px', lineHeight: '12px', color: '#002143' }}>{baths !== null && baths !== undefined ? baths : '\u2014'}</span>
            <Maximize2 size={15} color="#002143" style={{ transform: 'scaleX(-1)' }} />
            <span style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '12px', lineHeight: '12px', color: '#002143' }}>{area !== null && area !== undefined && area > 0 ? (area + ' sqm') : '\u2014'}</span>
          </div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 300, fontSize: '12px', lineHeight: '12px', color: '#002143', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {location}
          </div>
        </div>
      </div>

      {/* Downward triangle pointer */}
      <div style={{ position: 'absolute', bottom: '-17px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '18px solid #FFFAF1' }} />

      {/* House anchor circle */}
      <div
        style={{
          position: 'absolute', bottom: '-53px', left: '50%',
          transform: 'translateX(-50%)',
          width: '35.57px', height: '35.57px',
          background: '#FFFAF1',
          boxShadow: '0px 2px 5px rgba(3, 10, 60, 0.3)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="#001392">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Runs inside <MapContainer> to track the selected marker's pixel position.
 * Fires onPosition with container-relative {x,y} whenever it changes, so the
 * popup can be rendered as a normal React div OUTSIDE the Leaflet DOM tree.
 */
function MarkerPositionTracker({
  selectedProject,
  onPosition,
}: {
  selectedProject: PublicProject | null
  onPosition: (pos: { x: number; y: number } | null) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedProject?.latitude || !selectedProject?.longitude) {
      onPosition(null)
      return
    }
    const latLng: [number, number] = [
      Number(selectedProject.latitude),
      Number(selectedProject.longitude),
    ]
    const update = () => {
      const pt = map.latLngToContainerPoint(latLng)
      onPosition({ x: pt.x, y: pt.y })
    }
    update()
    map.on('move zoom resize', update)
    return () => {
      map.off('move zoom resize', update)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedProject])

  return null
}

function EnsureLandmarkPane() {
  const map = useMap()

  useEffect(() => {
    let markerPane = map.getPane('landmarkMarkerPane')
    if (!markerPane) {
      markerPane = map.createPane('landmarkMarkerPane')
    }
    markerPane.style.zIndex = '1200'
    markerPane.style.pointerEvents = 'auto'

    let tooltipPane = map.getPane('landmarkTooltipPane')
    if (!tooltipPane) {
      tooltipPane = map.createPane('landmarkTooltipPane')
    }
    tooltipPane.style.zIndex = '1600'
    tooltipPane.style.pointerEvents = 'auto'
  }, [map])

  return null
}

export default function ProjectMap({ projects, selectedProjectId, onMarkerClick, selectedProject, onPopupClose, selectedListing }: ProjectMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(1)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)
  const [landmarkPins, setLandmarkPins] = useState<LandmarkPin[]>([])
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const landmarkHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onPosition = useCallback((pos: { x: number; y: number } | null) => setPopupPos(pos), [])

  const cancelLandmarkHide = useCallback(() => {
    if (landmarkHideTimerRef.current) {
      clearTimeout(landmarkHideTimerRef.current)
      landmarkHideTimerRef.current = null
    }
  }, [])

  const scheduleLandmarkHide = useCallback((landmarkId: string) => {
    cancelLandmarkHide()
    landmarkHideTimerRef.current = setTimeout(() => {
      setHoveredLandmarkId((prev) => (prev === landmarkId ? null : prev))
    }, 180)
  }, [cancelLandmarkHide])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
    setIsClient(true)
  }, [])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove() } catch {}
        mapRef.current = null
      }
      if (landmarkHideTimerRef.current) {
        clearTimeout(landmarkHideTimerRef.current)
        landmarkHideTimerRef.current = null
      }
      setMapKey(k => k + 1)
    }
  }, [])

  const validProjects = useMemo(
    () => projects.filter(p => p.latitude && p.longitude),
    [projects]
  )

  const markerPoints = useMemo(
    () => validProjects.map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [validProjects]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchLandmarks() {
      if (!selectedProject?.latitude || !selectedProject?.longitude) {
        if (!cancelled) setLandmarkPins([])
        return
      }

      const params = new URLSearchParams({
        lat: String(selectedProject.latitude),
        lng: String(selectedProject.longitude),
      })
      if (selectedProject.city_municipality) params.set('city', selectedProject.city_municipality)
      if (selectedProject.province) params.set('province', selectedProject.province)

      try {
        const res = await fetch(`/api/landmarks/nearby?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Landmark API failed: ${res.status}`)
        const data = (await res.json()) as { landmarks?: LandmarkPin[] }
        if (!cancelled) setLandmarkPins(data.landmarks ?? [])
      } catch {
        if (!cancelled) setLandmarkPins([])
      }
    }

    fetchLandmarks()

    return () => {
      cancelled = true
    }
  }, [selectedProject])

  function makeIcon(count: number) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet')
    const html =
      '<div style="position:relative;width:57px;height:37px;">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:30px;background:#DFE3FF;border:1.5px solid #1428AE;border-radius:10px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:4px;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#1428AE"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' +
          '<span style="font-family:Outfit,sans-serif;font-weight:300;font-size:15px;line-height:15px;color:#1428AE;">' + count + '</span>' +
        '</div>' +
        '<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:9px solid #1428AE;"></div>' +
        '<div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid #DFE3FF;"></div>' +
      '</div>'
    return new L.DivIcon({ html, className: '', iconSize: [57, 37], iconAnchor: [28, 37], popupAnchor: [0, -40] })
  }

  function makeLandmarkIcon() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet')
    const html =
      '<div style="width:30.49px;height:30.49px;display:flex;align-items:center;justify-content:center;">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="30.49" height="30.49" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path fill="#1428AE" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>' +
      '</svg>' +
      '</div>'
    return new L.DivIcon({ html, className: '', iconSize: [30.49, 30.49], iconAnchor: [15.24, 30.49] })
  }

  // iconAnchor=[28,37] → pos.y is the pin's bottom tip.
  // Popup wrapper top = pos.y - (card ~99px) - (triangle 17px) - (circle 35px) - (pin 37px) = pos.y - 188
  const popupTop = popupPos ? popupPos.y - 188 : 0
  const popupLeft = popupPos ? popupPos.x - 165.5 : 0 // centre 331px card

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer key={mapKey} ref={mapRef} center={[12.0, 122.0]} zoom={6} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isClient && (
          <>
            <FitBoundsOnMount points={markerPoints} />
            <FlyToSelected projects={validProjects} selectedProjectId={selectedProjectId ?? null} />
            <EnsureLandmarkPane />
            <MarkerPositionTracker selectedProject={selectedProject ?? null} onPosition={onPosition} />
            {validProjects.map((p) => (
              <Marker
                key={p.id}
                position={[Number(p.latitude), Number(p.longitude)]}
                icon={makeIcon(p.project_units?.length ?? 0)}
                eventHandlers={{ click: () => { if (onMarkerClick) onMarkerClick(p.id) } }}
              />
            ))}
            {landmarkPins.map((landmark) => (
              <Marker
                key={landmark.id}
                position={[landmark.latitude, landmark.longitude]}
                icon={makeLandmarkIcon()}
                pane="landmarkMarkerPane"
                zIndexOffset={hoveredLandmarkId === landmark.id ? 1000 : 0}
                eventHandlers={{
                  mouseover: () => {
                    cancelLandmarkHide()
                    setHoveredLandmarkId(landmark.id)
                  },
                  mouseout: () => {
                    scheduleLandmarkHide(landmark.id)
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  opacity={1}
                  pane="landmarkTooltipPane"
                  interactive
                  permanent={hoveredLandmarkId === landmark.id}
                  eventHandlers={{
                    mouseover: () => {
                      cancelLandmarkHide()
                      setHoveredLandmarkId(landmark.id)
                    },
                    mouseout: () => {
                      scheduleLandmarkHide(landmark.id)
                    },
                  }}
                >
                  <div
                    style={{
                      width: '220px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      boxShadow: '0 8px 24px rgba(0, 33, 67, 0.18)',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    <div style={{ width: '220px', height: '118px', background: '#D9D9D9' }}>
                      {landmark.imageUrl ? (
                        <img
                          src={landmark.imageUrl}
                          alt={landmark.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '12px' }}>
                          No photo available
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', lineHeight: '16px', color: '#002143', marginBottom: '4px' }}>
                        {landmark.name}
                      </div>
                      <div style={{ fontWeight: 300, fontSize: '12px', lineHeight: '14px', color: '#4B5563', marginBottom: '6px' }}>
                        {landmark.category}
                      </div>
                      <div style={{ fontWeight: 500, fontSize: '12px', lineHeight: '14px', color: '#1428AE' }}>
                        {landmark.distanceMiles.toFixed(1)} miles away from this project
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>

      {/* Popup rendered in normal React DOM, outside Leaflet's container */}
      {selectedProject && popupPos && !hoveredLandmarkId && (
        <div
          style={{
            position: 'absolute',
            top: popupTop,
            left: popupLeft,
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <PopupCard project={selectedProject} onClose={onPopupClose ?? (() => {})} listing={selectedListing} />
        </div>
      )}
    </div>
  )
}