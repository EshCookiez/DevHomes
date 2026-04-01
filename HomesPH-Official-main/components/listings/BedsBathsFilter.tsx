'use client'

import { useState, useEffect, useRef } from 'react'

interface BedsBathsFilterProps {
  initialBeds?: string | number | null
  initialBaths?: string | number | null
  onSelect?: (beds: string | number | null, baths: string | number | null) => void
}

const BEDS_OPTIONS = [
  { name: 'Studio', width: '86px', left: '17px', top: '61px' },
  { name: '1', width: '50px', left: '113px', top: '61px' },
  { name: '2', width: '49px', left: '173px', top: '61px' },
  { name: '3', width: '47px', left: '232px', top: '61px' },
  { name: '4', width: '48px', left: '289px', top: '61px' },
  { name: '5', width: '47px', left: '17px', top: '113px' },
  { name: '6+', width: '47px', left: '74px', top: '113px' }
]

const BATHS_OPTIONS = [
  { name: '1', width: '50px', left: '17px', top: '202px' },
  { name: '2', width: '49px', left: '77px', top: '202px' },
  { name: '3', width: '47px', left: '136px', top: '202px' },
  { name: '4', width: '48px', left: '193px', top: '202px' },
  { name: '5', width: '47px', left: '251px', top: '202px' },
  { name: '6+', width: '47px', left: '17px', top: '254px' }
]

export default function BedsBathsFilter({ initialBeds, initialBaths, onSelect }: BedsBathsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBeds, setSelectedBeds] = useState<string | number | null>(initialBeds || null)
  const [selectedBaths, setSelectedBaths] = useState<string | number | null>(initialBaths || null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleReset = () => {
    setSelectedBeds(null)
    setSelectedBaths(null)
  }

  const handleDone = () => {
    onSelect?.(selectedBeds, selectedBaths)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} style={{ position: 'absolute', left: '1198.76px', top: '176px', zIndex: 30 }}>
      {/* Dropdown Button - Rectangle 11177 */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '217.15px',
          height: '55.29px',
          left: '0px',
          top: '0px',
          border: isOpen ? '1px solid #1428AE' : '1px solid #D3D3D3',
          borderRadius: '10px',
          background: '#FFFFFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <span style={{ 
          position: 'absolute',
          width: '127.67px',
          height: '22.12px',
          left: '18.1px',
          top: '16.08px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          fontSize: '22px',
          lineHeight: '22px',
          color: isOpen ? '#1428AE' : '#002143'
        }}>
          Beds & Baths
        </span>

        <div style={{
          position: 'absolute',
          width: '28.15px',
          height: '28.15px',
          left: '170.9px',
          top: '13.07px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.1676 10.5L14.0009 16.3333L19.8343 10.5" stroke={isOpen ? "#1428AE" : "#002143"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Polygon 10 */}
          <div style={{
            position: 'absolute',
            width: '30px',
            height: '19.69px',
            left: '168.24px',
            top: '69.07px',
            background: '#FFFFFF',
            borderRadius: '2px',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            zIndex: 101
          }} />

          {/* Rectangle 11220 - Dropdown Container */}
          <div style={{
            position: 'absolute',
            width: '355px',
            height: '382px',
            left: '-145.76px',
            top: '81px',
            background: '#FFFFFF',
            boxShadow: '0px 0px 10px rgba(0, 33, 67, 0.2)',
            borderRadius: '10px',
            zIndex: 100
          }}>
            {/* Header: Beds */}
            <span style={{
              position: 'absolute',
              width: '39px',
              height: '22px',
              left: '17px',
              top: '24px',
              fontFamily: "'Outfit'",
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '18px',
              color: '#002143'
            }}>Beds</span>

            {/* Beds Chips */}
            {BEDS_OPTIONS.map((opt) => (
              <div
                key={opt.name}
                onClick={() => setSelectedBeds(selectedBeds === opt.name ? null : opt.name)}
                style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: opt.width,
                  height: '32px',
                  left: opt.left,
                  top: opt.top,
                  border: selectedBeds === opt.name ? '1px solid #1428AE' : '1px solid #D3D3D3',
                  borderRadius: '10px',
                  background: selectedBeds === opt.name ? '#F4F7FF' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontFamily: "'Outfit'",
                  fontWeight: 300,
                  fontSize: '16px',
                  lineHeight: '25px',
                  color: selectedBeds === opt.name ? '#1428AE' : '#858484'
                }}>{opt.name}</span>
              </div>
            ))}

            {/* Header: Baths */}
            <span style={{
              position: 'absolute',
              width: '47px',
              height: '22px',
              left: '17px',
              top: '165px',
              fontFamily: "'Outfit'",
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '18px',
              color: '#002143'
            }}>Baths</span>

            {/* Baths Chips */}
            {BATHS_OPTIONS.map((opt) => (
              <div
                key={opt.name}
                onClick={() => setSelectedBaths(selectedBaths === opt.name ? null : opt.name)}
                style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: opt.width,
                  height: '32px',
                  left: opt.left,
                  top: opt.top,
                  border: selectedBaths === opt.name ? '1px solid #1428AE' : '1px solid #D3D3D3',
                  borderRadius: '10px',
                  background: selectedBaths === opt.name ? '#F4F7FF' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontFamily: "'Outfit'",
                  fontWeight: 300,
                  fontSize: '16px',
                  lineHeight: '25px',
                  color: selectedBaths === opt.name ? '#1428AE' : '#858484'
                }}>{opt.name}</span>
              </div>
            ))}

            {/* Footer Buttons */}
            <div 
              onClick={handleReset}
              style={{
                boxSizing: 'border-box',
                position: 'absolute',
                width: '155px',
                height: '43px',
                left: '17px',
                top: '316px',
                border: '1px solid #001392',
                borderRadius: '8px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '25px', color: '#001392' }}>Reset</span>
            </div>
            <div 
              onClick={handleDone}
              style={{
                position: 'absolute',
                width: '155px',
                height: '43px',
                left: '182px',
                top: '316px',
                background: '#001392',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '25px', color: '#FFFFFF' }}>Done</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
