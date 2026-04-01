'use client'

import { useState } from 'react'
import { ChevronDown, Settings2 } from 'lucide-react'

interface FilterDropdownProps {
  label: string
  width: string
  left: string
  top: string
  icon?: React.ReactNode
}

export default function FilterDropdown({ label, width, left, top, icon }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      style={{
        boxSizing: 'border-box',
        position: 'absolute',
        width: width,
        height: '55.29px',
        left: left,
        top: top,
        border: '1px solid #D3D3D3',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        background: '#FFFFFF',
        cursor: 'pointer',
        zIndex: 15,
        pointerEvents: 'auto',
        transition: 'border-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.borderColor = '#1428AE'}
      onMouseOut={(e) => e.currentTarget.style.borderColor = '#D3D3D3'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span style={{ 
          fontSize: '22px', 
          fontWeight: 300, 
          color: '#002143', 
          fontFamily: "'Outfit', sans-serif",
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {label}
        </span>
      </div>
      {!icon && <ChevronDown size={28} color="#002143" />}
      
      {/* Dropdown Menu Placeholder */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '0',
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #D3D3D3',
          borderRadius: '10px',
          boxShadow: '0px 10px 30px rgba(0, 33, 67, 0.1)',
          padding: '10px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{ 
            padding: '10px 15px', 
            fontSize: '16px', 
            color: '#002143', 
            fontFamily: "'Outfit'", 
            borderRadius: '5px',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#F4F4F9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Any {label}
          </div>
          <div style={{ 
            padding: '10px 15px', 
            fontSize: '16px', 
            color: '#002143', 
            fontFamily: "'Outfit'", 
            borderRadius: '5px',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#F4F4F9'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Custom Filter...
          </div>
        </div>
      )}
    </div>
  )
}
