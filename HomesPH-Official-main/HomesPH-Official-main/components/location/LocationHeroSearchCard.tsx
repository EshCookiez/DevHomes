'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, Mic, Search } from 'lucide-react'
import type { HeroMode } from './LocationHeroControls'
import { useDebounce } from '@/hooks/use-debounce'

interface HeroQuickLink {
  label: string
  href: string
}

interface LocationHeroSearchCardProps {
  locationName: string
  locationSlug: string
  quickLinks: HeroQuickLink[]
  mode: HeroMode
}

interface AiClarificationState {
  buyUrl: string
  message: string
  rentUrl: string
}

interface AiParseResponse {
  ok: boolean
  error?: string
  redirectUrl?: string | null
  clarification?: AiClarificationState | null
}

interface AiSuggestionsResponse {
  ok: boolean
  error?: string
  suggestions?: string[]
}

const CONTENT_TRANSITION =
  'transition-[background-color,border-color,color,opacity,transform] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

const MANUAL_SEGMENT_TRANSITION =
  'transition-[transform,background-color,color,opacity] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

const MODE_PANEL_TRANSITION =
  'motion-reduce:animate-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 duration-300'

const SEARCH_BAR_SHELL_CLASS =
  'relative isolate overflow-hidden rounded-[14px] p-[2px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] sm:rounded-[16px]'

const GUIDED_PROMPT_TRANSITION =
  'transition-[opacity,transform,width,margin] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

const HERO_SEARCH_ROW_HEIGHT = 'h-[60px] sm:h-[65px]'
const HERO_SECONDARY_ROW_HEIGHT = 'min-h-[56px] sm:min-h-[58px]'
const AI_SUGGESTION_COUNT = 4
const SEARCH_BAR_INNER_CLASS =
  `relative z-10 grid ${HERO_SEARCH_ROW_HEIGHT} grid-cols-[20px_minmax(0,1fr)_102px] items-center gap-[12px] rounded-[12.5px] bg-white px-[14px] sm:grid-cols-[20px_minmax(0,1fr)_118px] sm:gap-[14px] sm:rounded-[14.5px] sm:px-[18px]`
const SEARCH_BAR_ACTION_SLOT_CLASS =
  'flex w-full items-center justify-end gap-[12px] sm:gap-[14px]'
const HERO_SEARCH_INPUT_CLASS =
  `min-w-0 w-full border-0 bg-transparent text-[15px] leading-6 tracking-[-0.02em] text-[#173260] placeholder:text-[#5c6d8a] focus:outline-none sm:text-[18px] ${CONTENT_TRANSITION}`
const HERO_PRIMARY_ACTION_CLASS =
  `inline-flex h-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#2140d8] px-[22px] text-[15px] font-semibold tracking-[-0.02em] text-white hover:bg-[#1b35b8] sm:h-[46px] sm:px-[26px] sm:text-[16px] ${CONTENT_TRANSITION}`

const MANUAL_PROPERTY_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'house-and-lot', label: 'House & Lot' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
]

const MANUAL_BED_OPTIONS = [
  { value: '', label: 'Beds & Baths' },
  { value: '1', label: '1+ Bed / 1+ Bath' },
  { value: '2', label: '2+ Beds / 2+ Baths' },
  { value: '3', label: '3+ Beds / 3+ Baths' },
  { value: '4', label: '4+ Beds / 4+ Baths' },
]

const MANUAL_PRICE_OPTIONS = [
  { value: '', label: 'Price (PhP)' },
  { value: '3000000', label: 'Up to PHP 3M' },
  { value: '5000000', label: 'Up to PHP 5M' },
  { value: '10000000', label: 'Up to PHP 10M' },
  { value: '20000000', label: 'Up to PHP 20M' },
]

const AI_PROMPT_SUGGESTIONS_BY_SLUG: Record<string, string[]> = {
  cebu: [
    'Condominium in Cebu City',
    'Studio Apartment in Cebu',
    'Apartment Near IT Park',
    'Studio Condo in Mandaue',
  ],
  bgc: [
    'Condo in BGC',
    'Apartment Near Uptown',
    'Studio Near High Street',
    '2 Bedroom in Taguig',
  ],
  makati: [
    'Condo in Makati',
    'Apartment Near Ayala Avenue',
    'Studio in Legazpi Village',
    '1 Bedroom Near Salcedo',
  ],
  manila: [
    'Condo in Manila',
    'Apartment Near Taft',
    'Studio in Ermita',
    'Affordable Condo in Manila',
  ],
}

