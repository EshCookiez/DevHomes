'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png'

export default function PageTransitionLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const prevPathname = useRef(pathname)
  const progressRaf = useRef<number | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    // Cancel any in-progress hide
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (exitTimer.current) clearTimeout(exitTimer.current)
    if (progressRaf.current) cancelAnimationFrame(progressRaf.current)

    // Show loader
    setExiting(false)
    setProgress(0)
    setVisible(true)

    // Animate progress bar to ~90% quickly, then stall
    let current = 0
    const startTime = performance.now()

    function animateProgress(now: number) {
      const elapsed = now - startTime
      // Ease out: fast at start, slow near 90
      const t = Math.min(elapsed / 1800, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      current = eased * 88
      setProgress(current)
      if (current < 88) {
        progressRaf.current = requestAnimationFrame(animateProgress)
      }
    }

    progressRaf.current = requestAnimationFrame(animateProgress)

    // Complete and dismiss
    hideTimer.current = setTimeout(() => {
      if (progressRaf.current) cancelAnimationFrame(progressRaf.current)
      setProgress(100)
      exitTimer.current = setTimeout(() => {
        setExiting(true)
        exitTimer.current = setTimeout(() => setVisible(false), 400)
      }, 200)
    }, 600)

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
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/95 backdrop-blur-sm"
        style={{
          opacity: exiting ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Centered logo + spinner */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6"
        style={{
          opacity: exiting ? 0 : 1,
          transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {/* Logo with glow pulse */}
        <div className="relative flex items-center justify-center">
          {/* Glow ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 96,
              height: 96,
              background:
                'radial-gradient(circle, rgba(20,40,174,0.18) 0%, rgba(20,40,174,0) 70%)',
              animation: 'page-loader-pulse 1.6s ease-in-out infinite',
            }}
          />
          <div className="relative w-20 h-20 flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="HomesPH"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg"
              style={{ animation: 'page-loader-breathe 1.8s ease-in-out infinite' }}
              unoptimized
            />
          </div>
        </div>

        {/* Brand text */}
        <p
          className="text-[13px] font-semibold tracking-[0.18em] uppercase text-[#0c1f4a]/60"
          style={{ animation: 'page-loader-fadein 0.4s ease both' }}
        >
          Loading…
        </p>
      </div>

      {/* Progress bar — top of screen */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0c1f4a]/8">
        <div
          className="h-full rounded-r-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #1428ae 0%, #3b5fea 50%, #f4aa1d 100%)',
            transition: progress === 100 ? 'width 0.2s ease' : 'width 0.08s linear',
            boxShadow: '0 0 12px rgba(20,40,174,0.6)',
          }}
        />
      </div>

      <style>{`
        @keyframes page-loader-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%        { transform: scale(1.25); opacity: 0.2; }
        }
        @keyframes page-loader-breathe {
          0%, 100% { transform: scale(1); }
          50%        { transform: scale(1.04); }
        }
        @keyframes page-loader-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
