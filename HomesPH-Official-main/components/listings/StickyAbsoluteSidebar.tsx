'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

interface StickyAbsoluteSidebarProps {
  left: number
  initialTop: number
  stickyTop?: number
  style?: React.CSSProperties
  children: React.ReactNode
}

type SidebarState = 'absolute-top' | 'fixed' | 'absolute-bottom'

export default function StickyAbsoluteSidebar({ left, initialTop, stickyTop = 20, style, children }: StickyAbsoluteSidebarProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SidebarState>('absolute-top')
  const [bottomStop, setBottomStop] = useState(0)
  const [fixedLeft, setFixedLeft] = useState(0)

  // Find the 1920px canvas frame that contains the sidebar
  const findCanvas = useCallback((el: Element) => {
    return el.closest('[style*="1920"]') || el.closest('[style*="3239"]')
  }, [])

  const update = useCallback(() => {
    const sidebar = sidebarRef.current
    const sentinel = topSentinelRef.current
    if (!sidebar || !sentinel) return

    const sidebarHeight = sidebar.offsetHeight
    const sentinelRect = sentinel.getBoundingClientRect()

    // Compute the exact fixed left from the canvas's actual viewport position
    const canvasEl = findCanvas(sentinel)
    if (canvasEl) {
      const newLeft = Math.round(canvasEl.getBoundingClientRect().left + left)
      setFixedLeft(prev => prev !== newLeft ? newLeft : prev)
    }

    // Check if sidebar bottom would overlap the footer (if footer exists)
    const footer = document.querySelector('footer')
    if (footer) {
      const footerRect = footer.getBoundingClientRect()
      if (footerRect.top <= stickyTop + sidebarHeight) {
        // Park sidebar above footer using absolute positioning in canvas
        const parentCanvas = canvasEl || sidebar.parentElement
        if (parentCanvas) {
          const canvasRect = parentCanvas.getBoundingClientRect()
          const footerTopInCanvas = footerRect.top - canvasRect.top
          setBottomStop(footerTopInCanvas - sidebarHeight)
          setState('absolute-bottom')
          return
        }
      }
    }

    // Sticky behavior: absolute-top <-> fixed based on sentinel position
    if (sentinelRect.top < 0) {
      setState('fixed')
    } else {
      setState('absolute-top')
    }
  }, [stickyTop, left, findCanvas])

  useEffect(() => {
    // Use scroll listener for precise three-state tracking
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const getStyle = (): React.CSSProperties => {
    switch (state) {
      case 'fixed':
        return {
          position: 'fixed',
          top: `${stickyTop}px`,
          left: `${fixedLeft}px`,
          width: '351px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          ...style,
        }
      case 'absolute-bottom':
        return {
          position: 'absolute',
          left: `${left}px`,
          top: `${bottomStop}px`,
          width: '351px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          ...style,
        }
      default: // absolute-top
        return {
          position: 'absolute',
          left: `${left}px`,
          top: `${initialTop}px`,
          width: '351px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          ...style,
        }
    }
  }

  return (
    <>
      <div
        ref={topSentinelRef}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${initialTop - stickyTop}px`,
          width: '1px',
          height: '1px',
          pointerEvents: 'none',
        }}
      />

      <div ref={sidebarRef} style={getStyle()}>
        {children}
      </div>
    </>
  )
}
