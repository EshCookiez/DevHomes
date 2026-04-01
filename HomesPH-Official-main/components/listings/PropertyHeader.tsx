import React from 'react'
import Link from 'next/link'
import { LayoutList, ChevronDown, List, Map as MapIcon } from 'lucide-react'
import ViewToggle from '@/components/projects/ViewToggle'
import SortDropdown from '@/components/projects/SortDropdown'

export interface TopLocation {
  name: string
  count: number
  href: string
}

export interface PropertyHeaderProps {
  breadcrumbPrefix: string
  breadcrumbLinkHref?: string
  title: string
  topLocations: TopLocation[]
  viewAllHref: string
  selectedLocation?: string
}

export default function PropertyHeader({
  breadcrumbPrefix,
  breadcrumbLinkHref = '#',
  title,
  topLocations,
  viewAllHref,
  selectedLocation
}: PropertyHeaderProps) {
  return (
    <div className="w-[945.99px] relative text-left">
      <nav className="flex items-center gap-[8.05px] text-[16px] text-[#002143] font-outfit font-light mb-[35.2px] h-[16.08px] leading-[16px]">
        <span className="w-[63.33px] truncate">{breadcrumbPrefix}</span>
        <Link href={breadcrumbLinkHref} className="w-[146.77px] text-[#002143] hover:underline hover:text-[#002143] transition-colors truncate">Philippine Properties</Link>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-[35.18px] relative h-[45.24px]">
        <h1 className="text-[35px] text-[#002143] tracking-tight font-outfit font-normal m-0 leading-[35.19px] w-[495.61px] absolute top-[5.03px]">
          {title}
        </h1>

        <div className="absolute right-0 top-0 flex items-center gap-[10.05px] shrink-0">
          <SortDropdown />
          <ViewToggle />
        </div>
      </div>

      {/* Location Filters Bar */}
      <div 
        className="bg-white rounded-[10px] border border-[#D3D3D3] px-[20.11px] flex flex-col md:flex-row items-center justify-between h-[65.34px] w-[945.99px] shrink-0 pointer-events-auto"
      >
        <div className="flex items-center gap-x-[40.21px] flex-1 min-w-0">
          {topLocations.map((loc, idx) => (
            <div key={idx} className="flex gap-[5.02px] items-center shrink-0">
              <Link
                href={loc.href}
                className={`font-outfit text-[18px] font-light text-[#1428AE] hover:underline whitespace-nowrap truncate ${selectedLocation === loc.name ? 'font-medium underline' : ''}`}
              >
                {loc.name}
              </Link>
              <span className="font-outfit text-[18px] font-light text-[#002143]">({loc.count.toLocaleString()})</span>
            </div>
          ))}
        </div>
        <Link
          href={viewAllHref}
          className="font-outfit text-[18px] font-medium text-[#1428AE] hover:underline cursor-pointer whitespace-nowrap uppercase shrink-0"
        >
          VIEW ALL LOCATIONS
        </Link>
      </div>
    </div>
  )
}

