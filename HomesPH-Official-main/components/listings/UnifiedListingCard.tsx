'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Heart, Share2, ChevronLeft, ChevronRight, User, Bed, Bath } from 'lucide-react'

export interface UnifiedListingCardProps {
  variant: 'projects' | 'buy-rent'
  href: string
  imageUrl: string
  developerLogoUrl?: string
  developerName?: string
  location: string
  // Projects variant
  projectName?: string
  projectType?: string
  availableUnits?: { count: number; typeName: string }[]
  // Buy/Rent variant
  price?: number | null
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  areaSqm?: number
  listingTitle?: string
  tags?: string[]
  brokerBadge?: { label: string; profileImageUrl?: string }
  // Layout overrides from parent
  style?: React.CSSProperties
  className?: string
}

function formatPrice(value: number | null | undefined) {
  if (!value) return '0'
  return Number(value).toLocaleString()
}

export default function UnifiedListingCard({
  variant, href, imageUrl, developerLogoUrl, developerName, location,
  projectName, projectType, availableUnits,
  price, propertyType, bedrooms, bathrooms, areaSqm, listingTitle, tags,
  brokerBadge, style: externalStyle, className,
}: UnifiedListingCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [heartPulse, setHeartPulse] = useState(false)
  const developerSlug = developerName
    ? developerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : null
  const isProjects = variant === 'projects'
  const cardW = isProjects ? 946 : 945.99
  const cardH = isProjects ? 318 : 317.68

  /* ── Shared action buttons (Email / Call / WhatsApp) ── */
  const actionButtons = (
    <div style={{ display: 'flex', gap: '15.08px' }}>
      {/* Email – 109.58 × 50.27 */}
      <div style={{ width: '109.58px', height: '50.27px', background: '#DFE3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
        <svg width="25.13" height="25.13" viewBox="0 0 24 24" fill="#1428AE"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
        <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>Email</span>
      </div>
      {/* Call – 97.51 × 50.27 */}
      <div style={{ width: '97.51px', height: '50.27px', background: '#DFE3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
        <svg width="25.13" height="25.13" viewBox="0 0 24 24" fill="#1428AE"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
        <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>Call</span>
      </div>
      {/* WhatsApp – 152.81 × 50.27 */}
      <div style={{ width: '152.81px', height: '50.27px', background: '#E1FFDF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
        <svg width="23.12" height="23.12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" fill="#00A629" />
          <path d="M17.5 14.33c-.27-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" fill="white" />
        </svg>
        <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#00A629' }}>WhatsApp</span>
      </div>
    </div>
  )

  return (
    <Link
      href={href}
      className={`${className || ''} group block relative hover:-translate-y-[8px] hover:shadow-[0px_20px_40px_rgba(0,33,67,0.12)] hover:z-50 transition-all duration-300`}
      style={{
        boxSizing: 'border-box',
        width: `${cardW}px`,
        height: `${cardH}px`,
        border: '1px solid #D3D3D3',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#FFFFFF',
        textDecoration: 'none',
        color: 'inherit',
        ...externalStyle,
      }}
    >
      {/* ═══════ IMAGE FRAME ═══════ */}
      <div style={{
        position: 'absolute',
        width: isProjects ? '453px' : '453.39px',
        height: isProjects ? '295px' : '295.56px',
        left: isProjects ? '12px' : '12.06px',
        top: isProjects ? '12px' : '11.06px',
        overflow: 'hidden',
        borderRadius: '10px',
        background: '#D9D9D9',
      }}>
        {/* Image */}
        <div style={{ position: 'absolute', width: '451px', height: '294px', left: '0px', top: '0px', borderRadius: '10px', overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt=""
            style={{ position: 'absolute', width: '100%', height: '100%', left: '0px', top: '0px', objectFit: 'cover' }}
          />
        </div>

        {/* Carousel dots */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ position: 'absolute', left: '201px', top: '261px', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: '8.04px', height: '8.04px', background: '#FFFFFF', borderRadius: '50%' }} />
          <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
          <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
          <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%' }} />
        </div>

        {/* Heart & Share */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ position: 'absolute', right: '15px', bottom: '15px', display: 'flex', gap: '15px', zIndex: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setLiked(prev => !prev)
              setHeartPulse(true)
              setTimeout(() => setHeartPulse(false), 400)
            }}
            className="heart-icon-btn"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          >
            <Heart
              size={28.15}
              className={`transition-colors duration-200 hover:[stroke:#F4AA1D] ${heartPulse ? 'animate-heart-pulse' : ''}`}
              color={liked ? '#F4AA1D' : 'white'}
              fill={liked ? '#F4AA1D' : 'none'}
              style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }}
            />
            <style>{`
              .heart-icon-btn:hover svg { stroke: #F4AA1D !important; }
              @keyframes heart-pulse {
                0% { transform: scale(1); }
                30% { transform: scale(1.35); }
                60% { transform: scale(0.9); }
                100% { transform: scale(1); }
              }
              .animate-heart-pulse { animation: heart-pulse 0.4s ease-out; }
            `}</style>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            className="share-icon-btn"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          >
            <Share2
              size={28.15}
              color="white"
              fill="none"
              className="transition-colors duration-200"
              style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }}
            />
            <style>{`
              .share-icon-btn:hover svg { stroke: #1428AE !important; }
            `}</style>
          </button>
        </div>

        {/* Navigation arrows */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ position: 'absolute', width: '35px', height: '35px', left: '14.94px', top: '128.67px', background: 'rgba(255,255,255,0.5)', boxShadow: '0px 0px 10px rgba(0,33,67,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer' }}>
          <ChevronLeft size={15} color="#002143" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ position: 'absolute', width: '35px', height: '35px', right: '14.94px', top: '128.67px', background: 'rgba(255,255,255,0.5)', boxShadow: '0px 0px 10px rgba(0,33,67,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer' }}>
          <ChevronRight size={15} color="#002143" />
        </div>

        {/* Broker badge – buy/rent only */}
        {!isProjects && brokerBadge && (
          <div style={{ position: 'absolute', left: '14px', top: '247px', zIndex: 20 }}>
            <div style={{ width: '101.54px', height: '32.17px', left: '20px', position: 'relative', background: 'linear-gradient(207.12deg, #2D43D8 33.52%, #081148 89.63%)', borderRadius: '0px 10px 10px 0px', display: 'flex', alignItems: 'center', paddingLeft: '21px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#FFFFFF' }}>{brokerBadge.label}</span>
            </div>
            <div style={{ position: 'absolute', width: '45.24px', height: '45.24px', left: '-10px', top: '-7px', borderRadius: '50%', background: '#3249E7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ boxSizing: 'border-box', width: '43.23px', height: '43.23px', background: '#D9D9D9', border: '1px solid #0A124D', borderRadius: '50%', overflow: 'hidden' }}>
                {brokerBadge.profileImageUrl ? (
                  <img src={brokerBadge.profileImageUrl} alt="Broker" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb' }}>
                    <User size={20} color="#9ca3af" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ DEVELOPER LOGO ═══════ */}
      {developerLogoUrl && developerSlug ? (
        <div
          role="link"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/developers/${developerSlug}`) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); router.push(`/developers/${developerSlug}`) } }}
          className="hover:opacity-80 hover:scale-105 transition-all duration-200"
          style={{
            position: 'absolute',
            width: isProjects ? '95px' : '95.5px',
            height: isProjects ? '62px' : '62.19px',
            left: isProjects ? '841px' : '840.43px',
            top: isProjects ? '12px' : '11.06px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '5px',
            background: 'transparent',
            zIndex: 20,
            cursor: 'pointer',
          }}
        >
          <img src={developerLogoUrl} alt={developerName || 'Developer'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          width: isProjects ? '95px' : '95.5px',
          height: isProjects ? '62px' : '62.19px',
          left: isProjects ? '841px' : '840.43px',
          top: isProjects ? '12px' : '11.06px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '5px',
          background: developerLogoUrl ? 'transparent' : '#D9D9D9',
        }}>
          {developerLogoUrl ? (
            <img src={developerLogoUrl} alt="Developer" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>Logo</span>
          )}
        </div>
      )}

      {/* ═══════ INFO AREA ═══════ */}
      <div style={{ position: 'absolute', left: '485.56px', width: '456px', top: '0px', height: '100%' }}>
        {isProjects ? (
          /* ── PROJECTS variant ── */
          <>
            {/* Project Name – 25px / 500 */}
            <div style={{ position: 'absolute', left: '0px', top: '40.92px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '25px', lineHeight: '25px', color: '#002143' }}>{projectName}</span>
            </div>
            {/* Project Type – 15px / 300 */}
            <div style={{ position: 'absolute', left: '0px', top: '82px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{projectType}</span>
            </div>
            {/* "Available Units:" label */}
            <div style={{ position: 'absolute', left: '0px', top: '122px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>Available Units:</span>
            </div>
            {/* Unit counts */}
            <div style={{ position: 'absolute', left: '0px', top: '146.48px', display: 'flex', alignItems: 'center' }}>
              {availableUnits && availableUnits.length > 0 ? availableUnits.map((u, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE' }}>{u.count} {u.typeName}</span>
                  {i < availableUnits.length - 1 && <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3', margin: '0 10px' }} />}
                </React.Fragment>
              )) : (
                <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', color: '#999', fontStyle: 'italic' }}>No units listed</span>
              )}
            </div>
            {/* Location */}
            <div style={{ position: 'absolute', left: '0px', top: '185.68px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={17.09} color="#002143" />
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{location}</span>
            </div>
            {/* Action buttons */}
            <div style={{ position: 'absolute', left: '0px', top: '227.91px' }}>{actionButtons}</div>
          </>
        ) : (
          /* ── BUY / RENT variant ── */
          <>
            {/* Price */}
            <div style={{ position: 'absolute', left: '0px', top: '47.25px', display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '30px', lineHeight: '30px', color: '#002143' }}>Php</span>
              <span style={{ marginLeft: '10px', fontFamily: "'Outfit'", fontWeight: 500, fontSize: '40px', lineHeight: '40px', color: '#002143' }}>{formatPrice(price)}</span>
            </div>
            {/* Details row – Type | Beds | Baths | Area */}
            <div style={{ position: 'absolute', left: '0px', top: '119.63px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{propertyType || 'Apartment'}</span>
              <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bed size={20.11} color="#002143" />
                <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{bedrooms || 0}</span>
              </div>
              <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bath size={20.11} color="#002143" />
                <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{bathrooms || 0}</span>
              </div>
              <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>Area: {areaSqm || 0} sqm</span>
            </div>
            {/* Tags row */}
            <div style={{ position: 'absolute', left: '0px', top: '154.82px', display: 'flex', alignItems: 'center', gap: '10px', width: '430px', overflow: 'hidden' }}>
              {tags && tags.length > 0 ? tags.map((tag, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE', whiteSpace: 'nowrap' }}>{tag}</span>
                  {i < tags.length - 1 && <div style={{ width: '1.01px', height: '15.08px', background: '#D3D3D3', flexShrink: 0 }} />}
                </React.Fragment>
              )) : listingTitle ? (
                <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{listingTitle}</span>
              ) : null}
            </div>
            {/* Location */}
            <div style={{ position: 'absolute', left: '0px', top: '186.99px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={17.09} color="#002143" />
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>{location}</span>
            </div>
            {/* Action buttons */}
            <div style={{ position: 'absolute', left: '0px', top: '229.21px' }}>{actionButtons}</div>
          </>
        )}
      </div>
    </Link>
  )
}
