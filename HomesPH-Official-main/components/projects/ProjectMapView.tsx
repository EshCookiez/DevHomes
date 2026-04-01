'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, LayoutList, Map } from 'lucide-react'
import ProjectGridCard from './ProjectGridCard'
import ProjectMap from './ProjectMap'
import { PublicProject } from '@/lib/projects-public'

interface ProjectMapViewProps {
  projects: PublicProject[]
  searchParams: Record<string, string | undefined>
}

export default function ProjectMapView({ projects, searchParams }: ProjectMapViewProps) {
  const [hoveredProjectId, setHoveredProjectId] = useState<number | null>(null)
  
  const locationText = searchParams.location || 'Philippines'
  const contractText = searchParams.status === 'Rent' ? 'rent' : 'sale'

  return (
    <div className="flex h-[calc(100vh-116px)] -mx-4 md:-mx-8 lg:-mx-12 xl:-mx-24 2xl:-mx-[296px] -mt-8">
      {/* Left Side: Scrollable List */}
      <div className="w-[45%] h-full overflow-y-auto px-8 py-6 bg-white border-r border-gray-200 scrollbar-hide">
        {/* Action links */}
        {/* Action links */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={{ query: { ...searchParams, view: 'list' } }}
            className="flex items-center gap-1.5 text-[#001392] font-outfit font-medium text-[16px] hover:underline transition-all"
          >
            <ChevronLeft size={18} />
            Return to regular search
          </Link>
          <button 
            onClick={() => window.location.href = '/projects'}
            className="text-[#001392] font-outfit font-medium text-[16px] hover:underline"
          >
            Clear Filters
          </button>
        </div>

        <h2 className="text-[35px] font-outfit font-normal text-[#002143] mb-8 leading-tight">
          Properties for {contractText} in {locationText}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {projects.map(p => (
            <ProjectGridCard key={p.id} project={p} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="py-20 text-center">
             <h3 className="text-xl font-outfit text-gray-500">No properties found matching your filters.</h3>
          </div>
        )}
      </div>

      {/* Right Side: Map */}
      <div className="flex-1 h-full bg-gray-100 relative">
        <ProjectMap 
          projects={projects} 
          selectedProjectId={hoveredProjectId} 
        />
        
        {/* List / Map toggle */}
        <div className="absolute top-4 left-4 z-10 flex items-center border border-[#D3D3D3] rounded-lg bg-white shadow-sm h-[48px] p-1">
          <Link
            href={{ query: { ...searchParams, view: 'list' } }}
            className="flex items-center justify-center gap-2 w-[105px] h-full text-[18px] transition-colors rounded-[8px] text-gray-400 font-light hover:text-[#002143] hover:bg-gray-50"
          >
            <LayoutList size={18} />
            List
          </Link>
          <div
            className="flex items-center justify-center gap-2 w-[105px] h-full text-[18px] transition-colors rounded-[8px] bg-[#DFE3FF] text-[#1428ae] font-medium"
          >
            <Map size={18} />
            Map
          </div>
        </div>
      </div>
    </div>
  )
}
