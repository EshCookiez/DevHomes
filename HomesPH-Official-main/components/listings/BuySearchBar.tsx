'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { getListingSuggestions, type ListingSuggestion } from '@/lib/actions/listing-search'

interface BuySearchBarProps {
  initialValue?: string
}

export default function BuySearchBar({ initialValue = '' }: BuySearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<ListingSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync with URL changes
  useEffect(() => {
    const loc = searchParams.get('location') || ''
    setQuery(loc)
  }, [searchParams])

  // Handle typing and suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length >= 2) {
        const results = await getListingSuggestions(query.trim())
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = (customQuery?: string) => {
    const finalQuery = customQuery || query
    const params = new URLSearchParams(searchParams.toString())
    if (finalQuery.trim()) {
      params.set('location', finalQuery.trim())
    } else {
      params.delete('location')
    }
    // Always reset to page 1 on new search if applicable
    params.delete('page')
    setShowDropdown(false)
    router.push(`/buy?${params.toString()}`)
  }

  return (
    <>
      {/* Input Box */}
      <div
        ref={dropdownRef}
        style={{
          boxSizing: 'border-box',
          position: 'absolute',
          width: '685px',
          height: '55px',
          left: '296px',
          top: '176px',
          border: '1px solid #D3D3D3',
          borderRadius: '10px',
          paddingLeft: '38px',
          display: 'flex',
          alignItems: 'center',
          background: '#FFFFFF',
          zIndex: 20,
          pointerEvents: 'auto'
        }}
      >
        <Search
          style={{
            position: 'absolute',
            left: '12px',
            top: '16px',
            border: '1.83px solid #002143',
            borderRadius: '4px'
          }}
          size={20}
          color="#002143"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          placeholder="City, community or building"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            fontSize: '20px',
            fontWeight: 300,
            color: '#002143',
            background: 'transparent',
            fontFamily: "'Outfit', sans-serif",
            padding: '0 10px'
          }}
        />

        {/* Dropdown Suggestions */}
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '0px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0px 10px 30px rgba(0, 33, 67, 0.15)',
            zIndex: 50,
            overflow: 'hidden',
            border: '1px solid #D3D3D3'
          }}>
            {suggestions.map((listing) => (
              <div
                key={listing.id}
                onClick={() => {
                  setQuery(listing.title)
                  handleSearch(listing.title)
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F4FAF9'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  gap: '16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #F0F0F0',
                  transition: 'background 0.2s ease',
                  minHeight: '75px'
                }}
              >
                {/* Property Image */}
                <div style={{
                  width: '80px',
                  height: '60px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#F0F0F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <img
                    src={listing.image_url || 'https://via.placeholder.com/80x60?text=No+Image'}
                    alt={listing.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '2px' }}>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#002143',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {listing.title}
                  </span>
                  
                  {listing.price && (
                    <span style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1428AE',
                    }}>
                      ₱{listing.price.toLocaleString()}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="#8187B0" />
                    <span style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '12px',
                      fontWeight: 400,
                      color: '#8187B0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {listing.address}
                    </span>
                  </div>
                </div>

                {/* Project/Developer Logo */}
                {listing.logo_url && (
                  <img
                    src={listing.logo_url}
                    alt="Developer Logo"
                    style={{
                      width: '60px',
                      height: '40px',
                      objectFit: 'contain',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={() => handleSearch()}
        style={{
          position: 'absolute',
          width: '115px',
          height: '45px',
          left: '861px',
          top: '181.12px',
          background: '#1428AE',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 21,
          pointerEvents: 'auto',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = '#001392'}
        onMouseOut={(e) => e.currentTarget.style.background = '#1428AE'}
      >
        <span style={{
          fontSize: '18px',
          fontWeight: 500,
          color: '#FFFFFF',
          fontFamily: "'Outfit', sans-serif"
        }}>
          Search
        </span>
      </button>
    </>
  )
}
