'use client'

import { useState, useEffect, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Menu, Search, X } from 'lucide-react'
import Image from 'next/image'

/* ── Solid / filled icon helpers for the top bar ── */
const PhoneSolid = ({ size = 12, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
  </svg>
)

const MailSolid = ({ size = 12, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
    <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
    <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
  </svg>
)
import RegisterModal from '../auth/RegisterModal'
import LocationSwitcher from '@/components/home/LocationSwitcher'
import { useSelectedLocation } from '@/hooks/use-selected-location'
import { buildContextHomeHref, buildNewsHref } from '@/lib/news-navigation'
import type { GeneralNavItem } from '@/lib/general-nav'
import { normalizeLocationSlug } from '@/lib/url-slugs'

interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  [key: string]: string | undefined
}

const STATIC_ROOT_SEGMENTS = new Set([
  'buy',
  'rent',
  'projects',
  'news',
  'contact-us',
  'login',
  'registration',
  'forgot-password',
  'legal',
  'developers',
  'search',
  'restaurant',
  'tourism',
  'our-company',
  'mortgage',
  'favorites',
  'dashboard',
])

function getLocationContextFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return undefined
  if (segments.length >= 2 && segments[1] === 'news' && !STATIC_ROOT_SEGMENTS.has(segments[0])) {
    return decodeURIComponent(segments[0])
  }
  if (segments[0] === 'news' && segments[1]) return decodeURIComponent(segments[1])
  if (segments.length === 1 && !STATIC_ROOT_SEGMENTS.has(segments[0])) {
    return decodeURIComponent(segments[0])
  }

  return undefined
}

function getNavSectionFromPath(pathname: string): 'home' | 'buy' | 'rent' | 'projects' | 'news' | 'contact-us' | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return 'home'

  const first = segments[0]
  const second = segments[1]

  // Location-prefixed routes, e.g. /cebu/buy, /cebu/rent, /cebu/projects, /cebu/news
  if (!STATIC_ROOT_SEGMENTS.has(first) && second) {
    if (second === 'buy' || second === 'rent' || second === 'projects' || second === 'news') {
      return second
    }
  }

  if (first === 'buy' || first === 'rent' || first === 'projects' || first === 'news' || first === 'contact-us') {
    return first
  }

  // Location landing page, e.g. /cebu
  if (!STATIC_ROOT_SEGMENTS.has(first) && segments.length === 1) {
    return 'home'
  }

  // For non-nav routes (e.g. /developers/slug), keep navbar unhighlighted.
  return null
}

