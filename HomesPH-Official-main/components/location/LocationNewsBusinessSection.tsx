'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { buildNewsHref } from '@/lib/news-navigation'
import { buildArticleHref } from '@/lib/article-href'
import {
  LOCATION_EDITORIAL_BREAKOUT_CLASS,
  LOCATION_EDITORIAL_CONTENT_SHELL_CLASS,
  LOCATION_EDITORIAL_TITLE_SHELL_CLASS,
  LOCATION_PAGE_SHELL_CLASS,
} from './location-page-layout'

interface LocationNewsBusinessSectionProps {
  locationName: string
  locationSlug: string
  articles?: NewsArticle[]
}

interface NewsArticle {
  id: number | string
  title: string
  slug?: string
  image_url?: string
  excerpt?: string
  content?: string
  category?: string
  author?: string
  published_at: string
  tags?: string[]
  city_slug?: string | null
}

interface BusinessFeature {
  description: string
  iconSrc: string
  title: string
}

const SECTION_CONTAINER_CLASS =
  `${LOCATION_PAGE_SHELL_CLASS} pb-[24px] pt-[14px] sm:pb-[34px] sm:pt-[22px] lg:pb-[40px] lg:pt-[26px]`
const SECTION_HEADING_ALIGNMENT_CLASS = 'w-full'
const NEWS_CARD_WIDTH_CLASS =
  'basis-[84%] sm:basis-[48%] lg:basis-[31.5%] xl:basis-[24.5%] 2xl:basis-[19.5%]'
const NEWS_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const BUSINESS_FEATURES: BusinessFeature[] = [
  {
    title: 'Manage Listings Easily',
    description:
      'Powerful dashboard to add, edit, and track all your property listings in one place.',
    iconSrc:
      'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/listingIcon.png',
  },
  {
    title: 'Team Collaboration',
    description:
      'Add agents, manage teams, and collaborate seamlessly with your entire organization.',
    iconSrc:
      'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/collabIcon.png',
  },
  {
    title: 'Advanced Analytics',
    description:
      'Track leads, monitor performance, and make data-driven decisions to grow faster.',
    iconSrc:
      'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/Analytics%20icon.png',
  },
]

function formatNewsDate(value: string) {
  return NEWS_DATE_FORMATTER.format(new Date(value))
}

function buildNewsArticles(locationName: string, locationSlug: string, externalArticles?: NewsArticle[]) {
  const source = externalArticles ?? []
  if (source.length === 0) return []

  const normalizedLocationName = locationName.toLowerCase()
  const normalizedLocationSlug = locationSlug.replace(/-/g, ' ').toLowerCase()

  const matchingArticles = source.filter((article) => {
    const haystack = [
      article.title,
      article.excerpt,
      article.content,
      article.category,
      article.author,
      ...(article.tags ?? []),
    ]
      .join(' ')
      .toLowerCase()

    return (
      haystack.includes(normalizedLocationName) ||
      haystack.includes(normalizedLocationSlug)
    )
  })

  const articles = [
    ...matchingArticles,
    ...source.filter(
      (article) =>
        !matchingArticles.some(
          (matchingArticle) => matchingArticle.id === article.id
        )
    ),
  ]

  return articles.slice(0, 8)
}

function NewsBusinessSectionHeading({
  accent,
  id,
  prefix,
}: {
  accent: string
  id: string
  prefix: string
}) {
  return (
    <h2
      id={id}
      className="text-[26px] font-semibold tracking-[-0.045em] text-[#0f274e] sm:text-[32px]"
    >
      <span>{prefix} </span>
      <span className="text-[#2140d8]">{accent}</span>
    </h2>
  )
}

function CarouselControlButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'next' | 'prev'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous news stories' : 'Next news stories'}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8e2f1] bg-white text-[#173260] transition-[transform,border-color,color,background-color,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#c5d3eb] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
    >
      {direction === 'prev' ? (
        <ChevronLeft size={18} strokeWidth={2.1} />
      ) : (
        <ChevronRight size={18} strokeWidth={2.1} />
      )}
    </button>
  )
}

function LatestNewsCard({
  article,
  locationName,
}: {
  article: NewsArticle
  locationName: string
}) {
  return (
    <Link
      href={article.slug ? buildArticleHref(article.slug, article.city_slug) : buildNewsHref(locationName)}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#e4ecf8] bg-white shadow-[0_14px_30px_rgba(15,39,78,0.06)] transition-[transform,box-shadow,border-color] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:border-[#d8e2f1] hover:shadow-[0_22px_44px_rgba(15,39,78,0.08)]"
    >
      <div className="relative h-[214px] overflow-hidden bg-[#e9eff8]">
        <img
          src={article.image_url}
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,23,47,0.02)_0%,rgba(10,23,47,0.08)_48%,rgba(10,23,47,0.7)_100%)]"
        />

        <div className="absolute inset-x-[14px] bottom-[14px] flex items-center justify-between gap-[12px]">
          <span className="inline-flex h-[24px] items-center rounded-full bg-[#2f74ee] px-[12px] text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            News
          </span>
          <span className="text-right text-[11px] font-medium tracking-[-0.01em] text-white/86">
            {formatNewsDate(article.published_at)}
          </span>
        </div>
      </div>

      <div className="flex min-h-[122px] flex-1 flex-col px-[16px] pb-[16px] pt-[14px] sm:px-[18px] sm:pb-[18px]">
        <h3 className="line-clamp-2 text-[18px] font-semibold leading-[1.22] tracking-[-0.03em] text-[#0f274e] transition-colors duration-300 group-hover:text-[#2140d8]">
          {article.title}
        </h3>

        <span className="mt-auto inline-flex items-center gap-[7px] pt-[16px] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2140d8]">
          <span>Read More</span>
          <ArrowRight size={14} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  )
}

