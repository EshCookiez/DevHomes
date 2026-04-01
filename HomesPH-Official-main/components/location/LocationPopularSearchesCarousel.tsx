'use client'

import Link from 'next/link'
import { Outfit } from 'next/font/google'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600'],
})

interface PopularLocationCardData {
  imageSrc: string
  slug: string
  title: string
}

interface LocationPopularSearchesCarouselProps {
  cards: PopularLocationCardData[]
}

interface PopularLocationPanel {
  cards: PopularLocationCardData[]
  id: string
}

const MOBILE_CARD_WIDTH_CLASS = 'basis-[84%] min-[430px]:basis-[76%]'

const IMAGE_POSITION_BY_SLUG: Record<string, string> = {
  bacolod: 'object-center',
  baguio: 'object-center',
  batangas: 'object-center',
  bgc: 'object-center',
  bohol: 'object-center',
  cebu: 'object-center',
  'cagayan-de-oro': 'object-center',
  cavite: 'object-center',
  davao: 'object-center',
  dumaguete: 'object-center',
  iloilo: 'object-center',
  makati: 'object-center',
  manila: 'object-center',
  palawan: 'object-center',
  pampanga: 'object-center',
  'quezon-city': 'object-center',
  siargao: 'object-center',
  tagaytay: 'object-center',
}

function buildPanels(cards: PopularLocationCardData[]) {
  const panels: PopularLocationPanel[] = []
  let cardIndex = 0

  while (cardIndex < cards.length) {
    const panelCards = cards.slice(cardIndex, cardIndex + 10)

    if (!panelCards.length) break

    panels.push({
      cards: panelCards,
      id: `panel-${panelCards.map((card) => card.slug).join('-')}`,
    })

    cardIndex += panelCards.length
  }

  return panels
}

function formatCounterValue(value: number) {
  return String(value).padStart(2, '0')
}

function CarouselHeader({
  activeSnap,
  canScrollNext,
  canScrollPrev,
  nextLabel,
  onNext,
  onPrev,
  prevLabel,
  snapCount,
}: {
  activeSnap: number
  canScrollNext: boolean
  canScrollPrev: boolean
  nextLabel: string
  onNext: () => void
  onPrev: () => void
  prevLabel: string
  snapCount: number
}) {
  return (
    <div className="mb-[18px] flex items-center justify-between gap-4">
      <div className="flex items-center gap-[14px]">
        <div className="flex items-center gap-[10px] text-[11px] font-medium uppercase tracking-[0.18em] text-[#173260]/76">
          <span>{formatCounterValue(Math.min(activeSnap + 1, snapCount))}</span>
          <span className="h-px w-[54px] bg-[#d7e2f1]" />
          <span>{formatCounterValue(snapCount)}</span>
        </div>
        <span className="hidden text-[12px] font-medium tracking-[-0.01em] text-[#173260]/60 sm:inline">
          Drag to explore more places
        </span>
      </div>

      <div className="flex items-center gap-[8px]">
        <button
          type="button"
          aria-label={prevLabel}
          disabled={!canScrollPrev}
          onClick={onPrev}
          className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8e2f1] bg-white text-[#173260] transition-[transform,border-color,color,background-color,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#c5d3eb] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          <ChevronLeft size={18} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          disabled={!canScrollNext}
          onClick={onNext}
          className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8e2f1] bg-white text-[#173260] transition-[transform,border-color,color,background-color,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#c5d3eb] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          <ChevronRight size={18} strokeWidth={2.1} />
        </button>
      </div>
    </div>
  )
}

