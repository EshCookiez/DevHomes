'use client'

import React from 'react'
import { BedDouble, Bath, Square, MapPin } from 'lucide-react'
import { PublicProject } from '@/lib/projects-public'
import Link from 'next/link'

interface ProjectGridCardProps {
  project: PublicProject
}

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : 'Price on request'

export default function ProjectGridCard({ project }: ProjectGridCardProps) {
  const bedrooms = Math.max(...(project.project_units?.map(u => u.bedrooms ?? 0) ?? [0]))
  const bathrooms = Math.max(...(project.project_units?.map(u => u.bathrooms ?? 0) ?? [0]))
  const maxArea = Math.max(...(project.project_units?.map(u => u.floor_area_sqm ?? 0) ?? [0]))

  return (
    <Link 
      href={`/projects/${project.slug}`}
      className="group bg-white rounded-[10px] border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={project.main_image_url ?? `https://picsum.photos/seed/${project.slug}/400/300`}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Dots indicator mockup */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white shadow-sm"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[20px] font-outfit font-medium text-[#002143] mb-1">
          {fmt(project.price_range_min)}
        </h3>

        {/* Icons Row */}
        <div className="flex items-center gap-4 text-[#002143] mb-3">
          <div className="flex items-center gap-1.5">
            <BedDouble size={18} className="text-[#002143]" />
            <span className="text-[14px] font-outfit font-light">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath size={18} className="text-[#002143]" />
            <span className="text-[14px] font-outfit font-light">{bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square size={16} className="text-[#002143]" />
            <span className="text-[14px] font-outfit font-light">{maxArea} sqm</span>
          </div>
        </div>

        {/* Location Section */}
        <div className="flex items-start gap-1 text-[#002143] mb-2">
          <MapPin size={16} className="text-[#002143] shrink-0 mt-0.5" />
          <p className="text-[14px] font-outfit font-light leading-snug">
            {project.name}, {project.city_municipality}, {project.province}
          </p>
        </div>

        {/* Developer Logo Placeholder */}
        <div className="mt-auto pt-2">
           {project.developers_profiles?.logo_url ? (
             <img src={project.developers_profiles.logo_url} alt="Dev logo" className="h-4 object-contain opacity-70" />
           ) : (
             <span className="text-[12px] font-outfit font-light text-gray-400 capitalize">
               {project.developers_profiles?.developer_name || 'Homes.ph'}
             </span>
           )}
        </div>
      </div>
    </Link>
  )
}
