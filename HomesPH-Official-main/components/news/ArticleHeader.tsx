'use client'

import { Share2, Printer, Copy } from 'lucide-react'

interface ArticleHeaderProps {
  title: string
  updatedTime: string
  author: string
  viewsCount?: number
}

export function ArticleHeader({
  title,
  updatedTime,
  author,
  viewsCount,
}: ArticleHeaderProps) {
  return (
    <div className="mb-8 border-l-4 border-[#1428ae] pl-6">
      <h1 className="text-4xl font-extrabold leading-tight text-gray-950 mb-3">
        {title}
      </h1>
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
        <span className="font-semibold text-gray-700">UPDATED {updatedTime.toUpperCase()}</span>
        <div className="flex items-center gap-2">
          <span>By</span>
          <span className="font-semibold text-gray-700">{author}</span>
        </div>
        {viewsCount !== undefined && (
          <span className="text-gray-500">{viewsCount.toLocaleString()} views</span>
        )}
      </div>
      
      {/* Social Buttons */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share">
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          title="Print" 
          onClick={() => window.print()}
        >
          <Printer className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
          title="Copy link"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          <Copy className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
