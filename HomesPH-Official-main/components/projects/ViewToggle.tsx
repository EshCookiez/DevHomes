'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { List, Map as MapIcon } from 'lucide-react'

export default function ViewToggle() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const view = searchParams.get('view') || 'list'

  const getHref = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div 
      className="box-border border border-[#D3D3D3] rounded-[10px] flex items-center bg-white relative px-[3px] shrink-0"
      style={{ width: '227.2px', height: '45.24px' }}
    >
      <div className="z-10 flex items-center w-full justify-between h-full pt-[3.02px] pb-[3.01px] gap-[3px]">
        <Link
          href={getHref('list')}
          className={`flex flex-1 items-center gap-[5px] justify-center cursor-pointer max-w-[105.56px] h-[39.21px] rounded-[8px] transition-colors ${
            view !== 'map' ? 'bg-[#DFE3FF] text-[#1428AE] font-medium' : 'text-[#8187B0] font-light hover:bg-gray-50'
          }`}
        >
          <List size={22} className={view !== 'map' ? 'text-[#1428AE]' : 'text-[#8187B0]'} />
          <span className="font-outfit text-[18px]">List</span>
        </Link>
        <Link
          href={getHref('map')}
          className={`flex flex-1 items-center gap-[5px] justify-center cursor-pointer max-w-[105.56px] h-[39.21px] rounded-[8px] transition-colors ${
            view === 'map' ? 'bg-[#DFE3FF] text-[#1428AE] font-medium' : 'text-[#8187B0] font-light hover:bg-gray-50'
          }`}
        >
          <MapIcon size={20} className={view === 'map' ? 'text-[#1428AE]' : 'text-[#8187B0]'} />
          <span className="font-outfit text-[18px]">Map</span>
        </Link>
      </div>
    </div>
  )
}

