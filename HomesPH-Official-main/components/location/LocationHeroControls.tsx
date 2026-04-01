'use client'

import { useState } from 'react'
import LocationHeroModeSwitch from './LocationHeroModeSwitch'
import LocationHeroSearchCard from './LocationHeroSearchCard'

interface HeroQuickLink {
  label: string
  href: string
}

export type HeroMode = 'ai' | 'manual'

interface LocationHeroControlsProps {
  locationName: string
  locationSlug: string
  quickLinks: HeroQuickLink[]
}

export default function LocationHeroControls({
  locationName,
  locationSlug,
  quickLinks,
}: LocationHeroControlsProps) {
  const [activeMode, setActiveMode] = useState<HeroMode>('manual')

  return (
    <div className="relative z-10 mt-[24px] w-full max-w-[1060px] sm:mt-[30px] lg:absolute lg:left-[calc(50%_-_0.5px)] lg:top-[377px] lg:mt-0 lg:-translate-x-1/2">
      <div className="mx-auto h-[58px] w-full max-w-[459px]">
        <LocationHeroModeSwitch activeMode={activeMode} onModeChange={setActiveMode} />
      </div>

      <div className="mt-[18px] w-full sm:mt-[24px]">
        <LocationHeroSearchCard
          locationName={locationName}
          locationSlug={locationSlug}
          quickLinks={quickLinks}
          mode={activeMode}
        />
      </div>
    </div>
  )
}
