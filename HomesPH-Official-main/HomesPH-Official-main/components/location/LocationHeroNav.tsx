'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSelectedLocation } from '@/hooks/use-selected-location'

interface LocationHeroNavItem {
  label: string
  href: string
  clearLocation?: boolean
}

export default function LocationHeroNav({
  items,
}: {
  items: LocationHeroNavItem[]
}) {
  const { clearSelectedLocation } = useSelectedLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function handleNavClick(clearLocation?: boolean) {
    return () => {
      if (clearLocation) {
        clearSelectedLocation()
      }

      setOpen(false)
    }
  }

  return (
    <>
      <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-[32px] text-[15px] font-medium tracking-[-0.025em] text-white/96 lg:flex xl:gap-[40px]">
        {items.map((item) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            onClick={item.clearLocation ? clearSelectedLocation : undefined}
            className="transition hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden items-center justify-end gap-[24px] lg:flex">
        <Link
          href="/login"
          className="inline-flex items-center text-[14px] font-medium leading-none tracking-[-0.02em] text-white/92 transition hover:text-white"
        >
          Login
        </Link>
        <Link
          href="/registration/broker"
          className="inline-flex h-[40px] items-center justify-center rounded-[10px] bg-[#2140d8] px-[20px] text-[14px] font-semibold leading-none tracking-[-0.02em] text-white transition hover:bg-[#1b35b8]"
        >
          Sign in
        </Link>
      </div>

      <button
        type="button"
        aria-label="Open location menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-white/16 bg-white/10 text-white shadow-[0_14px_30px_rgba(8,24,49,0.18)] backdrop-blur-[18px] transition hover:bg-white/16 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-[#081831]/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[320px] flex-col bg-white text-[#0f274e] shadow-[0_30px_80px_rgba(8,24,49,0.24)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#0f274e]">
            HomesPH
          </span>
          <button
            type="button"
            aria-label="Close location menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={`${item.label}-${item.href}-mobile`}
                href={item.href}
                onClick={handleNavClick(item.clearLocation)}
                className="flex min-h-[48px] items-center rounded-[14px] px-4 py-3 text-[15px] font-medium tracking-[-0.02em] text-[#173260] transition hover:bg-[#f5f8ff] hover:text-[#2140d8]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <div className="grid gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[46px] items-center justify-center rounded-[12px] border border-[#2140d8]/20 px-4 py-3 text-[15px] font-semibold text-[#2140d8] transition hover:bg-[#f5f8ff]"
            >
              Login
            </Link>
            <Link
              href="/registration/broker"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[46px] items-center justify-center rounded-[12px] bg-[#2140d8] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#1b35b8]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
