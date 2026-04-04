import PublicListingsPage from '@/components/listings/PublicListingsPage'
import type { PropertySearchParamsInput } from '@/lib/property-search'
import { redirect } from 'next/navigation'
import { normalizeLocationSlug } from '@/lib/url-slugs'

export default async function BuyPage(props: {
  searchParams?: Promise<PropertySearchParamsInput>
}) {
  const searchParams = (await props.searchParams) ?? {}
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined
  const locationSlug = normalizeLocationSlug(location)

  if (locationSlug) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'location') continue
      if (typeof value === 'string') params.set(key, value)
      else if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry))
    }
    const query = params.toString()
    redirect(`/${locationSlug}/buy${query ? `?${query}` : ''}`)
  }

  return <PublicListingsPage mode="sale" searchParams={searchParams} />
}
