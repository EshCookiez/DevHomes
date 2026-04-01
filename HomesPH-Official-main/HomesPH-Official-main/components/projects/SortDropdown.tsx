'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Menu, ChevronDown, Check } from 'lucide-react'

const SORT_OPTIONS = [
  { label: 'Popular', value: '' },
  { label: 'Newest', value: 'newest' },
  { label: 'Lowest Price', value: 'price-low' },
  { label: 'Highest Price', value: 'price-high' },
]

export default function SortDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? ''

  const currentLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label ?? 'Popular'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center justify-between px-4 py-2 rounded-[10px] border border-[#1428AE] bg-white text-[18px] font-outfit font-normal text-[#1428AE] transition-colors w-[149px] h-[45px]`}
      >
        <Menu size={18} className="text-[#1428AE]" />
        {currentLabel}
        <ChevronDown size={14} className={`text-[#1428AE] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+14px)] right-0 w-[149px] bg-white rounded-[10px] shadow-[0px_0px_10px_rgba(0,33,67,0.2)] z-50 p-[10px]">
          {/* Triangle pointer (Polygon 10: 30x20) */}
          <div
            className="absolute -top-[12px] right-[10px] w-[30px] h-[20px] bg-white"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          ></div>

          <div className="relative z-10 flex flex-col">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-center py-[10px] px-2 rounded-[8px] text-[15px] font-outfit transition-all text-center ${currentSort === opt.value ? 'bg-[#E7E9FC] text-[#1428AE] font-semibold' : 'text-[#8187B0] font-light hover:bg-gray-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
