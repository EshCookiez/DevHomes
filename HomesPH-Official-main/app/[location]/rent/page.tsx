import PublicListingsPage from '@/components/listings/PublicListingsPage'
import type { PropertySearchParamsInput } from '@/lib/property-search'
import type { RentPHProperty, RentPHResponse } from '@/components/listings/RentPHListingsGrid'

const RENTPH_API = process.env.RENTPH_API_URL ?? 'https://rent.ph/api'

async function fetchRentPHListings(page = 1): Promise<{ listings: RentPHProperty[]; total: number; lastPage: number }> {
  try {
    const res = await fetch(`${RENTPH_API}/properties?per_page=6&page=${page}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return { listings: [], total: 0, lastPage: 1 }
    const json: RentPHResponse = await res.json()
    return {
      listings: json.data ?? [],
      total: json.pagination?.total ?? 0,
      lastPage: json.pagination?.last_page ?? 1,
    }
  } catch {
    return { listings: [], total: 0, lastPage: 1 }
  }
}

export default async function RentByLocationPage(props: {
  params: Promise<{ location: string }>
  searchParams?: Promise<PropertySearchParamsInput>
}) {
  const { location } = await props.params
  const searchParams = (await props.searchParams) ?? {}
  const rentPage = Math.max(1, parseInt(String(searchParams.rentPage ?? '1'), 10) || 1)

  const { listings: rentPHListings, total: rentPHTotal, lastPage: rentPHLastPage } = await fetchRentPHListings(rentPage)

  return (
    <PublicListingsPage
      mode="rent"
      searchParams={{ ...searchParams, location }}
      rentPHListings={rentPHListings}
      rentPHTotal={rentPHTotal}
      rentPHPage={rentPage}
      rentPHLastPage={rentPHLastPage}
    />
  )
}
