'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Building2, CheckCircle2, Loader2, MapPin, Navigation, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { fetchSecretaryOfficeDetails, saveSecretaryOfficeDetailsAction } from './actions'

type LatLng = { lat: number; lng: number }

type OfficeForm = {
  companyName: string
  addressId: number | null
  fullAddress: string
  street: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  placeId: string
}

const EMPTY_FORM: OfficeForm = {
  companyName: '',
  addressId: null,
  fullAddress: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  latitude: null,
  longitude: null,
  placeId: '',
}

const libraries: ('places')[] = ['places']
const DEFAULT_CENTER: LatLng = { lat: 10.3157, lng: 123.8854 }

export default function SecretaryOfficePage() {
  const [form, setForm] = useState<OfficeForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locating, setLocating] = useState(false)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  })

  const [markerPos, setMarkerPos] = useState<LatLng>(DEFAULT_CENTER)
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const office = await fetchSecretaryOfficeDetails()
        setForm(office)
        if (office.latitude && office.longitude) {
          const position = { lat: Number(office.latitude), lng: Number(office.longitude) }
          setMarkerPos(position)
          setMapCenter(position)
        } else {
          setMarkerPos(DEFAULT_CENTER)
          setMapCenter(DEFAULT_CENTER)
        }
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const handleChange = (key: keyof OfficeForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const applyAddressDetails = useCallback(
    (details: {
      fullAddress?: string | null
      street?: string | null
      city?: string | null
      state?: string | null
      zipCode?: string | null
      placeId?: string | null
      latitude?: number | null
      longitude?: number | null
    }) => {
      setForm((current) => ({
        ...current,
        fullAddress: details.fullAddress ?? current.fullAddress,
        street: details.street ?? current.street,
        city: details.city ?? current.city,
        state: details.state ?? current.state,
        zipCode: details.zipCode ?? current.zipCode,
        placeId: details.placeId ?? current.placeId,
        latitude: details.latitude ?? current.latitude,
        longitude: details.longitude ?? current.longitude,
      }))
    },
    [],
  )

  const reverseGeocode = useCallback(
    (position: LatLng) => {
      if (!window.google) return
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: position }, (results, status) => {
        if (status !== 'OK' || !results?.[0]) return
        const place = results[0]
        const components = place.address_components ?? []
        const getComponent = (type: string) =>
          components.find((component) => component.types.includes(type))?.long_name ?? ''

        applyAddressDetails({
          fullAddress: place.formatted_address,
          street: [getComponent('street_number'), getComponent('route')].filter(Boolean).join(' '),
          city: getComponent('locality') || getComponent('administrative_area_level_2'),
          state: getComponent('administrative_area_level_1'),
          zipCode: getComponent('postal_code'),
          placeId: place.place_id ?? null,
          latitude: position.lat,
          longitude: position.lng,
        })
      })
    },
    [applyAddressDetails],
  )

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const position = { lat, lng }
    const components = place.address_components ?? []
    const getComponent = (type: string) =>
      components.find((component) => component.types.includes(type))?.long_name ?? ''

    setMarkerPos(position)
    setMapCenter(position)
    applyAddressDetails({
      fullAddress: place.formatted_address ?? '',
      street: [getComponent('street_number'), getComponent('route')].filter(Boolean).join(' '),
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      zipCode: getComponent('postal_code'),
      placeId: place.place_id ?? null,
      latitude: lat,
      longitude: lng,
    })
  }

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    const position = { lat: event.latLng.lat(), lng: event.latLng.lng() }
    setMarkerPos(position)
    setMapCenter(position)
    reverseGeocode(position)
  }, [reverseGeocode])

  const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    const position = { lat: event.latLng.lat(), lng: event.latLng.lng() }
    setMarkerPos(position)
    reverseGeocode(position)
  }, [reverseGeocode])

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setMarkerPos(nextPosition)
        setMapCenter(nextPosition)
        reverseGeocode(nextPosition)
        setLocating(false)
        toast.success('Location detected.')
      },
      () => {
        setLocating(false)
        toast.error('Could not detect location. Please allow location access in your browser.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const result = await saveSecretaryOfficeDetailsAction({
        companyName: form.companyName,
        fullAddress: form.fullAddress,
        street: form.street,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        latitude: form.latitude,
        longitude: form.longitude,
        placeId: form.placeId || null,
      })
      setSaved(true)
      toast.success(result.message)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Office Information</h1>
        <p className="mt-1 font-medium text-slate-500">Update the office name and map-based address details used by the Secretary workflow.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 size={20} />
            </div>
            <CardTitle>Office Profile</CardTitle>
            <CardDescription>These details help keep the Secretary desk, invitations, and office routing tied to the correct location.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-sm italic text-slate-400">Loading office details...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Office Name</label>
                  <Input value={form.companyName} onChange={(event) => handleChange('companyName', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Search Address</label>
                  {isLoaded ? (
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                        <input
                          type="text"
                          value={form.fullAddress}
                          onChange={(event) => handleChange('fullAddress', event.target.value)}
                          placeholder="Search address or landmark..."
                          className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/20"
                        />
                      </Autocomplete>
                    </div>
                  ) : (
                    <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Address</label>
                  <Input value={form.fullAddress} onChange={(event) => handleChange('fullAddress', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Street</label>
                    <Input value={form.street} onChange={(event) => handleChange('street', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">City</label>
                    <Input value={form.city} onChange={(event) => handleChange('city', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Province / State</label>
                    <Input value={form.state} onChange={(event) => handleChange('state', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Zip Code</label>
                    <Input value={form.zipCode} onChange={(event) => handleChange('zipCode', event.target.value)} className="h-11 rounded-xl border-slate-200" />
                  </div>
                </div>
                {form.fullAddress ? (
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    Pinned address: {form.fullAddress}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoLocate}
                    disabled={locating || !isLoaded}
                    className="rounded-xl border-slate-200 font-bold"
                  >
                    {locating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Navigation size={16} className="mr-2" />}
                    {locating ? 'Detecting...' : 'Use My Location'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#1428ae] text-white hover:bg-[#1e3dc4]">
                    {saving ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : saved ? (
                      <CheckCircle2 size={16} className="mr-2" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Office Details'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin size={20} />
            </div>
            <CardTitle>Office Location Pin</CardTitle>
            <CardDescription>Click the map or drag the marker to fine-tune the office location, using the same location workflow as Franchise Org Settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Interactive Map</p>
              </div>
              <div className="h-[360px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center bg-slate-50 text-sm italic text-slate-400">
                    Loading map...
                  </div>
                ) : isLoaded ? (
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
                    }}
                  >
                    <Marker position={markerPos} draggable onDragEnd={onMarkerDragEnd} />
                  </GoogleMap>
                ) : (
                  <div className="flex h-full items-center justify-center gap-2 bg-slate-50 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    Loading map...
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Coordinates</p>
              <p className="mt-2 text-sm text-slate-600">
                Lat: <span className="font-mono font-semibold text-slate-800">{markerPos.lat.toFixed(6)}</span>
                {'  '}
                Lng: <span className="font-mono font-semibold text-slate-800">{markerPos.lng.toFixed(6)}</span>
              </p>
            </div>
            <p>Secretary office settings stay scoped to the office linked through `company_members`.</p>
            <p>Office contact channels beyond address fields are still handled through member contact records and the invite workflow.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
