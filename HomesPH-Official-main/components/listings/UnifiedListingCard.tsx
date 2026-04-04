'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Heart, ChevronLeft, ChevronRight, User, Bed, Bath } from 'lucide-react'

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
        <svg width="23.12" height="23.12" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path fill="#2CB742" d="M0,58l4.988-14.963C2.457,38.78,1,33.812,1,28.5C1,12.76,13.76,0,29.5,0S58,12.76,58,28.5S45.24,57,29.5,57c-4.789,0-9.299-1.187-13.26-3.273L0,58z" />
            <path fill="#FFFFFF" d="M47.683,37.985c-1.316-2.487-6.169-5.331-6.169-5.331c-1.098-0.626-2.423-0.696-3.049,0.42c0,0-1.577,1.891-1.978,2.163c-1.832,1.241-3.529,1.193-5.242-0.52l-3.981-3.981l-3.981-3.981c-1.713-1.713-1.761-3.41-0.52-5.242c0.272-0.401,2.163-1.978,2.163-1.978c1.116-0.627,1.046-1.951,0.42-3.049c0,0-2.844-4.853-5.331-6.169c-1.058-0.56-2.357-0.364-3.203,0.482l-1.758,1.758c-5.577,5.577-2.831,11.873,2.746,17.45l5.097,5.097l5.097,5.097c5.577,5.577,11.873,8.323,17.45,2.746l1.758-1.758C48.048,40.341,48.243,39.042,47.683,37.985z" />
          </g>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28.15"
              height="28.15"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="transition-colors duration-200"
              style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }}
            >
              <path
                fill="currentColor"
                d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"
              />
            </svg>
            <style>{`
              .share-icon-btn { color: #FFFFFF; }
              .share-icon-btn:hover { color: #F4AA1D; }
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
