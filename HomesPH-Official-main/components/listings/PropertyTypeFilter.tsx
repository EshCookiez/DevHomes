'use client'

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface PropertyTypeFilterProps {
  initialValue?: string[]
  onSelect?: (selected: string[]) => void
}

const RESIDENTIAL_TYPES = [
  { name: 'Apartment', left: '20px', top: '83px' },
  { name: 'Townhouse', left: '20px', top: '138px' },
  { name: 'Villa Compound', left: '20px', top: '193px' },
  { name: 'Land', left: '20px', top: '248px' },
  { name: 'Building', left: '20px', top: '303px' },
  { name: 'Villa', left: '264px', top: '83px' },
  { name: 'Penthouse', left: '264px', top: '138px' },
  { name: 'Hotel Apartment', left: '264px', top: '193px' },
  { name: 'Floor', left: '264px', top: '248px' }
]

const COMMERCIAL_TYPES = [
  { name: 'Office', left: '20px', top: '83px' },
  { name: 'Retail', left: '20px', top: '138px' },
  { name: 'Warehouse', left: '20px', top: '193px' },
  { name: 'Commercial Land', left: '20px', top: '248px' },
  { name: 'Building', left: '264px', top: '83px' }
]

export default function PropertyTypeFilter({ initialValue = [], onSelect }: PropertyTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'Residential' | 'Commercial'>('Residential')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialValue)
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

  const toggleType = (type: string) => {
    const newSelected = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newSelected)
  }

  const handleReset = () => {
    setSelectedTypes([])
  }

  const handleDone = () => {
    onSelect?.(selectedTypes)
    setIsOpen(false)
  }

  const currentTypes = activeTab === 'Residential' ? RESIDENTIAL_TYPES : COMMERCIAL_TYPES

  return (
    <div ref={dropdownRef} style={{ position: 'absolute', left: '991.67px', top: '176px', zIndex: 30 }}>
      {/* Dropdown Button - Rectangle 11132 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '197.04px',
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
          width: '106.56px',
          height: '22.12px',
          left: '18.1px',
          top: '16.08px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          fontSize: '22px',
          lineHeight: '22px',
          color: isOpen ? '#1428AE' : '#002143'
        }}>
          {activeTab}
        </span>
        <div style={{
          position: 'absolute',
          width: '28.15px',
          height: '28.15px',
          left: '149.79px',
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
            left: '149.33px',
            top: '69.07px',
            background: '#FFFFFF',
            borderRadius: '2px',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            zIndex: 101
          }} />

          {/* Rectangle 11220 - Dropdown Container */}
          <div style={{
            position: 'absolute',
            width: '515px',
            height: '440px',
            left: '-323.67px',
            top: '81px',
            background: '#FFFFFF',
            boxShadow: '0px 0px 10px rgba(0, 33, 67, 0.2)',
            borderRadius: '10px',
            zIndex: 100
          }}>
            {/* Tabs Section */}
            <div 
              onClick={() => setActiveTab('Residential')}
              style={{
                position: 'absolute', width: '98px', height: '23px', left: '84px', top: '24px',
                fontFamily: "'Outfit'", fontWeight: activeTab === 'Residential' ? 500 : 300, fontSize: '20px', lineHeight: '20px',
                textAlign: 'center', color: activeTab === 'Residential' ? '#1428AE' : '#868CB4', cursor: 'pointer'
              }}
            >Residential</div>
            
            <div 
              onClick={() => setActiveTab('Commercial')}
              style={{
                position: 'absolute', width: '108px', height: '23px', left: '327px', top: '24px',
                fontFamily: "'Outfit'", fontWeight: activeTab === 'Commercial' ? 500 : 300, fontSize: '20px', lineHeight: '20px',
                textAlign: 'center', color: activeTab === 'Commercial' ? '#1428AE' : '#868CB4', cursor: 'pointer'
              }}
            >Commercial</div>

            {/* Tab Underline / Divider */}
            <div style={{ position: 'absolute', width: '474px', height: '1px', left: '20px', top: '57px', background: '#D3D3D3' }} />
            <div style={{ 
              position: 'absolute', width: '237px', height: '2px', 
              left: activeTab === 'Residential' ? '20px' : '257px', 
              top: '56px', background: '#1428AE', transition: 'left 0.2s ease'
            }} />

            {/* Property Types List */}
            {currentTypes.map((type) => (
              <div
                key={type.name}
                onClick={() => toggleType(type.name)}
                style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: '230px',
                  height: '45px',
                  left: type.left,
                  top: type.top,
                  border: '1px solid #D3D3D3',
                  borderRadius: '15px',
                  background: selectedTypes.includes(type.name) ? '#F4F7FF' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                {/* Checkbox Rectangle */}
                <div style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: '23px',
                  height: '23px',
                  left: '14px',
                  top: '11px',
                  border: selectedTypes.includes(type.name) ? 'none' : '2px solid #E0E0E0',
                  borderRadius: '8px',
                  background: selectedTypes.includes(type.name) ? '#1428AE' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedTypes.includes(type.name) && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
                
                {/* label */}
                <span style={{
                  position: 'absolute',
                  left: '62px',
                  fontFamily: "'Outfit'",
                  fontWeight: 300,
                  fontSize: '16px',
                  lineHeight: '25px',
                  color: '#858484'
                }}>
                  {type.name}
                </span>
              </div>
            ))}

            {/* Footer Buttons */}
            <div 
              onClick={handleReset}
              style={{
                boxSizing: 'border-box',
                position: 'absolute',
                width: '230px',
                height: '43px',
                left: '20px',
                top: '373px',
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
                width: '230px',
                height: '43px',
                left: '264px',
                top: '373px',
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
