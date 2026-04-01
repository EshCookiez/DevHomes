'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Menu,
  Search,
  X,
} from 'lucide-react'
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

const MapPinSolid = ({ size = 12, className = '' }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className}>
    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.827 3.024ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
  </svg>
)

interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  [key: string]: string | undefined
}

interface HomeHeaderNavItem {
  label: string
  href: string
}

interface HomeHeaderProps {
  contactEmail?: string
  contactPhone?: string
  socialLinks?: SocialLinks | string
  logoUrl?: string
  navItems?: HomeHeaderNavItem[]
  topBarLocationLabel?: string
}

// Home-specific nav: show company/link actions rather than global site nav
const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'Our Company', href: '/our-company' },
  { label: 'Mortgage', href: '/mortgage' },
  { label: 'Legal', href: '/legal' },
  { label: 'Tourism', href: '/tourism' },
  { label: 'Restaurant', href: '/restaurant' },
]

const LANDING_TOP_BAR_SHELL =
  'mx-auto flex w-full max-w-[1466px] items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10 min-[1466px]:px-0'

const LANDING_MAIN_SHELL =
  'mx-auto flex w-full max-w-[1346px] items-center px-4 sm:px-6 md:px-8 lg:px-10 min-[1346px]:px-0'

export default function HomeHeader({
  contactEmail,
  contactPhone,
  socialLinks,
  logoUrl,
  navItems = NAV_ITEMS,
  topBarLocationLabel,
}: HomeHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isLandingVariant = Boolean(topBarLocationLabel)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  let socials: SocialLinks = {}
  if (socialLinks) {
    if (typeof socialLinks === 'string') {
      try {
        socials = JSON.parse(socialLinks)
      } catch {
        socials = {}
      }
    } else {
      socials = socialLinks
    }
  }

  const showTopBar = Boolean(
    contactPhone ||
      contactEmail ||
      topBarLocationLabel ||
      socials.facebook ||
      socials.instagram ||
      socials.twitter,
  )

  const desktopNavClass = isLandingVariant
    ? 'hidden flex-1 items-center justify-end gap-5 md:flex lg:gap-8 xl:gap-9'
    : 'hidden flex-1 items-center justify-center gap-2 md:flex'

  return (
    <div className="w-full">
      {showTopBar && (
        <div className={isLandingVariant ? 'bg-[#1428AE]' : 'bg-[#0c1f4a]'}>
          <div
            className={
              isLandingVariant
                ? `${LANDING_TOP_BAR_SHELL} h-[26px]`
                : 'mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-10'
            }
          >
            <div
              className={
                isLandingVariant
                  ? 'flex min-w-0 items-center gap-3 md:gap-4 lg:gap-5'
                  : 'flex min-w-0 items-center gap-5'
              }
            >
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className={
                    isLandingVariant
                      ? 'flex items-center gap-1.5 text-[11px] font-medium text-white/90 transition-colors hover:text-white'
                      : 'flex items-center gap-1.5 text-xs text-blue-100 transition-colors hover:text-white'
                  }
                >
                  <PhoneSolid size={isLandingVariant ? 11 : 12} className="shrink-0" />
                  <span className="truncate">{contactPhone}</span>
                </a>
              )}

              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className={
                    isLandingVariant
                      ? 'hidden items-center gap-1.5 text-[11px] font-medium text-white/90 transition-colors hover:text-white md:flex'
                      : 'hidden items-center gap-1.5 text-xs text-blue-100 transition-colors hover:text-white sm:flex'
                  }
                >
                  <MailSolid size={isLandingVariant ? 11 : 12} className="shrink-0" />
                  <span className="truncate">{contactEmail}</span>
                </a>
              )}

              {topBarLocationLabel && (
                <div className="hidden items-center gap-1.5 text-[11px] font-medium text-white/90 lg:flex">
                  <MapPinSolid size={11} className="shrink-0" />
                  <span className="truncate">{topBarLocationLabel}</span>
                </div>
              )}
            </div>

            <div className={isLandingVariant ? 'flex items-center gap-2 md:gap-3' : 'flex items-center gap-4'}>
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className={
                    isLandingVariant
                      ? 'text-white/90 transition-colors hover:text-white'
                      : 'text-blue-200 transition-colors hover:text-white'
                  }
                >
                  <Image src="/socialIcons/fb.png" alt="Facebook" width={isLandingVariant ? 12 : 14} height={isLandingVariant ? 12 : 14} />
                </a>
              )}

              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className={
                    isLandingVariant
                      ? 'text-white/90 transition-colors hover:text-white'
                      : 'text-blue-200 transition-colors hover:text-white'
                  }
                >
                  <Image src="/socialIcons/insta.png" alt="Instagram" width={isLandingVariant ? 12 : 14} height={isLandingVariant ? 12 : 14} />
                </a>
              )}

              <a
                href={socials.twitter || '#'}
                target={socials.twitter ? '_blank' : undefined}
                rel={socials.twitter ? 'noreferrer' : undefined}
                aria-label="X / Twitter"
                className={
                  isLandingVariant
                    ? 'text-white/90 transition-colors hover:text-white'
                    : 'text-blue-200 transition-colors hover:text-white'
                }
              >
                <Image src="/socialIcons/X.png" alt="X / Twitter" width={isLandingVariant ? 12 : 14} height={isLandingVariant ? 12 : 14} />
              </a>
            </div>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 bg-white transition-all duration-200 ${
          scrolled
            ? 'shadow-[0_14px_34px_rgba(15,33,91,0.08)]'
            : 'border-b border-slate-200/80'
        }`}
      >
        <div className={isLandingVariant ? LANDING_MAIN_SHELL : 'mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8'}>
          <div
            className={`flex w-full items-center ${
              isLandingVariant ? 'h-[64px] gap-6' : 'h-24 gap-8'
            }`}
          >
            <Link href="/" className="shrink-0 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="HomesPH"
                  className={
                    isLandingVariant
                      ? 'h-8 w-auto object-contain transition-transform group-hover:scale-[1.02] md:h-9 min-[1280px]:-translate-x-[9px]'
                      : 'h-12 w-auto drop-shadow-md transition-transform group-hover:scale-105'
                  }
                />
              ) : (
                <span
                  className={
                    isLandingVariant
                      ? 'text-[28px] font-semibold tracking-[-0.03em] text-[#1428AE]'
                      : 'text-2xl font-bold text-gray-900 drop-shadow-sm'
                  }
                >
                  HomesPH
                </span>
              )}
            </Link>

            <nav className={desktopNavClass}>
              {navItems.map((item) => {
                const isActive = pathname === item.href.split('?')[0]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isLandingVariant
                        ? `text-[14px] font-medium leading-none tracking-[-0.015em] transition-colors ${
                            isActive
                              ? 'text-[#1428AE]'
                              : 'text-[#23345f] hover:text-[#1428AE]'
                          }`
                        : `relative rounded-xl px-4 py-2.5 text-base font-bold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#fff7ed] text-[#0c1f4a]'
                              : 'text-slate-600 hover:bg-[#fff7ed] hover:text-[#0c1f4a]'
                          }`
                    }
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {!isLandingVariant && (
              <div className="hidden items-center gap-6 shrink-0 md:flex">
                <button className="cursor-pointer text-slate-600 transition-colors hover:text-[#0c1f4a]">
                  <Search size={24} />
                </button>
              </div>
            )}

            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className={`ml-auto rounded-lg p-2 transition-colors md:hidden ${
                isLandingVariant
                  ? 'text-[#23345f] hover:bg-[#1428AE]/5'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="HomesPH" className="h-9 w-auto" />
            ) : (
              <span className="text-lg font-semibold text-gray-900">HomesPH</span>
            )}
          </Link>

          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0]

            return (
              <Link
                key={`${item.href}-mobile`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-700 hover:bg-[#1428AE]/5 hover:text-[#1428AE]'
                }`}
              >
                {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {(contactPhone || contactEmail || topBarLocationLabel) && (
          <div className="space-y-3 border-t border-gray-100 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>

            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-[#1428AE]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1428AE]/8">
                  <PhoneSolid size={13} className="text-[#1428AE]" />
                </span>
                {contactPhone}
              </a>
            )}

            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-[#1428AE]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1428AE]/8">
                  <MailSolid size={13} className="text-[#1428AE]" />
                </span>
                <span className="truncate">{contactEmail}</span>
              </a>
            )}

            {topBarLocationLabel && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1428AE]/8">
                  <MapPinSolid size={13} className="text-[#1428AE]" />
                </span>
                <span className="truncate">{topBarLocationLabel}</span>
              </div>
            )}
          </div>
        )}

        {(socials.facebook || socials.instagram || true) && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
            {socials.facebook && (
              <a
                href={socials.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1428AE] text-white transition-colors hover:bg-amber-500"
              >
                <Image src="/socialIcons/fb.png" alt="Facebook" width={14} height={14} />
              </a>
            )}

            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1428AE] text-white transition-colors hover:bg-amber-500"
              >
                <Image src="/socialIcons/insta.png" alt="Instagram" width={14} height={14} />
              </a>
            )}

            <a
              href={socials.twitter || '#'}
              target={socials.twitter ? '_blank' : undefined}
              rel={socials.twitter ? 'noreferrer' : undefined}
              aria-label="X / Twitter"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1428AE] text-white transition-colors hover:bg-amber-500"
            >
              <Image src="/socialIcons/X.png" alt="X / Twitter" width={14} height={14} />
            </a>
          </div>
        )}

        <div className="shrink-0 border-t border-gray-100 px-5 py-4">
          <Link
            href="/list-property"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg bg-[#1428AE] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-amber-500"
          >
            List Property
          </Link>
        </div>
      </aside>
    </div>
  )
}
