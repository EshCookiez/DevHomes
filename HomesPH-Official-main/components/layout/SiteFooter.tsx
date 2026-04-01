import Link from 'next/link'
import {
  SolidFacebookIcon,
  SolidInstagramIcon,
  SolidMailIcon,
  SolidMapPinIcon,
  SolidPhoneIcon,
  SolidXIcon,
} from './FooterIcons'

interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  [key: string]: string | undefined
}

const FOOTER_LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/whiteLogo.png'

const DEFAULT_LINKS = [
  { label: 'Our Company', href: '/our-company' },
  { label: 'News', href: '/news' },
  { label: 'Mortgage', href: '/mortgage' },
  { label: 'Legal', href: '/legal' },
  { label: 'Tourism', href: '/tourism' },
  { label: 'Restaurant', href: '/restaurant' },
]

const RESOURCE_LINKS = [
  { label: 'Event Management', href: '/our-company#event-management' },
  { label: 'Mortgage Calculator', href: '/mortgage' },
  { label: 'Home Buying Guide', href: '/legal' },
  { label: 'FAQs', href: '/mortgage#faq' },
  { label: 'Search Properties', href: '/search' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/registration/broker' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/legal#privacy-policy' },
  { label: 'Terms of Service', href: '/legal#terms-of-service' },
  { label: 'Sitemap', href: '/search' },
]

export default function SiteFooter({
  contactEmail,
  contactPhone,
  links = DEFAULT_LINKS,
  socialLinks,
  brandName = 'HomesPH',
  logoUrl,
  showQuickLinks = true,
}: {
  contactEmail?: string
  contactPhone?: string
  links?: { label: string; href: string }[]
  socialLinks?: SocialLinks | string
  brandName?: string
  logoUrl?: string
  showQuickLinks?: boolean
}) {
  const year = new Date().getFullYear()
  const resolvedLogoUrl = logoUrl?.includes('whiteLogo.png') ? logoUrl : FOOTER_LOGO_URL

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

  return (
    <footer className="bg-[#0a2c4d] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 gap-12 border-b border-white/10 pb-12 sm:grid-cols-2 ${showQuickLinks ? 'lg:grid-cols-[1.55fr_0.8fr_0.95fr_1fr]' : 'lg:grid-cols-[1.55fr_0.95fr_1fr]'} lg:gap-14`}
        >
          <div className="space-y-6 sm:col-span-2 lg:col-span-1">
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt={brandName} className="h-11 w-auto object-contain" />
            ) : (
              <span className="text-[2rem] font-semibold tracking-[-0.04em] text-white">{brandName}</span>
            )}

            <p className="max-w-[320px] text-[15px] leading-[1.65] text-white/88">
              Your trusted partner in finding the perfect home.
              Connecting Filipinos with quality properties nationwide.
            </p>

            <div className="flex items-center gap-4 pt-1 text-white">
              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-8 w-8 items-center justify-center text-white/94 transition-colors hover:text-white"
                >
                  <SolidFacebookIcon className="h-6 w-6" />
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-8 w-8 items-center justify-center text-white/94 transition-colors hover:text-white"
                >
                  <SolidInstagramIcon className="h-6 w-6" />
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter / X"
                  className="inline-flex h-8 min-w-8 items-center justify-center text-[2rem] font-light leading-none text-white/94 transition-colors hover:text-white"
                >
                  <SolidXIcon className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>

          {showQuickLinks ? (
            <div className="space-y-5">
              <h4 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-white">Quick Links</h4>
              <nav className="space-y-3.5">
                {links.map(({ label, href }) => (
                  <Link
                    key={`${href}-${label}`}
                    href={href}
                    className="block text-[15px] text-white/88 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ) : null}

          <div className="space-y-5">
            <h4 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-white">Resources</h4>
            <nav className="space-y-3.5">
              {RESOURCE_LINKS.map(({ label, href }) => (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="block text-[15px] text-white/88 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-5">
            <h4 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-white">Contact Us</h4>
            <div className="space-y-5 text-white/88">
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="flex items-start gap-3.5">
                  <SolidPhoneIcon className="mt-0.5 h-[24px] w-[24px] shrink-0 text-white" />
                  <div>
                    <div className="break-words text-[15px] font-medium text-white">{contactPhone}</div>
                    <div className="text-[12px] text-white/68">Mon-Sat 9AM-6PM</div>
                  </div>
                </a>
              )}

              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-start gap-3.5">
                  <SolidMailIcon className="mt-0.5 h-[24px] w-[24px] shrink-0 text-white" />
                  <div>
                    <div className="break-words text-[15px] font-medium text-white">{contactEmail}</div>
                    <div className="text-[12px] text-white/68">We reply within 24hrs</div>
                  </div>
                </a>
              )}

              <div className="flex items-start gap-3.5">
                <SolidMapPinIcon className="mt-0.5 h-[24px] w-[24px] shrink-0 text-white" />
                <div>
                  <div className="text-[15px] font-medium text-white">Manila, Philippines</div>
                  <div className="text-[12px] text-white/68">Serving nationwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-8 text-[13px] text-white/72 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p>(c) {year} {brandName}. All rights reserved. Your dream home awaits.</p>
            <p>Powered by passion and innovation</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[14px] text-white/78">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="transition-colors hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