function buildAiSuggestions(
  locationName: string,
  locationSlug: string,
  quickLinks: HeroQuickLink[]
) {
  const predefinedSuggestions = AI_PROMPT_SUGGESTIONS_BY_SLUG[locationSlug]

  if (predefinedSuggestions) {
    return predefinedSuggestions
  }

  const fallbackLabel = locationName.trim()
  const quickLinkLabels = quickLinks.map((item) => item.label.toLowerCase())

  return [
    `Condominium in ${fallbackLabel}`,
    `Studio Apartment in ${fallbackLabel}`,
    `${quickLinkLabels.includes('projects') ? 'Projects' : 'Homes'} in ${fallbackLabel}`,
    `1 Bedroom in ${fallbackLabel}`,
  ]
}
function AIActionGlyph() {
  return (
    <span aria-hidden className="flex items-end gap-[2px]">
      <span className="h-[8px] w-[2px] rounded-full bg-white" />
      <span className="h-[14px] w-[2px] rounded-full bg-white" />
      <span className="h-[18px] w-[2px] rounded-full bg-white" />
      <span className="h-[11px] w-[2px] rounded-full bg-white" />
    </span>
  )
}

function buildKeywordFallbackUrl(mode: 'buy' | 'rent', locationSlug: string, query: string) {
  const params = new URLSearchParams()

  if (locationSlug.trim()) {
    params.set('location', locationSlug)
  }

  if (query.trim()) {
    params.set('keywords', query.trim())
  }

  return `/${mode}?${params.toString()}`
}

