import { NextResponse } from 'next/server'

type PlaceResult = {
  place_id: string
  name: string
  types?: string[]
  geometry?: { location?: { lat?: number; lng?: number } }
  photos?: Array<{ photo_reference?: string }>
}

type NearbyApiResponse = {
  results?: PlaceResult[]
  status?: string
}

type LandmarkCategory = {
  key: 'mall' | 'grocery' | 'convenience' | 'pharmacy'
  label: string
  type: string
  keyword?: string
}

type LandmarkPayload = {
  id: string
  name: string
  category: string
  distanceMiles: number
  imageUrl: string | null
  latitude: number
  longitude: number
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const CATEGORY_QUERIES: LandmarkCategory[] = [
  { key: 'convenience', label: '7-Eleven / Convenience Store', type: 'convenience_store', keyword: '7-Eleven convenience store' },
  { key: 'mall', label: 'Nearby Mall', type: 'shopping_mall', keyword: 'mall' },
  { key: 'grocery', label: 'Grocery Store', type: 'supermarket' },
  { key: 'pharmacy', label: 'Pharmacy', type: 'pharmacy' },
]

const CEBU_FEATURED_CONVENIENCE = [
  'Ayala Center Cebu',
  'SM City Cebu',
  'SM Seaside City Cebu',
  'Robinsons Galleria Cebu',
  'Gaisano Country Mall',
]

const FEATURED_CEBU_MAX_DISTANCE_MILES = 8

function toNumber(value: string | null): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusMiles = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMiles * c
}

async function googleJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Google Places API request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

function makePhotoUrl(photoRef: string | undefined): string | null {
  if (!photoRef) return null
  return `/api/landmarks/photo?photoRef=${encodeURIComponent(photoRef)}&maxwidth=480`
}

async function fetchNearestByCategory(
  lat: number,
  lng: number,
  category: LandmarkCategory
): Promise<LandmarkPayload | null> {
  if (!GOOGLE_API_KEY) return null

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    rankby: 'distance',
    type: category.type,
    key: GOOGLE_API_KEY,
  })
  if (category.keyword) params.set('keyword', category.keyword)

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
  const data = await googleJson<NearbyApiResponse>(url)
  const place = data.results?.[0]
  const placeLat = place?.geometry?.location?.lat
  const placeLng = place?.geometry?.location?.lng

  if (!place || placeLat == null || placeLng == null) return null

  const distanceMiles = milesBetween(lat, lng, placeLat, placeLng)
  return {
    id: `${category.key}-${place.place_id}`,
    name: place.name,
    category: category.label,
    distanceMiles: Number(distanceMiles.toFixed(1)),
    imageUrl: makePhotoUrl(place.photos?.[0]?.photo_reference),
    latitude: placeLat,
    longitude: placeLng,
  }
}

async function fetchFeaturedCebuPlaces(
  lat: number,
  lng: number,
  city: string | null,
  province: string | null
): Promise<LandmarkPayload[]> {
  if (!GOOGLE_API_KEY) return []

  const areaText = [city, province, 'Philippines'].filter(Boolean).join(' ')
  const isCebu = `${city ?? ''} ${province ?? ''}`.toLowerCase().includes('cebu')
  if (!isCebu) return []

  const lookups = CEBU_FEATURED_CONVENIENCE.map(async (name) => {
    const params = new URLSearchParams({
      query: `${name} ${areaText}`,
      location: `${lat},${lng}`,
      radius: '20000',
      key: GOOGLE_API_KEY,
    })
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    const data = await googleJson<NearbyApiResponse>(url)
    const place = data.results?.[0]
    const placeLat = place?.geometry?.location?.lat
    const placeLng = place?.geometry?.location?.lng
    if (!place || placeLat == null || placeLng == null) return null

    const distanceMiles = Number(milesBetween(lat, lng, placeLat, placeLng).toFixed(1))
    if (distanceMiles > FEATURED_CEBU_MAX_DISTANCE_MILES) return null

    return {
      id: `famous-${place.place_id}`,
      name: place.name,
      category: 'Featured Cebu Place',
      distanceMiles,
      imageUrl: makePhotoUrl(place.photos?.[0]?.photo_reference),
      latitude: placeLat,
      longitude: placeLng,
    } as LandmarkPayload
  })

  const results = await Promise.all(lookups)
  return results.filter((item): item is LandmarkPayload => item != null)
}

export async function GET(request: Request) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ landmarks: [] })
    }

    const { searchParams } = new URL(request.url)
    const lat = toNumber(searchParams.get('lat'))
    const lng = toNumber(searchParams.get('lng'))
    const city = searchParams.get('city')
    const province = searchParams.get('province')

    if (lat == null || lng == null) {
      return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
    }

    const categoryResults = await Promise.all(
      CATEGORY_QUERIES.map((category) => fetchNearestByCategory(lat, lng, category))
    )
    const featuredCebu = await fetchFeaturedCebuPlaces(lat, lng, city, province)

    const utilityLandmarks = categoryResults.filter((item): item is LandmarkPayload => item != null)
    const merged = [...utilityLandmarks, ...featuredCebu]

    // Avoid duplicate entries from category and text-search responses.
    const deduped = new Map<string, LandmarkPayload>()
    for (const landmark of merged) {
      const key = `${landmark.name.toLowerCase()}|${landmark.latitude.toFixed(5)}|${landmark.longitude.toFixed(5)}`
      if (!deduped.has(key)) deduped.set(key, landmark)
    }

    const landmarks = Array.from(deduped.values()).sort((a, b) => a.distanceMiles - b.distanceMiles)

    return NextResponse.json({ landmarks })
  } catch (error) {
    console.error('landmarks nearby API error', error)
    return NextResponse.json({ landmarks: [] }, { status: 500 })
  }
}
