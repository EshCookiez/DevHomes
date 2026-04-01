'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NewsItem {
  title: string
  imageUrl: string
  href: string
}

/**
 * Picks the most "interesting" phrase from a title and wraps it in a bold highlight.
 */
function highlightTitle(title: string) {
  // 1) Quoted text
  const quoted = title.match(/"([^"]+)"|"([^"]+)"|«([^»]+)»/)
  if (quoted) {
    const match = quoted[0]
    const idx = title.indexOf(match)
    return (
      <>
        {title.slice(0, idx)}
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{match}</strong>
        {title.slice(idx + match.length)}
      </>
    )
  }

  // 2) Proper-noun phrases (2+ consecutive capitalized words)
  const properNoun = title.match(/(?:[A-Z][a-zA-Z]{1,}\s){1,}[A-Z][a-zA-Z]{1,}/g)
  if (properNoun) {
    const best = properNoun.sort((a, b) => b.length - a.length)[0]
    const idx = title.indexOf(best)
    return (
      <>
        {title.slice(0, idx)}
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{best}</strong>
        {title.slice(idx + best.length)}
      </>
    )
  }

  // 3) Fallback — first 3 words
  const words = title.split(' ')
  if (words.length > 3) {
    const head = words.slice(0, 3).join(' ')
    const rest = words.slice(3).join(' ')
    return (
      <>
        <strong style={{ fontWeight: 600, color: '#1428AE' }}>{head}</strong>
        {' '}{rest}
      </>
    )
  }

  return <strong style={{ fontWeight: 600, color: '#1428AE' }}>{title}</strong>
}

export default function LatestUpdatesList({ news }: { news: NewsItem[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div style={{ width: '351px', marginTop: '30px' }}>
      {/* Top divider */}
      <div style={{ width: '350px', height: '1px', background: '#D0D0D0' }} />
      {/* Title */}
      <div style={{ marginTop: '18px', marginBottom: '11.28px' }}>
        <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '20px', lineHeight: '20px', color: '#002143' }}>Latest Updates</span>
      </div>

      {news.length > 0 ? news.map((item, i) => {
        const isHovered = hoveredIdx === i
        return (
          <div key={i}>
            <Link
              href={item.href}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                gap: '23px',
                textDecoration: 'none',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderRadius: '6px',
                transition: 'background 0.2s ease',
                background: isHovered ? '#F5F7FF' : 'transparent',
                margin: '0 -6px',
                paddingLeft: '6px',
                paddingRight: '6px',
                cursor: 'pointer',
              }}
            >
              {/* Image */}
              <div style={{
                width: '127.88px',
                height: '79px',
                borderRadius: '5px',
                background: '#D9D9D9',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isHovered ? '0 2px 8px rgba(20,40,174,0.15)' : 'none',
              }}>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" style={{ width: '128px', height: '79px', objectFit: 'cover' }} />
                )}
              </div>
              {/* Title */}
              <span style={{
                width: '180px',
                fontFamily: "'Outfit'",
                fontWeight: 300,
                fontSize: '15px',
                lineHeight: '20px',
                color: isHovered ? '#1428AE' : '#002143',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                transition: 'color 0.2s ease',
              }}>
                {highlightTitle(item.title)}
              </span>
            </Link>
            {/* Divider */}
            <div style={{ width: '350px', height: '1px', background: '#D0D0D0' }} />
          </div>
        )
      }) : (
        /* Placeholder skeleton */
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div style={{ display: 'flex', gap: '23px', alignItems: 'flex-start', padding: '10px 0' }}>
              <div style={{ width: '127.88px', height: '79px', borderRadius: '5px', background: '#D9D9D9', flexShrink: 0 }} />
              <div style={{ width: '180px' }}>
                <div style={{ width: '160px', height: '14px', background: '#E5E7EB', borderRadius: '3px', marginBottom: '8px' }} />
                <div style={{ width: '140px', height: '14px', background: '#E5E7EB', borderRadius: '3px', marginBottom: '8px' }} />
                <div style={{ width: '100px', height: '14px', background: '#E5E7EB', borderRadius: '3px' }} />
              </div>
            </div>
            <div style={{ width: '350px', height: '1px', background: '#D0D0D0' }} />
          </div>
        ))
      )}
    </div>
  )
}