function ManualFilterSelect({
  ariaLabel,
  defaultValue,
  name,
  options,
}: {
  ariaLabel: string
  defaultValue: string
  name: string
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        className="h-[56px] w-full appearance-none rounded-[14px] border border-[#d7deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-[16px] pr-[44px] text-[15px] font-medium tracking-[-0.03em] text-[#173260] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-[border-color,box-shadow,background-color] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#c7d2eb] focus:border-[#b9c7ea] sm:h-[58px] sm:px-[18px] sm:text-[17px]"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={`${name}-${option.value || 'default'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        size={18}
        strokeWidth={2.25}
        className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-[#173260]"
      />
    </div>
  )
}

export default function LocationHeroSearchCard({
  locationName,
  locationSlug,
  quickLinks,
  mode,
}: LocationHeroSearchCardProps) {
  const router = useRouter()
  const [manualListingType, setManualListingType] = useState<'sale' | 'rent'>('sale')
  const [aiQuery, setAiQuery] = useState('')
  const [fetchedAiSuggestions, setFetchedAiSuggestions] = useState<string[]>([])
  const [lastAiSuggestionsQuery, setLastAiSuggestionsQuery] = useState('')
  const [aiSuggestionsError, setAiSuggestionsError] = useState<string | null>(null)
  const [isAiSuggestionsLoading, setIsAiSuggestionsLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiClarification, setAiClarification] = useState<AiClarificationState | null>(null)
  const [isAiSubmitting, setIsAiSubmitting] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [typedPromptLength, setTypedPromptLength] = useState(0)
  const [isDeletingPrompt, setIsDeletingPrompt] = useState(false)
  const latestAiSuggestionRequestRef = useRef(0)
  const isAiMode = mode === 'ai'
  const debouncedAiQuery = useDebounce(aiQuery, 500)
  const fallbackAiSuggestions = buildAiSuggestions(locationName, locationSlug, quickLinks)
  const filteredFallbackAiSuggestions = fallbackAiSuggestions.filter((suggestion) => {
    const normalizedQuery = aiQuery.trim().toLowerCase()
    return normalizedQuery.length === 0 || suggestion.toLowerCase().includes(normalizedQuery)
  })
  const displayedAiSuggestions = (
    (isAiSuggestionsLoading || aiSuggestionsError === null) && fetchedAiSuggestions.length > 0
      ? fetchedAiSuggestions
      : filteredFallbackAiSuggestions
  ).slice(0, AI_SUGGESTION_COUNT)
  const guidedPromptSuggestions = (
    lastAiSuggestionsQuery === '' && fetchedAiSuggestions.length > 0
      ? fetchedAiSuggestions
      : fallbackAiSuggestions
  ).slice(0, AI_SUGGESTION_COUNT)
  const guidedPromptSourceKey = guidedPromptSuggestions.join('|')
  const activeGuidedPrompt =
    guidedPromptSuggestions[activePromptIndex] ?? guidedPromptSuggestions[0] ?? ''
  const animatedGuidedPrompt = `"${activeGuidedPrompt}"`
  const visibleGuidedPrompt = animatedGuidedPrompt.slice(0, typedPromptLength)
  const showGuidedPrompt = isAiMode && aiQuery.length === 0
  const placeholder = isAiMode ? '' : 'City, community or building'
  const submitLabel = isAiMode ? 'Search with AI' : 'Search manually'
  const buyFallbackUrl = buildKeywordFallbackUrl('buy', locationSlug, aiQuery)
  const rentFallbackUrl = buildKeywordFallbackUrl('rent', locationSlug, aiQuery)

  useEffect(() => {
    setActivePromptIndex(0)
    setTypedPromptLength(0)
    setIsDeletingPrompt(false)
  }, [guidedPromptSourceKey, locationSlug])

  useEffect(() => {
    if (!showGuidedPrompt) {
      return
    }

    setTypedPromptLength(0)
    setIsDeletingPrompt(false)
  }, [showGuidedPrompt])

  useEffect(() => {
    if (!showGuidedPrompt || !animatedGuidedPrompt) {
      return
    }

    let timeoutId: number

    if (!isDeletingPrompt && typedPromptLength < animatedGuidedPrompt.length) {
      timeoutId = window.setTimeout(() => {
        setTypedPromptLength((currentLength) => currentLength + 1)
      }, typedPromptLength === 0 ? 420 : 64)
    } else if (!isDeletingPrompt && typedPromptLength === animatedGuidedPrompt.length) {
      timeoutId = window.setTimeout(() => {
        setIsDeletingPrompt(true)
      }, 1600)
    } else if (isDeletingPrompt && typedPromptLength > 0) {
      timeoutId = window.setTimeout(() => {
        setTypedPromptLength((currentLength) => currentLength - 1)
      }, 32)
    } else {
      timeoutId = window.setTimeout(() => {
        setIsDeletingPrompt(false)
        setActivePromptIndex((currentIndex) => (currentIndex + 1) % guidedPromptSuggestions.length)
      }, 220)
    }

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [animatedGuidedPrompt, guidedPromptSuggestions.length, isDeletingPrompt, showGuidedPrompt, typedPromptLength])

  useEffect(() => {
    setAiError(null)
    setAiClarification(null)
  }, [aiQuery, mode])

  useEffect(() => {
    if (!isAiMode) {
      setFetchedAiSuggestions([])
      setLastAiSuggestionsQuery('')
      setAiSuggestionsError(null)
      setIsAiSuggestionsLoading(false)
      return
    }

    setFetchedAiSuggestions([])
    setLastAiSuggestionsQuery('')
    setAiSuggestionsError(null)
  }, [isAiMode, locationSlug])

  useEffect(() => {
    if (!isAiMode) {
      return
    }

    let isCancelled = false
    const requestId = latestAiSuggestionRequestRef.current + 1
    latestAiSuggestionRequestRef.current = requestId
    setIsAiSuggestionsLoading(true)
    setAiSuggestionsError(null)

    async function fetchAiSuggestions() {
      try {
        const response = await fetch('/api/ai/suggest-queries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: debouncedAiQuery.trim() || null,
            locationSlug,
            count: AI_SUGGESTION_COUNT,
          }),
        })

        const payload = (await response.json()) as AiSuggestionsResponse

        if (isCancelled || latestAiSuggestionRequestRef.current !== requestId) {
          return
        }

        if (!response.ok || !payload.ok || !payload.suggestions || payload.suggestions.length === 0) {
          throw new Error(payload.error ?? 'AI suggestions are unavailable right now.')
        }

        setFetchedAiSuggestions(payload.suggestions)
        setLastAiSuggestionsQuery(debouncedAiQuery.trim())
        setAiSuggestionsError(null)
      } catch (error) {
        if (isCancelled || latestAiSuggestionRequestRef.current !== requestId) {
          return
        }

        setAiSuggestionsError(
          error instanceof Error ? error.message : 'AI suggestions are unavailable right now.'
        )
      } finally {
        if (isCancelled || latestAiSuggestionRequestRef.current !== requestId) {
          return
        }

        setIsAiSuggestionsLoading(false)
      }
    }

    void fetchAiSuggestions()

    return () => {
      isCancelled = true
    }
  }, [debouncedAiQuery, isAiMode, locationSlug])

  async function submitAiQuery(query: string) {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setAiError('Enter a property search to use AI Mode.')
      setAiClarification(null)
      return
    }

    try {
      setIsAiSubmitting(true)
      setAiError(null)
      setAiClarification(null)

      const response = await fetch('/api/ai/parse-property-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmedQuery,
          locationSlug,
        }),
      })

      const payload = (await response.json()) as AiParseResponse

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'AI parsing is unavailable right now. Please try again.')
      }

      if (payload.redirectUrl) {
        router.push(payload.redirectUrl)
        return
      }

      if (payload.clarification) {
        setAiClarification(payload.clarification)
        return
      }

      throw new Error('We could not route that search yet. Please try again.')
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : 'AI parsing is unavailable right now. Please try again or use Manual Mode.'
      )
    } finally {
      setIsAiSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isAiMode) {
      return
    }

    event.preventDefault()
    await submitAiQuery(aiQuery)
  }

  function handleSuggestionClick(suggestion: string) {
    setAiQuery(suggestion)
    submitAiQuery(suggestion)
  }

  return (
    <form
      action="/search"
      method="GET"
      onSubmit={handleSubmit}
      className="mx-auto min-h-[164px] w-full max-w-[1060px] rounded-[22px] border border-white bg-white px-[12px] py-[12px] text-left text-[#11204b] shadow-[0_22px_50px_rgba(8,23,56,0.2)] sm:min-h-[173px] sm:px-[18px] sm:py-[16px]"
    >
      <input type="hidden" name="location" value={locationSlug} />
      <input type="hidden" name="mode" value={mode} />
      {!isAiMode ? <input type="hidden" name="type" value={manualListingType} /> : null}

      <div key={mode} className={`${MODE_PANEL_TRANSITION} xl:flex xl:flex-col xl:justify-center`}>
        {isAiMode ? (
          <div className="space-y-[14px] xl:space-y-[16px]">
            <div className={`${SEARCH_BAR_SHELL_CLASS} ai-search-outline-shell`}>
              <div className={SEARCH_BAR_INNER_CLASS}>
                <Search size={20} strokeWidth={2} className="shrink-0 text-[#173260]" />
                <div className="flex min-w-0 items-center">
                  <span
                    aria-hidden
                    className={`overflow-hidden whitespace-nowrap text-[16px] leading-6 tracking-[-0.02em] text-[#42577c] sm:text-[18px] ${GUIDED_PROMPT_TRANSITION} ${showGuidedPrompt ? 'mr-[6px] w-[28px] opacity-100 sm:w-[32px]' : 'mr-0 w-0 opacity-0'}`}
                  >
                    Try
                  </span>

                  <div className="relative min-w-0 flex-1">
                    {showGuidedPrompt ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden"
                      >
                        <span
                          className="inline-flex min-w-0 items-center truncate text-[16px] leading-6 tracking-[-0.02em] text-[#5f7295] sm:text-[18px]"
                        >
                          <span className="truncate">{visibleGuidedPrompt || '\u00A0'}</span>
                          <span className="ai-guided-caret ml-[2px] inline-block h-[1.05em] w-px shrink-0 rounded-full bg-[#5f7295]/75" />
                        </span>
                      </span>
                    ) : null}

                    <input
                      aria-label="Search properties"
                      name="q"
                      placeholder={placeholder}
                      type="search"
                      value={aiQuery}
                      onChange={(event) => setAiQuery(event.target.value)}
                      disabled={isAiSubmitting}
                      className={`relative z-10 ${HERO_SEARCH_INPUT_CLASS}`}
                    />
                  </div>
                </div>

                <div className={SEARCH_BAR_ACTION_SLOT_CLASS}>
                  <button
                    type="button"
                    aria-label="Voice search"
                    className="inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[#2140d8] transition hover:text-[#1b35b8]"
                  >
                    <Mic size={20} />
                  </button>

                  <button
                    type="submit"
                    aria-label={submitLabel}
                    disabled={isAiSubmitting}
                    className={`inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#2140d8] text-white shadow-[0_10px_24px_rgba(33,64,216,0.26)] hover:bg-[#1b35b8] sm:h-[46px] sm:w-[46px] ${CONTENT_TRANSITION}`}
                  >
                    {isAiSubmitting ? <Loader2 size={18} className="animate-spin" /> : <AIActionGlyph />}
                  </button>
                </div>
              </div>
            </div>

            <div
              aria-busy={isAiSuggestionsLoading}
              className={`grid ${HERO_SECONDARY_ROW_HEIGHT} grid-cols-1 content-start gap-[12px] sm:grid-cols-2 lg:grid-cols-4 xl:gap-[10px] ${isAiSuggestionsLoading ? 'opacity-90' : ''}`}
            >
              {displayedAiSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isAiSubmitting}
                  className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-[10px] border border-[#1428AE] bg-white px-[16px] py-[10px] text-center text-[14px] font-medium tracking-[-0.02em] text-[#1428AE] transition-[border-color,background-color,color] duration-[200ms] ease-out hover:bg-[#f0f4ff] sm:text-[15px]"
                >
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>

            {aiError ? (
              <div className="rounded-[14px] border border-[#f3c5cd] bg-[#fff5f7] px-[16px] py-[12px] text-[14px] text-[#8f2841]">
                <p className="leading-6">{aiError}</p>
                {aiQuery.trim() ? (
                  <div className="mt-[12px] flex flex-col gap-[10px] sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => router.push(buyFallbackUrl)}
                      className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] bg-white px-[14px] py-[10px] text-[13px] font-semibold text-[#8f2841] transition hover:bg-[#fff0f3] sm:w-auto"
                    >
                      Use Buy keyword search
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(rentFallbackUrl)}
                      className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] border border-[#e7a8b6] bg-white px-[14px] py-[10px] text-[13px] font-semibold text-[#8f2841] transition hover:bg-[#fff0f3] sm:w-auto"
                    >
                      Use Rent keyword search
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {aiClarification ? (
              <div className="rounded-[14px] border border-[#d7deef] bg-[#f8faff] px-[16px] py-[14px]">
                <p className="text-[14px] font-medium text-[#173260]">{aiClarification.message}</p>
                <div className="mt-[10px] flex flex-wrap gap-[10px]">
                  <button
                    type="button"
                    onClick={() => router.push(aiClarification.buyUrl)}
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] bg-[#2140d8] px-[18px] py-[10px] text-[14px] font-semibold text-white transition hover:bg-[#1b35b8] sm:w-auto"
                  >
                    Search Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(aiClarification.rentUrl)}
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[10px] border border-[#2140d8] bg-white px-[18px] py-[10px] text-[14px] font-semibold text-[#2140d8] transition hover:bg-[#eef3ff] sm:w-auto"
                  >
                    Search Rent
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-[14px] xl:space-y-[16px]">
            <div className={`${SEARCH_BAR_SHELL_CLASS} bg-[#d8dfef]`}>
              <div className={SEARCH_BAR_INNER_CLASS}>
                <Search size={20} strokeWidth={2} className="shrink-0 text-[#173260]" />
                <input
                  aria-label="Search manually"
                  name="q"
                  placeholder={placeholder}
                  type="search"
                  className={HERO_SEARCH_INPUT_CLASS}
                />

                <div className={SEARCH_BAR_ACTION_SLOT_CLASS}>
                  <span aria-hidden className="h-[20px] w-[20px] shrink-0 opacity-0" />
                  <button
                    type="submit"
                    aria-label="Search manually"
                    className={HERO_PRIMARY_ACTION_CLASS}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-[194px_repeat(3,minmax(0,1fr))]">
              <div className="relative isolate grid grid-cols-2 rounded-[14px] border border-[#d7deef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-y-[3px] left-[3px] z-0 w-[calc(50%_-_3px)] rounded-[11px] bg-[#dfe5ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${MANUAL_SEGMENT_TRANSITION} ${manualListingType === 'rent' ? 'translate-x-full' : 'translate-x-0'}`}
                />

                <button
                  type="button"
                  aria-pressed={manualListingType === 'sale'}
                  onClick={() => setManualListingType('sale')}
                  className={`relative z-10 inline-flex h-[50px] items-center justify-center rounded-[11px] px-[18px] text-[15px] font-semibold tracking-[-0.03em] ${MANUAL_SEGMENT_TRANSITION} ${manualListingType === 'sale' ? 'text-[#2140d8]' : 'text-[#173260]'}`}
                >
                  Buy
                </button>

                <button
                  type="button"
                  aria-pressed={manualListingType === 'rent'}
                  onClick={() => setManualListingType('rent')}
                  className={`relative z-10 inline-flex h-[50px] items-center justify-center rounded-[11px] px-[18px] text-[15px] font-semibold tracking-[-0.03em] ${MANUAL_SEGMENT_TRANSITION} ${manualListingType === 'rent' ? 'text-[#2140d8]' : 'text-[#173260]'}`}
                >
                  Rent
                </button>
              </div>

              <ManualFilterSelect
                ariaLabel="Property type"
                defaultValue="residential"
                name="propertyCategory"
                options={MANUAL_PROPERTY_OPTIONS}
              />

              <ManualFilterSelect
                ariaLabel="Bedrooms and bathrooms"
                defaultValue=""
                name="beds"
                options={MANUAL_BED_OPTIONS}
              />

              <ManualFilterSelect
                ariaLabel="Maximum price"
                defaultValue=""
                name="max"
                options={MANUAL_PRICE_OPTIONS}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
