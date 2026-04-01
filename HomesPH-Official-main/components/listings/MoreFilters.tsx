'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings2 } from 'lucide-react'

interface MoreFiltersProps {
  initialValues?: {
    minPrice?: number | null
    maxPrice?: number | null
    minArea?: number | null
    maxArea?: number | null
    keywords?: string
    agent?: string
    tourType?: string[]
  }
  onSelect?: (values: any) => void
}

export default function MoreFilters({ initialValues, onSelect }: MoreFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [values, setValues] = useState({
    minPrice: initialValues?.minPrice || null,
    maxPrice: initialValues?.maxPrice || null,
    minArea: initialValues?.minArea || null,
    maxArea: initialValues?.maxArea || null,
    keywords: initialValues?.keywords || '',
    agent: initialValues?.agent || '',
    tourType: initialValues?.tourType || []
  })
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
    setValues({
      minPrice: null,
      maxPrice: null,
      minArea: null,
      maxArea: null,
      keywords: '',
      agent: '',
      tourType: []
    })
  }

  const handleDone = () => {
    onSelect?.(values)
    setIsOpen(false)
  }

  const toggleTourType = (type: string) => {
    const newTypes = values.tourType.includes(type)
      ? values.tourType.filter(t => t !== type)
      : [...values.tourType, type]
    setValues({ ...values, tourType: newTypes })
  }

  return (
    <div ref={dropdownRef} style={{ position: 'absolute', left: '1425.96px', top: '176px', zIndex: 30 }}>
      {/* Dropdown Button - Rectangle 11178 */}
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
          width: '107.57px',
          height: '22.12px',
          left: '21.11px',
          top: '16.08px',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          fontSize: '22px',
          lineHeight: '22px',
          color: isOpen ? '#1428AE' : '#002143'
        }}>
          More Filter
        </span>

        {/* mingcute:settings-2-line */}
        <div style={{
          position: 'absolute',
          width: '22.12px',
          height: '22.12px',
          left: '153.81px',
          top: '16.08px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Settings2 size={22} color={isOpen ? "#1428AE" : "#002143"} strokeWidth={1.5} />
        </div>
      </div>

      {isOpen && (
        <>
          {/* Polygon 10 */}
          <div style={{
            position: 'absolute',
            width: '30px',
            height: '18.67px',
            left: '147.04px',
            top: '69.14px',
            background: '#FFFFFF',
            borderRadius: '2px',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            zIndex: 101
          }} />

          {/* Rectangle 11220 - Dropdown Container */}
          <div style={{
            position: 'absolute',
            width: '379px',
            height: '634px',
            left: '-181.96px',
            top: '80.44px',
            background: '#FFFFFF',
            boxShadow: '0px 0px 10px rgba(0, 33, 67, 0.2)',
            borderRadius: '10px',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            {/* Price (PHP) Section */}
            <span style={{
              position: 'absolute', width: '90px', height: '22px', left: '18px', top: '22.56px',
              fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', lineHeight: '18px', color: '#002143'
            }}>Price (PHP)</span>
            
            <span style={{ position: 'absolute', left: '18px', top: '54.56px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: '#858484' }}>Minimum</span>
            <input 
              type="text" placeholder="0"
              value={values.minPrice || ''}
              onChange={(e) => setValues({...values, minPrice: Number(e.target.value.replace(/[^0-9]/g, '')) || null})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '160px', height: '40px', left: '18px', top: '84.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            <span style={{ position: 'absolute', left: '200px', top: '54.56px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: '#858484' }}>Maximum</span>
            <input 
              type="text" placeholder="Any"
              value={values.maxPrice || ''}
              onChange={(e) => setValues({...values, maxPrice: Number(e.target.value.replace(/[^0-9]/g, '')) || null})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '160px', height: '40px', left: '200px', top: '84.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            {/* Area (sqm) Section */}
            <span style={{
              position: 'absolute', width: '90px', height: '22px', left: '18px', top: '149.56px',
              fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', lineHeight: '18px', color: '#002143'
            }}>Area (sqm)</span>
            
            <span style={{ position: 'absolute', left: '18px', top: '181.56px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: '#858484' }}>Minimum</span>
            <input 
              type="text" placeholder="0"
              value={values.minArea || ''}
              onChange={(e) => setValues({...values, minArea: Number(e.target.value.replace(/[^0-9]/g, '')) || null})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '160px', height: '40px', left: '18px', top: '211.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            <span style={{ position: 'absolute', left: '200px', top: '181.56px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: '#858484' }}>Maximum</span>
            <input 
              type="text" placeholder="Any"
              value={values.maxArea || ''}
              onChange={(e) => setValues({...values, maxArea: Number(e.target.value.replace(/[^0-9]/g, '')) || null})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '160px', height: '40px', left: '200px', top: '211.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            {/* Keywords Section */}
            <span style={{
              position: 'absolute', width: '90px', height: '22px', left: '18px', top: '276.56px',
              fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', lineHeight: '18px', color: '#002143'
            }}>Keywords</span>
            <input 
              type="text" placeholder="Add relevant keywords"
              value={values.keywords}
              onChange={(e) => setValues({...values, keywords: e.target.value})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '342px', height: '40px', left: '18px', top: '308.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            {/* Agent or Agency Section */}
            <span style={{
              position: 'absolute', width: '144px', height: '22px', left: '18px', top: '373.56px',
              fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', lineHeight: '18px', color: '#002143'
            }}>Agent or Agency</span>
            <input 
              type="text" placeholder="Select and agent or agency"
              value={values.agent}
              onChange={(e) => setValues({...values, agent: e.target.value})}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '342px', height: '40px', left: '18px', top: '405.56px',
                border: '1px solid #D3D3D3', borderRadius: '10px', padding: '0 15px', fontFamily: "'Outfit'", fontSize: '16px', color: '#858484', outline: 'none'
              }}
            />

            {/* Tour Type Section */}
            <span style={{
              position: 'absolute', width: '144px', height: '22px', left: '18px', top: '470.56px',
              fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', lineHeight: '18px', color: '#002143'
            }}>Tour Type</span>
            
            <div 
              onClick={() => toggleTourType('Floor Plans')}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '103px', height: '40px', left: '18px', top: '502.56px',
                border: values.tourType.includes('Floor Plans') ? '1px solid #1428AE' : '1px solid #D3D3D3', borderRadius: '10px',
                background: values.tourType.includes('Floor Plans') ? '#F4F7FF' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: values.tourType.includes('Floor Plans') ? '#1428AE' : '#858484' }}>Floor Plans</span>
            </div>

            <div 
              onClick={() => toggleTourType('Video Tours')}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '116px', height: '40px', left: '131px', top: '502.56px',
                border: values.tourType.includes('Video Tours') ? '1px solid #1428AE' : '1px solid #D3D3D3', borderRadius: '10px',
                background: values.tourType.includes('Video Tours') ? '#F4F7FF' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: values.tourType.includes('Video Tours') ? '#1428AE' : '#858484' }}>Video Tours</span>
            </div>

            <div 
              onClick={() => toggleTourType('360° Tours')}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '103px', height: '40px', left: '257px', top: '502.56px',
                border: values.tourType.includes('360° Tours') ? '1px solid #1428AE' : '1px solid #D3D3D3', borderRadius: '10px',
                background: values.tourType.includes('360° Tours') ? '#F4F7FF' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '16px', color: values.tourType.includes('360° Tours') ? '#1428AE' : '#858484' }}>360° Tours</span>
            </div>

            {/* Footer Buttons */}
            <div 
              onClick={handleReset}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '166px', height: '43px', left: '18px', top: '567.56px',
                border: '1px solid #001392', borderRadius: '8px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', color: '#001392' }}>Reset</span>
            </div>
            <div 
              onClick={handleDone}
              style={{
                boxSizing: 'border-box', position: 'absolute', width: '166px', height: '43px', left: '194px', top: '567.56px',
                background: '#001392', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', color: '#FFFFFF' }}>Done</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
