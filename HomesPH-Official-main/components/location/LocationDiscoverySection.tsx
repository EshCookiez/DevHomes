import Link from 'next/link'
import LocationPopularSearchesCarousel from './LocationPopularSearchesCarousel'
import {
  LOCATION_EDITORIAL_BREAKOUT_CLASS,
  LOCATION_EDITORIAL_CONTENT_SHELL_CLASS,
  LOCATION_EDITORIAL_TITLE_SHELL_CLASS,
  LOCATION_PAGE_SHELL_CLASS,
} from './location-page-layout'

const DISCOVERY_SECTION_CONTAINER_CLASS =
  `${LOCATION_PAGE_SHELL_CLASS} pt-[30px] sm:pt-[46px] lg:pt-[56px] pb-[20px] sm:pb-[32px] lg:pb-[38px]`
const DISCOVERY_SECTION_HEADING_ALIGNMENT_CLASS =
  'w-full'

interface LocationDiscoverySectionProps {
  locationName: string
  locationSlug: string
}

interface PropertyTypeShortcut {
  imageAlt: string
  imageSrc: string
  label: string
  propertyType: string
}

interface PopularLocationReference {
  slug: string
  title: string
}

interface PopularLocationCardData extends PopularLocationReference {
  imageSrc: string
}

const PROPERTY_TYPE_SHORTCUTS: PropertyTypeShortcut[] = [
  {
    imageAlt: 'House property type',
    imageSrc: '/properties/House%202.png',
    label: 'House',
    propertyType: 'House & Lot',
  },
  {
    imageAlt: 'Condo property type',
    imageSrc: '/properties/condo%201.png',
    label: 'Condo',
    propertyType: 'Condominium',
  },
  {
    imageAlt: 'Land property type',
    imageSrc: '/properties/land%201.png',
    label: 'Land',
    propertyType: 'Lot Only',
  },
  {
    imageAlt: 'Office property type',
    imageSrc: '/properties/office%201.png',
    label: 'Office',
    propertyType: 'Office Space',
  },
  {
    imageAlt: 'Warehouse property type',
    imageSrc: '/properties/warehouse%201.png',
    label: 'Warehouse',
    propertyType: 'Warehouse',
  },
  {
    imageAlt: 'Building property type',
    imageSrc: '/properties/building%201.png',
    label: 'Building',
    propertyType: 'Commercial Space',
  },
]

const POPULAR_SEARCH_EDITORIAL_ORDER: PopularLocationReference[] = [
  { slug: 'cebu', title: 'Cebu' },
  { slug: 'manila', title: 'Manila' },
  { slug: 'davao', title: 'Davao' },
  { slug: 'bacolod', title: 'Bacolod' },
  { slug: 'pampanga', title: 'Pampanga' },
  { slug: 'bgc', title: 'BGC' },
  { slug: 'palawan', title: 'Palawan' },
  { slug: 'dumaguete', title: 'Dumaguete' },
  { slug: 'cavite', title: 'Cavite' },
  { slug: 'bohol', title: 'Bohol' },
  { slug: 'iloilo', title: 'Iloilo' },
  { slug: 'baguio', title: 'Baguio' },
  { slug: 'tagaytay', title: 'Tagaytay' },
  { slug: 'siargao', title: 'Siargao' },
  { slug: 'makati', title: 'Makati' },
  { slug: 'quezon-city', title: 'Quezon City' },
  { slug: 'batangas', title: 'Batangas' },
  { slug: 'cagayan-de-oro', title: 'Cagayan de Oro' },
]

const LOCATION_IMAGE_BY_SLUG: Record<string, string> = {
  baguio:
    'https://images.pexels.com/photos/33650343/pexels-photo-33650343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  bacolod:
    'https://images.pexels.com/photos/33072142/pexels-photo-33072142.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  batangas:
    'https://images.pexels.com/photos/35183767/pexels-photo-35183767.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  bgc:
    'https://images.pexels.com/photos/19599291/pexels-photo-19599291.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  bohol:
    'https://images.pexels.com/photos/32171654/pexels-photo-32171654.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  'cagayan-de-oro':
    'https://images.pexels.com/photos/35642895/pexels-photo-35642895.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  cavite:
    'https://images.pexels.com/photos/13546265/pexels-photo-13546265.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  cebu:
    'https://images.pexels.com/photos/19479147/pexels-photo-19479147.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  davao:
    'https://images.pexels.com/photos/35642895/pexels-photo-35642895.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  dumaguete:
    'https://images.pexels.com/photos/35183767/pexels-photo-35183767.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  iloilo:
    'https://images.pexels.com/photos/33072141/pexels-photo-33072141.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  makati:
    'https://images.pexels.com/photos/32427444/pexels-photo-32427444.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  manila:
    'https://images.pexels.com/photos/32427444/pexels-photo-32427444.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  palawan:
    'https://images.pexels.com/photos/35648108/pexels-photo-35648108.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  pampanga:
    'https://images.pexels.com/photos/33650343/pexels-photo-33650343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  'quezon-city':
    'https://images.pexels.com/photos/19479147/pexels-photo-19479147.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  siargao:
    'https://images.pexels.com/photos/35648108/pexels-photo-35648108.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  tagaytay:
    'https://images.pexels.com/photos/33650343/pexels-photo-33650343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
}

