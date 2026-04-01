import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { LOCATION_PAGE_SHELL_CLASS } from './location-page-layout'

interface LocationJourneySectionProps {
  locationName: string
  locationSlug: string
}

interface JourneyStep {
  ctaHref: string
  ctaLabel: string
  description: string
  imageAlt: string
  imageClassName?: string
  imageWrapperClassName?: string
  imageSrc: string
  title: string
}

const JOURNEY_SECTION_CONTAINER_CLASS =
  `${LOCATION_PAGE_SHELL_CLASS} pb-[20px] pt-[8px] sm:pb-[30px] sm:pt-[18px] lg:pb-[34px] lg:pt-[22px]`
const JOURNEY_SECTION_CONTENT_ALIGNMENT_CLASS =
  'w-full'

function buildJourneySteps(locationName: string, locationSlug: string): JourneyStep[] {
  return [
    {
      title: 'Browse Properties',
      description: `Search through thousands of verified listings across the Philippines. Filter by location, price, size, and more to find your perfect match.`,
      ctaLabel: 'Explore Listings',
      ctaHref: `/buy?location=${encodeURIComponent(locationSlug)}`,
      imageAlt: `Browse properties in ${locationName}`,
      imageClassName: 'object-[44%_50%]',
      imageWrapperClassName: 'rounded-r-[16px] sm:rounded-r-[18px]',
      imageSrc:
        'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/browse.png',
    },
    {
      title: 'Connect with Franchises',
      description:
        'Get matched with verified, professional franchises who understand your needs and can guide you through every step of the process.',
      ctaLabel: 'Find Franchises',
      ctaHref: '/developers',
      imageAlt: 'Connect with franchises',
      imageClassName: 'object-[48%_50%]',
      imageWrapperClassName: 'rounded-r-[16px] sm:rounded-r-[18px]',
      imageSrc:
        'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/brokers.png',
    },
    {
      title: 'Move In',
      description:
        "Complete secure transactions with full legal support and documentation. We're with you until you get your keys and beyond.",
      ctaLabel: 'Learn More',
      ctaHref: '/legal',
      imageAlt: 'Move into your new home',
      imageClassName: 'origin-bottom scale-[1.14] object-[50%_95%]',
      imageWrapperClassName: 'rounded-r-[16px] sm:rounded-r-[18px]',
      imageSrc:
        'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/moveImage.png',
    },
  ]
}

function JourneyStepCard({
  ctaHref,
  ctaLabel,
  description,
  imageAlt,
  imageClassName,
  imageWrapperClassName,
  imageSrc,
  title,
}: JourneyStep) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-[#dbe5f4] bg-white shadow-[0_10px_24px_rgba(15,39,78,0.045)]">
      <div className="grid min-h-[148px] grid-cols-[94px_minmax(0,1fr)] sm:min-h-[160px] sm:grid-cols-[112px_minmax(0,1fr)]">
        <div
          className={`relative min-h-[148px] overflow-hidden sm:min-h-[160px] ${imageWrapperClassName ?? ''}`}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName ?? 'object-center'}`}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-between px-[12px] py-[12px] sm:px-[16px] sm:py-[15px]">
          <div>
            <h3 className="text-[17px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#002143] sm:text-[19px]">
              {title}
            </h3>
            <p className="mt-[8px] max-w-[270px] text-[12.5px] leading-[1.45] tracking-[-0.015em] text-[#002143] sm:max-w-[292px] sm:text-[13.5px]">
              {description}
            </p>
          </div>

          <Link
            href={ctaHref}
            className="mt-[14px] inline-flex items-center gap-[7px] text-[14px] font-semibold tracking-[-0.02em] text-[#f5a623] transition-colors hover:text-[#d68b12]"
          >
            <span>{ctaLabel}</span>
            <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function LocationJourneySection({
  locationName,
  locationSlug,
}: LocationJourneySectionProps) {
  const steps = buildJourneySteps(locationName, locationSlug)

  return (
    <section aria-labelledby="location-journey-heading" className="bg-white">
      <div className={JOURNEY_SECTION_CONTAINER_CLASS}>
        <div className={JOURNEY_SECTION_CONTENT_ALIGNMENT_CLASS}>
          <h2
            id="location-journey-heading"
            className="text-[26px] font-semibold tracking-[-0.045em] text-[#002143] sm:text-[32px]"
          >
            <span>Your Journey to </span>
            <span className="text-[#2140d8]">Homeownership</span>
          </h2>
          <p className="mt-[10px] max-w-[720px] text-[14px] leading-[1.5] tracking-[-0.02em] text-[#002143] sm:text-[16px]">
            We make finding and buying your dream home simple, transparent, and
            stress-free.
          </p>
        </div>

        <div
          className={`${JOURNEY_SECTION_CONTENT_ALIGNMENT_CLASS} mt-[20px] grid grid-cols-1 gap-[14px] xl:grid-cols-3 xl:gap-[18px]`}
        >
          {steps.map((step) => (
            <JourneyStepCard key={step.title} {...step} />
          ))}
        </div>
      </div>
    </section>
  )
}