function BusinessFeatureCard({
  description,
  iconSrc,
  title,
}: BusinessFeature) {
  return (
    <article className="rounded-[24px] border border-[#edf2fa] bg-[#f5f8fc] px-[24px] py-[28px] text-center sm:px-[28px] sm:py-[32px]">
      <div className="mx-auto flex h-[112px] w-[112px] items-center justify-center rounded-[30px] bg-transparent sm:h-[120px] sm:w-[120px]">
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-[72px] w-[72px] object-contain sm:h-[78px] sm:w-[78px]"
        />
      </div>

      <h3 className="mt-[14px] text-[22px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0f274e] sm:text-[26px]">
        {title}
      </h3>
      <p className="mx-auto mt-[14px] max-w-[320px] text-[15px] leading-[1.6] tracking-[-0.02em] text-[#41597f]">
        {description}
      </p>
    </article>
  )
}

export default function LocationNewsBusinessSection({
  locationName,
  locationSlug,
  articles: externalArticles,
}: LocationNewsBusinessSectionProps) {
  const articles = buildNewsArticles(locationName, locationSlug, externalArticles)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(articles.length > 1)

  useEffect(() => {
    if (!carouselApi) return

    const syncCarouselState = () => {
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

  return (
    <section
      aria-labelledby="location-latest-news-heading"
      className="bg-white"
    >
      <div className={SECTION_CONTAINER_CLASS}>
        <div className={LOCATION_EDITORIAL_BREAKOUT_CLASS}>
          <div className={LOCATION_EDITORIAL_TITLE_SHELL_CLASS}>
            <div className="relative">
              <div className={SECTION_HEADING_ALIGNMENT_CLASS}>
                <NewsBusinessSectionHeading
                  id="location-latest-news-heading"
                  prefix="Homes.ph"
                  accent="Latest News"
                />
              </div>

              <div className="mt-[16px] flex items-center justify-end gap-[8px] sm:absolute sm:right-0 sm:top-0 sm:mt-0">
                <CarouselControlButton
                  direction="prev"
                  disabled={!canScrollPrev}
                  onClick={() => carouselApi?.scrollPrev()}
                />
                <CarouselControlButton
                  direction="next"
                  disabled={!canScrollNext}
                  onClick={() => carouselApi?.scrollNext()}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-[20px] sm:mt-[28px] ${LOCATION_EDITORIAL_BREAKOUT_CLASS}`}>
          <div className={LOCATION_EDITORIAL_CONTENT_SHELL_CLASS}>
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
                {articles.map((article) => (
                  <CarouselItem
                    key={article.id}
                    className={`pl-[18px] ${NEWS_CARD_WIDTH_CLASS}`}
                  >
                    <LatestNewsCard
                      article={article}
                      locationName={locationName}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>

        <div className="pt-[44px] sm:pt-[68px]">
          <div className={`${SECTION_HEADING_ALIGNMENT_CLASS} relative`}>
            <div>
              <NewsBusinessSectionHeading
                id="location-business-growth-heading"
                prefix="Grow Your"
                accent="Real Estate Business"
              />
              <p className="mt-[10px] max-w-[820px] text-[15px] leading-[1.5] tracking-[-0.02em] text-[#41597f] sm:text-[16px]">
                Join thousands of successful franchises who trust Homes.ph to
                manage their listings, teams, and grow their business online.
              </p>
            </div>

            <div className="mt-[18px] flex w-full sm:absolute sm:right-0 sm:top-[4px] sm:mt-0 sm:w-auto">
              <Link
                href="/registration/franchise"
                className="inline-flex h-[48px] w-full items-center justify-center rounded-[14px] border border-[#2140d8] bg-white px-[22px] text-[16px] font-semibold tracking-[-0.02em] text-[#2140d8] transition-[transform,border-color,background-color,color] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-[#1733bd] hover:bg-[#2140d8] hover:text-white sm:w-auto"
              >
                Join Now
              </Link>
            </div>
          </div>

          <div className={`${SECTION_HEADING_ALIGNMENT_CLASS} mt-[20px] grid grid-cols-1 gap-[14px] xl:grid-cols-3 xl:gap-[18px]`}>
            {BUSINESS_FEATURES.map((feature) => (
              <BusinessFeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
