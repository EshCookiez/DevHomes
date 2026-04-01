'use client'

import { ArrowDown } from 'lucide-react'

interface LocationHeroScrollCueProps {
  targetId: string
}

export default function LocationHeroScrollCue({
  targetId,
}: LocationHeroScrollCueProps) {
  const handleScroll = () => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <span className="hero-scroll-cue-sync inline-flex">
      <button
        type="button"
        aria-label="Scroll to the next section"
        onClick={handleScroll}
        className="group pointer-events-auto inline-flex h-[48px] w-[48px] items-center justify-center rounded-full border border-white/16 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.09)_42%,rgba(255,255,255,0.12)_100%)] text-white/94 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_24px_rgba(4,14,34,0.15)] transition-[background-color,border-color,box-shadow,transform] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03] hover:border-white/24 hover:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.13)_42%,rgba(255,255,255,0.16)_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:h-[52px] sm:w-[52px]"
      >
        <ArrowDown
          size={22}
          strokeWidth={2.15}
          className="transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-[1px] sm:size-[24px]"
        />
      </button>
    </span>
  )
}