function PopularLocationMobileCard({
  card,
  featured = false,
}: {
  card: PopularLocationCardData
  featured?: boolean
}) {
  const imagePositionClass = IMAGE_POSITION_BY_SLUG[card.slug] ?? 'object-center'

  return (
    <Link
      href={`/${card.slug}`}
      className="group relative block min-w-0 overflow-hidden rounded-[26px] bg-white transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-[0_18px_36px_rgba(12,28,63,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2140d8]/20"
    >
      <img
        src={card.imageSrc}
        alt={`${card.title} real estate`}
        decoding="async"
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover ${imagePositionClass} transition-transform duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]`}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,20,42,0.02)_0%,rgba(8,20,42,0.08)_34%,rgba(8,20,42,0.76)_100%)]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_42%)]"
      />

      <div className={`${outfit.className} relative flex h-[248px] min-w-0 flex-col justify-end p-[18px]`}>
        {featured ? (
          <>
            <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] tracking-[0.05em] text-white/82">
              Looking for Property in
            </span>
            <span className="mt-[8px] text-[18px] font-semibold leading-[1.08] tracking-[0.05em] text-white">
              {card.title}
            </span>
          </>
        ) : (
          <span className="text-[18px] font-semibold leading-[1.08] tracking-[0.05em] text-white">
            {card.title}
          </span>
        )}
      </div>
    </Link>
  )
}

function PopularLocationEditorialCard({
  card,
  className,
  featured = false,
}: {
  card: PopularLocationCardData
  className: string
  featured?: boolean
}) {
  const imagePositionClass = IMAGE_POSITION_BY_SLUG[card.slug] ?? 'object-center'

  return (
    <Link
      href={`/${card.slug}`}
      className={`group relative block min-w-0 overflow-hidden rounded-[28px] bg-white transition-[transform,box-shadow] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-[0_18px_36px_rgba(12,28,63,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2140d8]/20 ${className}`}
    >
      <img
        src={card.imageSrc}
        alt={`${card.title} real estate`}
        decoding="async"
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover ${imagePositionClass} transition-transform duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]`}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,20,42,0.02)_0%,rgba(8,20,42,0.08)_34%,rgba(8,20,42,0.76)_100%)]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_42%)]"
      />

      <div className={`${outfit.className} relative flex h-full min-w-0 flex-col justify-end p-[18px] sm:p-[20px]`}>
        {featured ? (
          <>
            <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] tracking-[0.05em] text-white/82 sm:text-[13px]">
              Looking for Property in
            </span>
            <span className="mt-[8px] text-[18px] font-semibold leading-[1.08] tracking-[0.05em] text-white sm:text-[20px]">
              {card.title}
            </span>
          </>
        ) : (
          <span className="text-[18px] font-semibold leading-[1.08] tracking-[0.05em] text-white sm:text-[20px]">
            {card.title}
          </span>
        )}
      </div>
    </Link>
  )
}

function PopularLocationPanel({
  panel,
}: {
  panel: PopularLocationPanel
}) {
  const [
    leftFeaturedCard,
    leftTopCard,
    leftTopSecondaryCard,
    leftBottomCard,
    leftBottomSecondaryCard,
    rightFeaturedCard,
    rightTopCard,
    rightTopSecondaryCard,
    rightBottomCard,
    rightBottomSecondaryCard,
  ] = panel.cards

  if (!leftFeaturedCard) return null

  const featuredCardClassName =
    'h-[310px] sm:col-span-2 sm:h-[352px] xl:col-span-1 xl:row-span-2 xl:h-[316px] 2xl:h-[313px] 2xl:w-[207px]'
  const supportingCardClassName =
    'h-[174px] sm:h-[188px] xl:h-[149px] 2xl:h-[149px] 2xl:w-[244px]'

  return (
    <div className="grid min-w-0 gap-[18px] sm:grid-cols-2 xl:grid-cols-6 xl:grid-rows-2 2xl:w-[1465px] 2xl:grid-cols-[207px_244px_244px_207px_244px_244px] 2xl:gap-[15px]">
      <PopularLocationEditorialCard
        card={leftFeaturedCard}
        featured
        className={`${featuredCardClassName} xl:col-start-1 xl:row-start-1`}
      />

      {leftTopCard ? (
        <PopularLocationEditorialCard
          card={leftTopCard}
          className={`${supportingCardClassName} xl:col-start-2 xl:row-start-1`}
        />
      ) : null}

      {leftTopSecondaryCard ? (
        <PopularLocationEditorialCard
          card={leftTopSecondaryCard}
          className={`${supportingCardClassName} xl:col-start-3 xl:row-start-1`}
        />
      ) : null}

      {leftBottomCard ? (
        <PopularLocationEditorialCard
          card={leftBottomCard}
          className={`${supportingCardClassName} xl:col-start-2 xl:row-start-2`}
        />
      ) : null}

      {leftBottomSecondaryCard ? (
        <PopularLocationEditorialCard
          card={leftBottomSecondaryCard}
          className={`${supportingCardClassName} xl:col-start-3 xl:row-start-2`}
        />
      ) : null}

      {rightFeaturedCard ? (
        <PopularLocationEditorialCard
          card={rightFeaturedCard}
          featured
          className={`${featuredCardClassName} xl:col-start-4 xl:row-start-1`}
        />
      ) : null}

      {rightTopCard ? (
        <PopularLocationEditorialCard
          card={rightTopCard}
          className={`${supportingCardClassName} xl:col-start-5 xl:row-start-1`}
        />
      ) : null}

      {rightTopSecondaryCard ? (
        <PopularLocationEditorialCard
          card={rightTopSecondaryCard}
          className={`${supportingCardClassName} xl:col-start-6 xl:row-start-1`}
        />
      ) : null}

      {rightBottomCard ? (
        <PopularLocationEditorialCard
          card={rightBottomCard}
          className={`${supportingCardClassName} xl:col-start-5 xl:row-start-2`}
        />
      ) : null}

      {rightBottomSecondaryCard ? (
        <PopularLocationEditorialCard
          card={rightBottomSecondaryCard}
          className={`${supportingCardClassName} xl:col-start-6 xl:row-start-2`}
        />
      ) : null}
    </div>
  )
}

