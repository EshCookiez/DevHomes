'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { MapPin, Building2, Search, Save, User, CheckCircle2, Loader2, Navigation } from 'lucide-react'
import { saveOrgAddressAction } from '@/app/dashboard/franchise/settings/actions'
import { toast } from 'sonner'

type LatLng = { lat: number; lng: number }
type Member = { id: string; name: string; email: string; roleLabel?: string }

interface Props {
  companyId: string
  companyName: string
  licenseNumber: string
  initialAddress: {
    full_address?: string
    street?: string
    city?: string
    state?: string
    zip_code?: string
    latitude?: number | null
    longitude?: number | null
    place_id?: string | null
  } | null
  currentSecretaryId: string | null
  availableMembers: Member[]
}

const libraries: ('places')[] = ['places']

const DEFAULT_CENTER: LatLng = { lat: 10.3157, lng: 123.8854 } // Cebu City fallback

export default function OrganizationSettingsMap({
  companyId,
  companyName: initialCompanyName,
  licenseNumber,
  initialAddress,
  currentSecretaryId,
  availableMembers,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  })

  // Form state
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [fullAddress, setFullAddress] = useState(initialAddress?.full_address ?? '')
  const [street, setStreet] = useState(initialAddress?.street ?? '')
  const [city, setCity] = useState(initialAddress?.city ?? '')
  const [state, setState] = useState(initialAddress?.state ?? '')
  const [zipCode, setZipCode] = useState(initialAddress?.zip_code ?? '')
  const [placeId, setPlaceId] = useState(initialAddress?.place_id ?? null)
  const [secretaryId, setSecretaryId] = useState(currentSecretaryId ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locating, setLocating] = useState(false)

  const initialLat = initialAddress?.latitude
  const initialLng = initialAddress?.longitude
  const [markerPos, setMarkerPos] = useState<LatLng>(
    initialLat && initialLng
      ? { lat: Number(initialLat), lng: Number(initialLng) }
      : DEFAULT_CENTER
  )
  const [mapCenter, setMapCenter] = useState<LatLng>(markerPos)

  // Autocomplete ref
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const onAutocompleteLoad = (ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place || !place.geometry?.location) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const newPos = { lat, lng }

    setMarkerPos(newPos)
    setMapCenter(newPos)
    setPlaceId(place.place_id ?? null)
    setFullAddress(place.formatted_address ?? '')

    // Parse components
    const components = place.address_components ?? []
    const get = (type: string) =>
      components.find((c) => c.types.includes(type))?.long_name ?? ''

    setStreet([get('street_number'), get('route')].filter(Boolean).join(' '))
    setCity(get('locality') || get('administrative_area_level_2'))
    setState(get('administrative_area_level_1'))
    setZipCode(get('postal_code'))
  }

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    reverseGeocode(pos)
  }, [])

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    reverseGeocode(pos)
  }, [])

  function reverseGeocode(pos: LatLng) {
    if (!window.google) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const place = results[0]
        setFullAddress(place.formatted_address)
        setPlaceId(place.place_id ?? null)
        const components = place.address_components ?? []
        const get = (type: string) =>
          components.find((c) => c.types.includes(type))?.long_name ?? ''
        setStreet([get('street_number'), get('route')].filter(Boolean).join(' '))
        setCity(get('locality') || get('administrative_area_level_2'))
        setState(get('administrative_area_level_1'))
        setZipCode(get('postal_code'))
      }
    })
  }

  function handleAutoLocate() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
        setMarkerPos(pos)
        setMapCenter(pos)
        reverseGeocode(pos)
        setLocating(false)
        toast.success('Location detected!')
      },
      (err) => {
        setLocating(false)
        toast.error('Could not detect location. Please allow location access in your browser.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const result = await saveOrgAddressAction({
      companyId,
      companyName,
      fullAddress,
      street,
      city,
      state,
      zipCode,
      latitude: markerPos.lat,
      longitude: markerPos.lng,
      placeId,
      secretaryProfileId: secretaryId || null,
    })
    setSaving(false)
    if (result.success) {
      setSaved(true)
      toast.success('Organization settings saved!')
      setTimeout(() => setSaved(false), 3000)
    } else {
      toast.error(result.message || 'Failed to save.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">Organization Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Configure your master franchise profile, address, and team roles.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0c1f4a] hover:bg-[#163880] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left Column: Form ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Company Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-[#0c1f4a]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Franchise Info</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Franchise Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. HomesPH Cebu"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">License / PRC No.</label>
              <input
                defaultValue={licenseNumber}
                readOnly
                className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Address Search */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-[#0c1f4a]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Head Office Address</h3>
            </div>

            {isLoaded ? (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                  <input
                    type="text"
                    placeholder="Search address or landmark…"
                    defaultValue={fullAddress}
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                  />
                </Autocomplete>
              </div>
            ) : (
              <div className="h-9 bg-gray-100 animate-pulse rounded-lg" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Cebu City" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Province / Region</label>
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Cebu" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Street Address</label>
              <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="e.g. 19 J. Luna St." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Zip Code</label>
              <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="6000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30" />
            </div>

            {/* Full address preview */}
            {fullAddress && (
              <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 font-medium">
                📍 {fullAddress}
              </p>
            )}
          </div>

          {/* Secretary */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-[#0c1f4a]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Master Secretary</h3>
            </div>
            <p className="text-xs text-slate-500">Assign a member who has already been promoted to Main Secretary from My Team.</p>
            {availableMembers.length > 0 ? (
              <select
                value={secretaryId}
                onChange={(e) => setSecretaryId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
              >
                <option value="">— Unassigned —</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.roleLabel ? `• ${m.roleLabel}` : ''} {m.email ? `(${m.email})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                No Main Secretary candidates found. Promote one from My Team first, then assign them here.
              </p>
            )}
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              Members keep their main app role as salesperson. Main Secretary is a separate franchise responsibility you assign here after promotion.
            </p>
          </div>
        </div>

        {/* ── Right Column: Map ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Location Pin</h3>
              <p className="text-xs text-slate-500 mt-0.5">Drag the marker or click the map to refine location</p>
            </div>
            <button
              onClick={handleAutoLocate}
              disabled={locating || !isLoaded}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#0c1f4a]/20 bg-[#0c1f4a]/5 text-[#0c1f4a] hover:bg-[#0c1f4a]/10 transition-colors disabled:opacity-50"
            >
              {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              {locating ? 'Detecting…' : 'Use My Location'}
            </button>
          </div>

          <div className="flex-1 min-h-[420px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={15}
                onClick={onMapClick}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                  zoomControl: true,
                  styles: [
                    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8f0' }] },
                    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f5e5' }] },
                  ],
                }}
              >
                <Marker
                  position={markerPos}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-slate-400 text-sm gap-2">
                <Loader2 size={18} className="animate-spin" /> Loading map…
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-slate-400">
              📌 Lat: <span className="font-mono font-semibold text-slate-700">{markerPos.lat.toFixed(6)}</span>
              &nbsp;·&nbsp;
              Lng: <span className="font-mono font-semibold text-slate-700">{markerPos.lng.toFixed(6)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
