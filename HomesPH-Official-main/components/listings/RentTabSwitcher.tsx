'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Home, ExternalLink } from 'lucide-react'

function TabSwitcherInner({
  activeSource,
  fixed,
}: {
  activeSource: string
  fixed?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function switchTo(source: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('source', source)
    router.push(`${pathname}?${params.toString()}`)
  }

  const tabs = [
    { id: 'homesph', label: 'HomesPH Listings', icon: Home },
    { id: 'rentph', label: 'Rent.PH Listings', icon: ExternalLink },
  ]

  const posClass = fixed
    ? 'fixed top-24 left-0 right-0 z-[38]'   // sits right below the sticky header (h-24)
    : 'sticky top-24 z-30'

  return (
    <div className={`${posClass} bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm`}>
      <div className="max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24">
        <div className="flex items-stretch gap-0 h-12">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeSource === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => switchTo(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-all duration-200
                  border-b-2 -mb-px
                  ${active
                    ? 'border-[#1428ae] text-[#1428ae]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
                `}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.id === 'rentph' && (
                  <span className="ml-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full tracking-wide uppercase">
                    New
                  </span>
                )}
              </button>
            )
          })}

          {activeSource === 'rentph' && (
            <div className="ml-auto flex items-center pr-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live · refreshes every 5 min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RentTabSwitcher({
  activeSource,
  fixed = false,
}: {
  activeSource: string
  fixed?: boolean
}) {
  return (
    <Suspense fallback={
      <div className={`${fixed ? 'fixed top-24' : 'sticky top-24'} left-0 right-0 z-30 bg-white border-b border-slate-200 h-12`} />
    }>
      <TabSwitcherInner activeSource={activeSource} fixed={fixed} />
    </Suspense>
  )
}