function MobilePopularSearchesCarousel({
  cards,
}: {
  cards: PopularLocationCardData[]
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeSnap, setActiveSnap] = useState(0)
  const [snapCount, setSnapCount] = useState(cards.length)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(cards.length > 1)

  useEffect(() => {
    if (!carouselApi) return

    const syncCarouselState = () => {
      setActiveSnap(carouselApi.selectedScrollSnap())
      setSnapCount(carouselApi.scrollSnapList().length)
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
    }

    syncCarouselState()
    carouselApi.on('select', syncCarouselState)
    carouselApi.on('reInit', syncCarouselState)

    return () => {
      carouselApi.off('select', syncCarouselState)
      carouselApi.off('reInit', syncCarouselState)
    }
  }, [carouselApi])

  if (!cards.length) return null

  return (
    <div className="sm:hidden">
      <CarouselHeader
        activeSnap={activeSnap}
        canScrollNext={canScrollNext}
        canScrollPrev={canScrollPrev}
        nextLabel="Next locations"
        onNext={() => carouselApi?.scrollNext()}
        onPrev={() => carouselApi?.scrollPrev()}
        prevLabel="Previous locations"
        snapCount={snapCount}
      />

      <div className="relative bg-transparent px-[2px] py-[6px]">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: 'start',
            dragFree: true,
            loop: false,
            skipSnaps: false,
          }}
          className="w-full cursor-grab select-none active:cursor-grabbing"
        >
          <CarouselContent className="-ml-[18px]">
            {cards.map((card, index) => (
              <CarouselItem
                key={card.slug}
                className={`pl-[18px] ${MOBILE_CARD_WIDTH_CLASS}`}
              >
                <PopularLocationMobileCard card={card} featured={index === 0} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}

function DesktopPopularSearchesCarousel({
  cards,
}: {
  cards: PopularLocationCardData[]
}) {
  const panels = useMemo(() => buildPanels(cards), [cards])
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeSnap, setActiveSnap] = useState(0)
  const [snapCount, setSnapCount] = useState(panels.length)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(panels.length > 1)

  useEffect(() => {
    if (!carouselApi) return

    const syncCarouselState = () => {
      setActiveSnap(carouselApi.selectedScrollSnap())
      setSnapCount(carouselApi.scrollSnapList().length)
      setCanScrollPrev(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
    }

    syncCarouselState()
    carouselApi.on('select', syncCarouselState)
    carouselApi.on('reInit', syncCarouselState)

    return () => {
      carouselApi.off('select', syncCarouselState)
      carouselApi.off('reInit', syncCarouselState)
    }
  }, [carouselApi])

  if (!panels.length) return null

  return (
    <div className="hidden sm:block">
      <CarouselHeader
        activeSnap={activeSnap}
        canScrollNext={canScrollNext}
        canScrollPrev={canScrollPrev}
        nextLabel="Next location groups"
        onNext={() => carouselApi?.scrollNext()}
        onPrev={() => carouselApi?.scrollPrev()}
        prevLabel="Previous location groups"
        snapCount={snapCount}
      />

      <div className="relative bg-transparent px-[2px] py-[6px] sm:py-[8px]">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: 'start',
            dragFree: false,
            loop: panels.length > 1,
            skipSnaps: false,
          }}
          className="w-full cursor-grab select-none active:cursor-grabbing"
        >
          <CarouselContent className="-ml-[20px]">
            {panels.map((panel) => (
              <CarouselItem
                key={panel.id}
                className="basis-full pl-[20px]"
              >
                <PopularLocationPanel panel={panel} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}

export default function LocationPopularSearchesCarousel({
  cards,
}: LocationPopularSearchesCarouselProps) {
  if (!cards.length) return null

  return (
    <div className="w-full min-w-0 bg-transparent">
      <MobilePopularSearchesCarousel cards={cards} />
      <DesktopPopularSearchesCarousel cards={cards} />
    </div>
  )
}
