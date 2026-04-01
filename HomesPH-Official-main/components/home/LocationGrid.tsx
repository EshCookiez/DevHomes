import { LocationCard, type Location } from './LocationCard'

const LANDING_LOCATION_ORDER = [
  'bacolod',
  'bgc',
  'bohol',
  'cagayan-de-oro',
  'cavite',
  'cebu',
  'davao',
  'gensan',
  'iloilo',
  'pampanga',
]

const LANDING_LOCATION_ORDER_INDEX = new Map(
  LANDING_LOCATION_ORDER.map((slug, index) => [slug, index]),
)

export default function LocationGrid({ locations }: { locations: Location[] }) {
  const mapWatermarkStyle = {
    width: '1336px',
    height: '891px',
    position: 'absolute' as const,
    left: 'calc(50% - 1336px/2)',
    top: '-60px',
    backgroundColor: '#F2F8FF',
    WebkitMaskImage: "url('/Pilipinas.png')",
    maskImage: "url('/Pilipinas.png')",
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    transformOrigin: 'center center',
  } as const

  const orderedLocations = [...locations].sort((left, right) => {
    const leftOrder = LANDING_LOCATION_ORDER_INDEX.get(left.slug) ?? Number.POSITIVE_INFINITY
    const rightOrder = LANDING_LOCATION_ORDER_INDEX.get(right.slug) ?? Number.POSITIVE_INFINITY

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.title.localeCompare(right.title)
  })

  return (
    <section id="locations" className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-slate-200/80" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          style={mapWatermarkStyle}
        />
      </div>

      <div className="relative z-10 px-4 py-10 md:px-8 md:py-12 lg:px-12 lg:py-14 xl:px-24 2xl:pl-[296px] 2xl:pr-[296px]">
        <div className="mx-auto w-full max-w-[1920px]">
          <div className="mx-auto flex max-w-[1002px] flex-col items-center text-center">
            <h1 className="font-[family-name:var(--font-outfit)] text-[40px] font-semibold leading-[1] text-[#1428AE] sm:text-[55px] md:text-[65px] lg:text-[75px] lg:leading-[75px]">
              Your Home Starts Here
            </h1>

            <p className="mt-[15px] max-w-[831px] font-[family-name:var(--font-outfit)] text-[16px] font-normal leading-[24px] text-[#1428AE] sm:text-[20px] sm:leading-[26px] md:text-[22px] md:leading-[28px] lg:text-[25px] lg:leading-[30px]">
              Select a location below to explore available properties, condominiums, and
              investment opportunities.
            </p>

            <span className="mt-[40px] inline-flex h-[50px] w-[490px] max-w-full items-center justify-center rounded-[10px] bg-[#1428AE]/[0.08] font-[family-name:var(--font-outfit)] text-[25px] font-medium leading-[25px] text-[#1428AE]">
              STEP 1 — CHOOSE YOUR LOCATION
            </span>
          </div>

          <div className="mx-auto mt-12 grid w-full max-w-[1345px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {orderedLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
