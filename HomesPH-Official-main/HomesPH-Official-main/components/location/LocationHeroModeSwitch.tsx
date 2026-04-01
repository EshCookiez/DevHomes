'use client'

import type { HeroMode } from './LocationHeroControls'

interface LocationHeroModeSwitchProps {
  activeMode: HeroMode
  onModeChange: (mode: HeroMode) => void
}

const SEGMENTED_TRANSITION =
  'motion-reduce:transition-none transition-[color,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

const PILL_TRANSITION =
  'motion-reduce:transition-none transform-gpu will-change-transform transition-[transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

export default function LocationHeroModeSwitch({
  activeMode,
  onModeChange,
}: LocationHeroModeSwitchProps) {
  const pillTransform =
    activeMode === 'ai' ? 'translate3d(calc(100% + 8px), 0, 0)' : 'translate3d(0, 0, 0)'

  const handleModeChange = (nextMode: HeroMode) => {
    if (nextMode === activeMode) {
      return
    }

    onModeChange(nextMode)
  }

  return (
    <div
      role="tablist"
      aria-label="Search mode"
      className="relative isolate grid h-full w-full grid-cols-2 items-center overflow-hidden rounded-[13px] bg-white/30 p-[4px] backdrop-blur-[10px]"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-[4px] left-[4px] z-0 rounded-[13px] bg-[#1428AE] shadow-[0_10px_24px_rgba(20,40,174,0.26)] ${PILL_TRANSITION}`}
        style={{
          width: 'calc(50% - 8px)',
          transform: pillTransform,
        }}
      />

      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'manual'}
        onClick={() => handleModeChange('manual')}
        className={`relative z-10 inline-flex h-full items-center justify-center rounded-[13px] px-[16px] text-center text-[22px] font-medium leading-[22px] tracking-[0] text-white ${SEGMENTED_TRANSITION} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
      >
        Manual Mode
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'ai'}
        onClick={() => handleModeChange('ai')}
        className={`relative z-10 inline-flex h-full items-center justify-center rounded-[13px] px-[16px] text-center text-[22px] font-medium leading-[22px] tracking-[0] text-white ${SEGMENTED_TRANSITION} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
      >
        AI Mode
      </button>
    </div>
  )
}
