'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { SubscribeModal } from './SubscribeModal'

export function SubscribeToNews({ autoOpen = false }: { autoOpen?: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(autoOpen)

  return (
    <>
      <div className="mt-10 max-w-[1327px] mx-auto w-full px-4 sm:px-6 lg:px-0">
        <div
          className="w-full rounded-[20px] px-6 py-8 sm:px-8 md:px-12 md:py-10 flex flex-col lg:flex-row items-center gap-8"
          style={{ background: 'linear-gradient(90deg, #EDF6FF 0%, #FFF8E2 100%)' }}
        >
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: '#002143' }}>
              <Icon icon="mdi:bell" width={18} height={18} style={{ color: '#FFE8A6' }} />
              <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ fontFamily: 'Outfit', color: '#FFE8A6' }}>
                Daily News Brief
              </span>
            </div>
            <h3 className="text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-extrabold leading-[1.15] mb-3" style={{ fontFamily: 'Outfit', color: '#002143' }}>
              Get HomesPH news delivered before the next market shift catches you late.
            </h3>
            <p className="text-[18px] sm:text-[20px] md:text-[23px] lg:text-[25px] font-light leading-[1.5] mb-5" style={{ fontFamily: 'Outfit', color: '#4A5568' }}>
              Subscribe for daily Philippine real estate news, buyer insights, and lifestyle stories curated from the HomesPH news desk.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Real Estate', 'Home Buying', 'Lifestyle'].map(tag => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-[10px] text-[13px] font-medium"
                  style={{ fontFamily: 'Outfit', color: '#002143', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,33,67,0.08)' }}
                >
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Right card */}
          <div
            className="w-full lg:w-[360px] shrink-0 rounded-[16px] px-5 py-6 sm:px-7 sm:py-7"
            style={{ background: '#002143' }}
          >
            <h4 className="text-[20px] sm:text-[22px] md:text-[25px] font-bold uppercase tracking-wider mb-4" style={{ fontFamily: 'Outfit', color: '#F5D681' }}>
              What You Get
            </h4>
            <ul className="space-y-3 mb-6">
              {[
                'Daily digest delivered at 8:00 AM.',
                'Stories focused on Philippine real estate and buyer trends.',
                'One-click signup through the same subscription form used in the popup.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="shrink-0 mt-0.5">
                    <Icon icon="mdi:check-circle" width={20} height={20} style={{ color: '#FFE8A6' }} />
                  </span>
                  <span className="text-[15px] sm:text-[16px] md:text-[18px] font-light leading-[1.45]" style={{ fontFamily: 'Outfit', color: '#FFFFFF' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 rounded-[10px] text-[16px] sm:text-[18px] md:text-[20px] font-semibold transition-colors hover:opacity-90"
              style={{ fontFamily: 'Outfit', background: '#FFE8A6', color: '#002143' }}
            >
              Subscribe to News
            </button>
          </div>
        </div>
      </div>

      <SubscribeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
