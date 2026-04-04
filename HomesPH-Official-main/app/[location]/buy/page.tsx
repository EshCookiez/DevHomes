import PublicListingsPage from '@/components/listings/PublicListingsPage'
import type { PropertySearchParamsInput } from '@/lib/property-search'

export default async function BuyByLocationPage(props: {
  params: Promise<{ location: string }>
  searchParams?: Promise<PropertySearchParamsInput>
}) {
  const { location } = await props.params
  const searchParams = (await props.searchParams) ?? {}

  return (
    <PublicListingsPage
      mode="sale"
      searchParams={{ ...searchParams, location }}
    />
  )
}
