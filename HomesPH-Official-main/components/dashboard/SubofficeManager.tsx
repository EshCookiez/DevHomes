'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Building2, Loader2, MapPin, Navigation, Plus, Search, Settings, Users } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  createSubofficeAction,
  type SubofficeAssignableMember,
  updateSubofficeAction,
} from '@/app/dashboard/franchise/suboffices/actions'

type LatLng = { lat: number; lng: number }

type SubofficeAddress = {
  city: string | null
  fullAddress: string | null
  latitude: number | null
  longitude: number | null
  placeId: string | null
  state: string | null
  street: string | null
  zipCode: string | null
}

export type Suboffice = {
  address: SubofficeAddress | null
  addressSummary: string | null
  id: string
  memberCount: number
  name: string
  secretaryProfileId: string | null
  secretaryName: string | null
}

interface Props {
  assignableMembers: SubofficeAssignableMember[]
  initialEditOfficeId?: string | null
  initialLoadError?: string | null
  initialSuboffices: Suboffice[]
}

const libraries: ('places')[] = ['places']
const DEFAULT_CENTER: LatLng = { lat: 10.3157, lng: 123.8854 }

export default function SubofficeManager({
  assignableMembers,
  initialEditOfficeId = null,
  initialLoadError = null,
  initialSuboffices,
}: Props) {
  const router = useRouter()
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  })

  const [offices, setOffices] = useState<Suboffice[]>(initialSuboffices)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOffice, setSelectedOffice] = useState<Suboffice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const [name, setName] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [secretaryProfileId, setSecretaryProfileId] = useState('')
  const [markerPos, setMarkerPos] = useState<LatLng>(DEFAULT_CENTER)
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER)

  const didApplyInitialEdit = useRef(false)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const resetForm = useCallback(() => {
    setName('')
    setFullAddress('')
    setStreet('')
    setCity('')
    setState('')
    setZipCode('')
    setPlaceId(null)
    setSecretaryProfileId('')
    setMarkerPos(DEFAULT_CENTER)
    setMapCenter(DEFAULT_CENTER)
    setError(null)
  }, [])

  const closeModal = useCallback(() => {
    if (loading) {
      return
    }
    setIsModalOpen(false)
  }, [loading])

  const openCreateModal = useCallback(() => {
    setSelectedOffice(null)
    resetForm()
    setIsModalOpen(true)
  }, [resetForm])

  const openEditModal = useCallback((office: Suboffice) => {
    setSelectedOffice(office)
    setName(office.name)
    setFullAddress(office.address?.fullAddress ?? '')
    setStreet(office.address?.street ?? '')
    setCity(office.address?.city ?? '')
    setState(office.address?.state ?? '')
    setZipCode(office.address?.zipCode ?? '')
    setPlaceId(office.address?.placeId ?? null)
    setSecretaryProfileId(office.secretaryProfileId ?? '')

    const lat = office.address?.latitude
    const lng = office.address?.longitude
    const nextPos =
      typeof lat === 'number' && typeof lng === 'number'
        ? { lat, lng }
        : DEFAULT_CENTER

    setMarkerPos(nextPos)
    setMapCenter(nextPos)
    setError(null)
    setIsModalOpen(true)
  }, [])

  useEffect(() => {
    setOffices(initialSuboffices)
  }, [initialSuboffices])

  useEffect(() => {
    if (!isModalOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [closeModal, isModalOpen])

  useEffect(() => {
    if (didApplyInitialEdit.current || !initialEditOfficeId || !offices.length) {
      return
    }

    const matchingOffice = offices.find((office) => office.id === initialEditOfficeId)
    if (!matchingOffice) {
      return
    }

    didApplyInitialEdit.current = true
    openEditModal(matchingOffice)
  }, [initialEditOfficeId, offices, openEditModal])

  const onAutocompleteLoad = (instance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = instance
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) {
      return
    }

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const nextPos = { lat, lng }

    setMarkerPos(nextPos)
    setMapCenter(nextPos)
    setPlaceId(place.place_id ?? null)
    setFullAddress(place.formatted_address ?? '')

    const components = place.address_components ?? []
    const getComponent = (type: string) =>
      components.find((component) => component.types.includes(type))?.long_name ?? ''

    setStreet([getComponent('street_number'), getComponent('route')].filter(Boolean).join(' '))
    setCity(getComponent('locality') || getComponent('administrative_area_level_2'))
    setState(getComponent('administrative_area_level_1'))
    setZipCode(getComponent('postal_code'))
  }

  const reverseGeocode = useCallback((position: LatLng) => {
    if (!window.google) {
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: position }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        return
      }

      const place = results[0]
      const components = place.address_components ?? []
      const getComponent = (type: string) =>
        components.find((component) => component.types.includes(type))?.long_name ?? ''

      setFullAddress(place.formatted_address)
      setPlaceId(place.place_id ?? null)
      setStreet([getComponent('street_number'), getComponent('route')].filter(Boolean).join(' '))
      setCity(getComponent('locality') || getComponent('administrative_area_level_2'))
      setState(getComponent('administrative_area_level_1'))
      setZipCode(getComponent('postal_code'))
    })
  }, [])

  const onMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) {
        return
      }

      const nextPos = { lat: event.latLng.lat(), lng: event.latLng.lng() }
      setMarkerPos(nextPos)
      reverseGeocode(nextPos)
    },
    [reverseGeocode],
  )

  const onMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) {
        return
      }

      const nextPos = { lat: event.latLng.lat(), lng: event.latLng.lng() }
      setMarkerPos(nextPos)
      reverseGeocode(nextPos)
    },
    [reverseGeocode],
  )

  const getSecretaryName = useCallback(
    (profileId: string | null) => {
      if (!profileId) {
        return null
      }

      return assignableMembers.find((member) => member.id === profileId)?.name ?? null
    },
    [assignableMembers],
  )

  const handleAutoLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setMarkerPos(nextPos)
        setMapCenter(nextPos)
        reverseGeocode(nextPos)
        setLocating(false)
        toast.success('Location detected.')
      },
      () => {
        setLocating(false)
        toast.error('Could not detect location. Allow location access in your browser.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [reverseGeocode])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (selectedOffice) {
        const result = await updateSubofficeAction(selectedOffice.id, {
          city,
          fullAddress,
          latitude: markerPos.lat,
          longitude: markerPos.lng,
          name,
          placeId,
          secretaryProfileId: secretaryProfileId || null,
          state,
          street,
          zipCode,
        })

        if (result.success) {
          setOffices((current) =>
            current.map((office) =>
              office.id === selectedOffice.id
                ? {
                    ...office,
                    address: {
                      city: city || null,
                      fullAddress: fullAddress || null,
                      latitude: markerPos.lat,
                      longitude: markerPos.lng,
                      placeId: placeId ?? null,
                      state: state || null,
                      street: street || null,
                      zipCode: zipCode || null,
                    },
                    addressSummary:
                      fullAddress.trim() ||
                      [city.trim(), state.trim()].filter(Boolean).join(', ') ||
                      null,
                    name,
                    secretaryName: getSecretaryName(secretaryProfileId || null),
                    secretaryProfileId: secretaryProfileId || null,
                  }
                : office,
            ),
          )
          setIsModalOpen(false)
          router.refresh()
          toast.success('Suboffice updated.')
        } else {
          setError(result.message || 'Update failed.')
        }
      } else {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('fullAddress', fullAddress)
        formData.append('street', street)
        formData.append('city', city)
        formData.append('state', state)
        formData.append('zipCode', zipCode)
        formData.append('placeId', placeId ?? '')
        formData.append('latitude', String(markerPos.lat))
        formData.append('longitude', String(markerPos.lng))
        formData.append('secretaryProfileId', secretaryProfileId)

        const result = await createSubofficeAction(formData)
        if (result.success) {
          setIsModalOpen(false)
          router.refresh()
          toast.success('Suboffice created.')
        } else {
          setError(result.message || 'Creation failed.')
        }
      }
    } catch (submissionError: any) {
      setError(submissionError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {initialLoadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Some suboffice data could not be loaded on the first render. You can still manage branches here, but refresh once after saving if anything looks out of date.
          <span className="mt-1 block text-xs font-semibold text-amber-700">{initialLoadError}</span>
        </div>
      ) : null}

      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900">Branch & Suboffice Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Deploy and track your localized branches under the master franchise.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#f59e0b] px-5 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-amber-600"
        >
          <Plus size={18} />
          <span>New Suboffice</span>
        </button>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="max-w-4xl space-y-4">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              Suboffice
            </span>
            <h3 className="mt-3 text-xl font-black text-slate-900">Branch-level operational management</h3>
            <p className="mt-2 text-sm text-slate-500">
              The assigned secretary acts as the local office manager for the branch. Franchise-wide approvals, cross-branch transfers, and broader member control stay with the parent organization.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {['Set address', 'Secretary', 'Manage branch members', 'Send invites'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {offices.map((office) => (
          <div
            key={office.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="h-1.5 w-full bg-[#0c1f4a]" />

            <div className="flex-1 p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0c1f4a]">
                  <Building2 size={20} />
                </div>
                <button
                  onClick={() => openEditModal(office)}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Settings size={16} />
                </button>
              </div>

              <h3 className="text-lg font-black leading-tight text-slate-900">{office.name}</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{office.addressSummary || <span className="italic text-amber-600">No address set</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={14} className="text-gray-400" />
                  <span className="font-semibold">{office.memberCount} active members</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/50 px-5 py-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Secretary</span>
                <span className="text-xs font-semibold text-slate-800">{office.secretaryName || 'Unassigned'}</span>
                {!office.secretaryName && office.memberCount > 0 ? (
                  <span className="mt-1 text-[11px] text-amber-600">Branch has members. Promote one to Suboffice Secretary in My Team, then assign them here.</span>
                ) : null}
              </div>
              <button
                onClick={() => openEditModal(office)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0c1f4a] transition-colors hover:border-[#0c1f4a]"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h3 className="mb-1 text-xl font-black text-slate-900">
              {selectedOffice ? 'Manage Suboffice' : 'Create New Suboffice'}
            </h3>
            <p className="mb-6 text-sm text-slate-500">
              {selectedOffice
                ? 'Update branch details and exact office location.'
                : 'Initialize a connected branch using the same location setup as the main organization.'}
            </p>

            {error ? (
              <p className="mb-4 rounded bg-red-50 p-2 text-xs font-bold text-red-600">{error}</p>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Suboffice Name</label>
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    placeholder="e.g. West District Branch"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Branch Address</label>
                  {isLoaded ? (
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                        <input
                          value={fullAddress}
                          onChange={(event) => setFullAddress(event.target.value)}
                          type="text"
                          placeholder="Search address or landmark..."
                          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                        />
                      </Autocomplete>
                    </div>
                  ) : (
                    <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-600">City</label>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      type="text"
                      placeholder="e.g. Cebu City"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Province / Region</label>
                    <input
                      value={state}
                      onChange={(event) => setState(event.target.value)}
                      type="text"
                      placeholder="e.g. Cebu"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Branch Secretary</label>
                  <Select
                    value={secretaryProfileId || 'unassigned'}
                    onValueChange={(value) => setSecretaryProfileId(value === 'unassigned' ? '' : value)}
                  >
                    <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30">
                      <SelectValue placeholder="Select a branch secretary" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {assignableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} • {member.officeLabel} • {member.roleLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-slate-500">
                    Only members promoted to Suboffice Secretary appear here. Moving a member into this suboffice does not assign them as branch secretary automatically.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Street Address</label>
                  <input
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                    type="text"
                    placeholder="e.g. 19 J. Luna St."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-slate-600">Zip Code</label>
                  <input
                    value={zipCode}
                    onChange={(event) => setZipCode(event.target.value)}
                    type="text"
                    placeholder="6000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0c1f4a] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/30"
                  />
                </div>

                {fullAddress ? (
                  <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {fullAddress}
                  </p>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-800">Location Pin</h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Drag the marker or click the map to refine the branch location.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={locating || !isLoaded}
                    className="flex items-center gap-1.5 rounded-lg border border-[#0c1f4a]/20 bg-[#0c1f4a]/5 px-3 py-1.5 text-xs font-bold text-[#0c1f4a] transition-colors hover:bg-[#0c1f4a]/10 disabled:opacity-50"
                  >
                    {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    {locating ? 'Detecting...' : 'Use My Location'}
                  </button>
                </div>

                <div className="min-h-[360px]">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '360px' }}
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
                    <div className="flex h-[360px] items-center justify-center gap-2 bg-gray-50 text-sm text-slate-400">
                      <Loader2 size={18} className="animate-spin" /> Loading map...
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                  <p className="text-xs text-slate-400">
                    Lat: <span className="font-mono font-semibold text-slate-700">{markerPos.lat.toFixed(6)}</span>
                    {' '}|{' '}
                    Lng: <span className="font-mono font-semibold text-slate-700">{markerPos.lng.toFixed(6)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl bg-gray-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-xl bg-[#0c1f4a] px-4 py-2.5 font-bold text-white hover:bg-[#163880] disabled:opacity-50"
              >
                {loading ? 'Saving...' : selectedOffice ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
