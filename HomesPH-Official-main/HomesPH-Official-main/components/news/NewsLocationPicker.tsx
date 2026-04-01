'use client'

import { useRouter } from 'next/navigation'
import { SELECTED_LOCATION_COOKIE, SELECTED_LOCATION_COOKIE_MAX_AGE } from '@/lib/selected-location'
import { buildNewsHref } from '@/lib/news-navigation'

interface Props {
  locations: string[]
  active?: string
}

export function NewsLocationPicker({ locations, active }: Props) {
  const router = useRouter()
  const dedupedLocations = Array.from(new Set(locations.map(loc => loc.trim()).filter(Boolean)))

  function handleSelect(loc: string) {
    const isAll = loc === 'All'
    try {
      if (isAll) {
        document.cookie = `${SELECTED_LOCATION_COOKIE}=; path=/; max-age=0; sameSite=Lax`
        localStorage.removeItem('selected_location')
      } else {
        document.cookie = `${SELECTED_LOCATION_COOKIE}=${encodeURIComponent(loc)}; path=/; max-age=${SELECTED_LOCATION_COOKIE_MAX_AGE}; sameSite=Lax`
        localStorage.setItem('selected_location', loc)
      }
    } catch {
      // ignore storage errors in restricted environments
    }
    router.push(isAll ? '/news' : buildNewsHref(loc))
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mt-4">
      {['All', ...dedupedLocations].map(loc => {
        const isActive = loc === 'All' ? !active || active === 'All' : active === loc
        return (
          <button
            key={loc}
            type="button"
            onClick={() => handleSelect(loc)}
            className={`text-xs font-bold px-4 py-1.5 rounded-full shrink-0 whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-amber-400 text-[#0c1f4a] shadow-lg shadow-amber-400/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10'
            }`}
          >
            {loc === 'All' ? 'Nationwide' : loc}
          </button>
        )
      })}
    </div>
  )
}
