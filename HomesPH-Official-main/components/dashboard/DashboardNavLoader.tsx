'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png'

/**
 * DashboardNavLoader — renders inside the dashboard main area.
 * Appears as an overlay over the content region (sidebar stays visible)
 * when navigating between dashboard pages.
 */
export default function DashboardNavLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const prevPathname = useRef(pathname)
  const progressRaf = useRef<number | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (exitTimer.current) clearTimeout(exitTimer.current)
    if (progressRaf.current) cancelAnimationFrame(progressRaf.current)

    setExiting(false)
    setProgress(0)
    setVisible(true)

    // Animate from 0 → 88%
    const startTime = performance.now()
    function animateProgress(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / 1400, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased * 88)
      if (eased < 1) {
        progressRaf.current = requestAnimationFrame(animateProgress)
      }
    }
    progressRaf.current = requestAnimationFrame(animateProgress)

    hideTimer.current = setTimeout(() => {
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current)
      setProgress(100)
      exitTimer.current = setTimeout(() => {
        setExiting(true)
        exitTimer.current = setTimeout(() => setVisible(false), 350)
      }, 180)
    }, 500)

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (exitTimer.current) clearTimeout(exitTimer.current)
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-30 pointer-events-none flex flex-col"
      style={{
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}
    >
      {/* Frosted overlay */}
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[2px]" />

      {/* Progress bar at top of content area */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200/60">
        <div
          className="h-full rounded-r-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #1428ae 0%, #3b5fea 55%, #f4aa1d 100%)',
            transition: progress === 100 ? 'width 0.18s ease' : 'width 0.06s linear',
            boxShadow: '0 0 10px rgba(20,40,174,0.55)',
          }}
        />
      </div>

      {/* Centered logo + ring */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 relative">
        {/* Outer spinning ring */}
        <div className="relative flex items-center justify-center">
          <svg
            className="absolute"
            width="88"
            height="88"
            viewBox="0 0 88 88"
            fill="none"
            style={{ animation: 'dash-nav-spin 1.2s linear infinite' }}
          >
            <circle
              cx="44"
              cy="44"
              r="40"
              stroke="url(#navGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="200"
              strokeDashoffset="140"
            />
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1428ae" />
                <stop offset="1" stopColor="#f4aa1d" />
              </linearGradient>
            </defs>
          </svg>

          <div className="w-16 h-16 rounded-xl bg-white shadow-lg shadow-[#1428ae]/15 flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="HomesPH"
              width={48}
              height={48}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-slate-400">
          Loading…
        </p>
      </div>

      <style>{`
        @keyframes dash-nav-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