function buildPopularLocationCards(
  locationName: string,
  locationSlug: string
): PopularLocationCardData[] {
  const buildCard = (item: PopularLocationReference): PopularLocationCardData => ({
    ...item,
    imageSrc:
      LOCATION_IMAGE_BY_SLUG[item.slug] ??
      'https://images.pexels.com/photos/3638870/pexels-photo-3638870.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
  })

  const orderedLocations = [
    {
      slug: locationSlug,
      title: locationName,
    },
    ...POPULAR_SEARCH_EDITORIAL_ORDER.filter((item) => item.slug !== locationSlug),
  ]

  return orderedLocations.slice(0, 18).map((item) => buildCard(item))
}

function DiscoverySectionHeading({
  prefix,
  accent,
}: {
  accent: string
  prefix: string
}) {
  return (
    <h2 className="text-[26px] font-semibold tracking-[-0.045em] text-[#0f274e] sm:text-[32px]">
      <span>{prefix} </span>
      <span className="text-[#2140d8]">{accent}</span>
    </h2>
  )
}

function PropertyTypeShortcutItem({
  href,
  imageAlt,
  imageSrc,
  label,
}: {
  href: string
  imageAlt: string
  imageSrc: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="group flex w-[92px] flex-col items-center gap-[10px] text-center outline-none sm:w-[106px] sm:gap-[12px] lg:w-[125px]"
    >
      <span
        className="flex h-[84px] w-[84px] items-center justify-center rounded-[14px] bg-[#f6faff] p-[12px] transition-transform duration-200 group-hover:-translate-y-[3px] group-hover:bg-[#edf5ff] group-focus-visible:ring-2 group-focus-visible:ring-[#2140d8]/20 sm:h-[94px] sm:w-[94px] sm:p-[14px] lg:h-[125px] lg:w-[125px] lg:rounded-[15px] lg:p-[16px]"
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="text-[14px] font-medium leading-none tracking-[-0.02em] text-[#173260] sm:text-[16px]">
        {label}
      </span>
    </Link>
  )
}

export default function LocationDiscoverySection({
  locationName,
  locationSlug,
}: LocationDiscoverySectionProps) {
  const popularLocationCards = buildPopularLocationCards(locationName, locationSlug)

  return (
    <section
      id="location-discovery"
      aria-label="Discovery shortcuts"
      className="border-t border-[#edf2fa] bg-white"
    >
      <div className={DISCOVERY_SECTION_CONTAINER_CLASS}>
        <div className="w-full min-w-0">
          <div>
            <div className={DISCOVERY_SECTION_HEADING_ALIGNMENT_CLASS}>
              <DiscoverySectionHeading prefix="Explore by" accent="Property Type" />
            </div>

            <div className="mt-[24px] grid w-full max-w-[1040px] grid-cols-2 justify-items-center gap-y-[20px] sm:mt-[32px] sm:grid-cols-3 sm:gap-y-[24px] lg:flex lg:max-w-[1326px] lg:flex-nowrap lg:items-start lg:justify-between lg:gap-y-[0px]">
              {PROPERTY_TYPE_SHORTCUTS.map((item) => (
                <PropertyTypeShortcutItem
                  key={item.label}
                  href={`/search?location=${encodeURIComponent(locationSlug)}&propertyType=${encodeURIComponent(item.propertyType)}`}
                  imageAlt={item.imageAlt}
                  imageSrc={item.imageSrc}
                  label={item.label}
                />
              ))}
            </div>
          </div>

          <div className="mt-[34px] sm:mt-[52px]">
            <div className={LOCATION_EDITORIAL_BREAKOUT_CLASS}>
              <div className={LOCATION_EDITORIAL_TITLE_SHELL_CLASS}>
                <div className={DISCOVERY_SECTION_HEADING_ALIGNMENT_CLASS}>
                  <DiscoverySectionHeading
                    prefix="Philippine Real Estate"
                    accent="Popular Searches"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-[18px] min-w-0 sm:mt-[26px] ${LOCATION_EDITORIAL_BREAKOUT_CLASS}`}>
            <div className={`${LOCATION_EDITORIAL_CONTENT_SHELL_CLASS} min-w-0`}>
              <LocationPopularSearchesCarousel cards={popularLocationCards} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
