'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export function ListingFilters({ 
  locationLabel, 
  basePath = '/buy'
}: { 
  locationLabel: string, 
  basePath?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for search to debounce
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Local state for other filters
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [beds, setBeds] = useState(searchParams.get('beds') || '')
  const [baths, setBaths] = useState(searchParams.get('baths') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')

  // Apply Search
  useEffect(() => {
    updateUrl({ q: debouncedSearchTerm })
  }, [debouncedSearchTerm])

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset page to 1 on filter changes if we had pagination (optional future proofing)
    if (params.has('page') && Object.keys(updates).some(k => k !== 'page')) {
      params.delete('page')
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const applyFilters = () => {
    updateUrl({ minPrice, maxPrice, beds, baths, sort })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setMinPrice('')
    setMaxPrice('')
    setBeds('')
    setBaths('')
    setSort('newest')
    router.push(pathname)
  }

  const activeFiltersCount = [
    searchParams.get('minPrice'),
    searchParams.get('maxPrice'),
    searchParams.get('beds'),
    searchParams.get('baths')
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-20 z-10 transition-all">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input 
            placeholder={`Search by project, developer, or keyword in ${locationLabel}...`} 
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort Dropdown */}
        <div className="w-full md:w-48 shrink-0">
          <Select value={sort} onValueChange={(val) => { setSort(val); updateUrl({ sort: val }) }}>
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto shrink-0 relative flex gap-2 border-gray-200">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center rounded-full bg-[#1428ae] text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-5" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h4 className="font-semibold text-sm">Advanced Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-gray-400 hover:text-gray-900">
                    Clear all
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Price Range (₱)</label>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="h-9" />
                  <span className="text-gray-400">-</span>
                  <Input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="h-9" />
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Bedrooms</label>
                  <Select value={beds} onValueChange={setBeds}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Bathrooms</label>
                  <Select value={baths} onValueChange={setBaths}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-[#1428ae] hover:bg-[#0c1a7a] text-white" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {searchParams.get('minPrice') && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-normal px-2.5 py-1">
              Min: ₱{Number(searchParams.get('minPrice')).toLocaleString()}
              <X className="w-3 h-3 ml-1.5 cursor-pointer" onClick={() => updateUrl({ minPrice: null })} />
            </Badge>
          )}
          {searchParams.get('maxPrice') && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-normal px-2.5 py-1">
              Max: ₱{Number(searchParams.get('maxPrice')).toLocaleString()}
              <X className="w-3 h-3 ml-1.5 cursor-pointer" onClick={() => updateUrl({ maxPrice: null })} />
            </Badge>
          )}
          {searchParams.get('beds') && searchParams.get('beds') !== 'any' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-normal px-2.5 py-1">
              {searchParams.get('beds')}+ Beds
              <X className="w-3 h-3 ml-1.5 cursor-pointer" onClick={() => updateUrl({ beds: null })} />
            </Badge>
          )}
          {searchParams.get('baths') && searchParams.get('baths') !== 'any' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-normal px-2.5 py-1">
              {searchParams.get('baths')}+ Baths
              <X className="w-3 h-3 ml-1.5 cursor-pointer" onClick={() => updateUrl({ baths: null })} />
            </Badge>
          )}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 focus:outline-none ml-1">
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
