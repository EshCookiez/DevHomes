'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LayoutList, Map } from 'lucide-react'

export default function ViewToggle() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'list'

  const getHref = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    return `/projects?${params.toString()}`
  }

  return (
    <div className="relative z-10 flex items-center border border-[#D3D3D3] rounded-lg bg-white shadow-sm h-[48px] p-1 shrink-0 pointer-events-auto">
      <Link
        href={getHref('list')}
        className={`flex items-center justify-center gap-2 w-[105px] h-full text-sm text-[18px] transition-colors rounded-[8px] cursor-pointer ${view !== 'map'
          ? 'bg-[#DFE3FF] text-[#1428ae] font-medium'
          : 'text-gray-400 font-light hover:text-[#002143] hover:bg-gray-50'
          }`}
      >
        <LayoutList size={18} />
        List
      </Link>
      <Link
        href={getHref('map')}
        className={`flex items-center justify-center gap-2 w-[105px] h-full text-sm text-[18px] transition-colors rounded-[8px] cursor-pointer ${view === 'map'
          ? 'bg-[#DFE3FF] text-[#1428ae] font-medium'
          : 'text-gray-400 font-light hover:text-[#002143] hover:bg-gray-50'
          }`}
      >
        <Map size={18} />
        Map
      </Link>
    </div>
  )
}