export default function SiteHeader({
  logoText = 'HomesPH',
  logoUrl,
  contactEmail,
  contactPhone,
  socialLinks,
  navItems,
}: {
  logoText?: string
  logoUrl?: string
  contactEmail?: string
  contactPhone?: string
  socialLinks?: SocialLinks | string
  navItems?: GeneralNavItem[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const pathname = usePathname()
  const { selectedLocation, clearSelectedLocation } = useSelectedLocation()
  const locationContext = selectedLocation ?? getLocationContextFromPath(pathname)
  const locationSlug = normalizeLocationSlug(locationContext)
  const contextHref = (segment: 'buy' | 'rent' | 'projects') =>
    locationSlug ? `/${locationSlug}/${segment}` : `/${segment}`
  const activeSection = getNavSectionFromPath(pathname)
  const logoHref = '/'
  const resolvedNavItems: GeneralNavItem[] = navItems ?? [
    { label: 'Home', href: buildContextHomeHref(locationContext) },
    { label: 'Buy', href: contextHref('buy') },
    { label: 'Rent', href: contextHref('rent') },
    { label: 'Projects', href: contextHref('projects') },
    { label: 'News', href: buildNewsHref(locationContext) },
    { label: 'Contact Us', href: '/contact-us' },
  ]

  const handleLogoClick = () => {
    clearSelectedLocation()
  }

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  let socials: SocialLinks = {}
  if (socialLinks) {
    if (typeof socialLinks === 'string') {
      try { socials = JSON.parse(socialLinks) } catch { socials = {} }
    } else {
      socials = socialLinks
    }
  }

  return (
    <div className="w-full" suppressHydrationWarning>
      {/* ── Top contact bar — Buy header style ── */}
      <div className="bg-[#1428AE] relative z-[1000]">
          <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 2xl:pl-[227px] 2xl:pr-[227px] flex items-center justify-between h-10">
            <div className="flex items-center gap-5">
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="flex items-center gap-1.5 text-xs text-white/85 hover:text-white transition-colors">
                  <PhoneSolid size={12} className="shrink-0" />
                  <span>{contactPhone}</span>
                </a>
              )}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="hidden sm:flex items-center gap-1.5 text-xs text-white/85 hover:text-white transition-colors">
                  <MailSolid size={12} className="shrink-0" />
                  <span>{contactEmail}</span>
                </a>
              )}
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/85">
                <MapPin size={12} className="shrink-0" />
                <span>Manila, Philippines</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-white/85 hover:text-white transition-colors">
                  <Image src="/socialIcons/fb.png" alt="Facebook" width={14} height={14} />
                </a>
              )}
              <a href={socials.twitter || '#'} target={socials.twitter ? '_blank' : undefined} rel={socials.twitter ? 'noreferrer' : undefined} aria-label="X / Twitter" className="text-white/85 hover:text-white transition-colors">
                <Image src="/socialIcons/X.png" alt="X / Twitter" width={14} height={14} />
              </a>
              <Suspense fallback={<div style={{ width: 101, height: 25 }} aria-hidden /> }>
                <LocationSwitcher variant="pill" />
              </Suspense>
            </div>
          </div>
        </div>

      {/* ── Main header ── */}
      <header className={`sticky top-0 z-40 bg-white transition-all duration-200 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}>
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-12 xl:px-24 2xl:pl-[290px] 2xl:pr-[290px]">
          <div className="flex items-center h-[110px] relative">

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href={logoHref} className="shrink-0 group block" onClick={handleLogoClick}>
                {logoUrl ? (
                  <img src={logoUrl} alt={logoText} style={{ width: '179px', height: '50px' }} className="drop-shadow-sm transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900 drop-shadow-sm">{logoText}</span>
                )}
              </Link>
            </div>

            {/* Desktop nav — flex mapping to match Buy page */}
            <div style={{
              position: 'absolute',
              width: '469px',
              height: '20px',
              left: 'calc(50% - 469px / 2 - 0.5px)',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '40px',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'auto'
            }}>
              {(resolvedNavItems || []).map((item) => {
                const normalizedLabel = item.label.toLowerCase().replace(/\s+/g, '-')
                const sectionByLabel =
                  normalizedLabel === 'home' ? 'home'
                    : normalizedLabel === 'buy' ? 'buy'
                      : normalizedLabel === 'rent' ? 'rent'
                        : normalizedLabel === 'projects' ? 'projects'
                          : normalizedLabel === 'news' ? 'news'
                            : normalizedLabel === 'contact-us' ? 'contact-us'
                              : null
                const isActive = sectionByLabel ? sectionByLabel === activeSection : false
                const bgWidth = item.label === 'Contact Us' ? '120px' : (item.label === 'Projects' ? '90px' : '63px')

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="nav-link-item nav-link-hover"
                    style={{
                      position: 'relative',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Outfit'",
                      fontSize: '18px',
                      fontWeight: 400,
                      color: '#002143',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        zIndex: -1,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: bgWidth,
                        height: '36px',
                        backgroundColor: '#FDF8EF',
                        borderRadius: '8px'
                      }} />
                    )}
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Auth Buttons */}
            <div className="ml-auto hidden md:flex items-center gap-[16px]">
              <Link href="/login" style={{ fontSize: '18px', fontWeight: 400, color: '#002143', textDecoration: 'none' }}>
                Login
              </Link>
              <button
                onClick={() => setShowRegisterModal(true)}
                style={{
                  width: '103px',
                  height: '46px',
                  background: '#1428AE',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 500, color: '#FFFFFF' }}>Sign in</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="lg:hidden ml-auto p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu size={24} />
            </button>

          </div>
        </div>
      </header>

      {/* ── Mobile sidebar ── */}
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-gray-100 shrink-0">
          <Link href={logoHref} onClick={() => { setOpen(false); handleLogoClick() }} className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-9 w-auto" />
            ) : (
              <span className="text-lg font-semibold text-gray-900">{logoText}</span>
            )}
          </Link>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {resolvedNavItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0]
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => {
                  setOpen(false)
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-[#1428ae]/5 hover:text-[#1428ae]'
                  }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Contact info */}
        {(contactPhone || contactEmail) && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Contact</p>
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#1428ae] transition-colors">
                <span className="w-7 h-7 rounded-lg bg-[#1428ae]/8 flex items-center justify-center shrink-0">
                  <PhoneSolid size={13} className="text-[#1428ae]" />
                </span>
                {contactPhone}
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#1428ae] transition-colors">
                <span className="w-7 h-7 rounded-lg bg-[#1428ae]/8 flex items-center justify-center shrink-0">
                  <MailSolid size={13} className="text-[#1428ae]" />
                </span>
                <span className="truncate">{contactEmail}</span>
              </a>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-7 h-7 rounded-lg bg-[#1428ae]/8 flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-[#1428ae]" />
              </span>
              Cebu City, Philippines
            </div>
          </div>
        )}

        {/* Social links */}
        {(socials.facebook || socials.instagram || true) && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                className="w-8 h-8 rounded-md bg-[#1428ae] text-white hover:bg-amber-500 transition-colors flex items-center justify-center">
                <Image src="/socialIcons/fb.png" alt="Facebook" width={14} height={14} />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="w-8 h-8 rounded-md bg-[#1428ae] text-white hover:bg-amber-500 transition-colors flex items-center justify-center">
                <Image src="/socialIcons/insta.png" alt="Instagram" width={14} height={14} />
              </a>
            )}
            <a href={socials.twitter || '#'} target={socials.twitter ? '_blank' : undefined} rel={socials.twitter ? 'noreferrer' : undefined} aria-label="X / Twitter"
              className="w-8 h-8 rounded-md bg-[#1428ae] text-white hover:bg-amber-500 transition-colors flex items-center justify-center">
              <Image src="/socialIcons/X.png" alt="X / Twitter" width={14} height={14} />
            </a>
          </div>
        )}

        {/* Auth buttons */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 text-center text-sm font-semibold text-[#1428ae] border border-[#1428ae]/30 rounded-lg hover:bg-[#1428ae]/5 transition-colors"
          >
            Login
          </Link>
          <button
            onClick={() => { setOpen(false); setShowRegisterModal(true) }}
            className="flex-1 py-2.5 text-center text-sm font-semibold text-white bg-[#1428ae] rounded-lg hover:bg-amber-500 transition-colors"
          >
            Register
          </button>
        </div>
      </aside>
      <RegisterModal open={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  )
}
 
