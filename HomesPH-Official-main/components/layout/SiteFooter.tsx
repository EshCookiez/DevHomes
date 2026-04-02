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

const QUICK_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Buy',        href: '/buy' },
  { label: 'Rent',       href: '/rent' },
  { label: 'Projects',   href: '/projects' },
  { label: 'News',       href: '/news' },
  { label: 'Contact Us', href: '/our-company' },
]

const RESOURCE_LINKS = [
  { label: 'Event Management',    href: '/our-company#event-management' },
  { label: 'Mortgage Calculator', href: '/mortgage' },
  { label: 'Home Buying Guide',   href: '/legal' },
  { label: 'FAQs',                href: '/mortgage#faq' },
  { label: 'Search Properties',   href: '/search' },
  { label: 'Login',               href: '/login' },
  { label: 'Register',            href: '/registration/franchise' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy',   href: '/legal#privacy-policy' },
  { label: 'Terms of Service', href: '/legal#terms-of-service' },
  { label: 'Sitemap',          href: '/search' },
]

export default function SiteFooter({
  contactEmail,
  contactPhone,
  links,
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
      try { socials = JSON.parse(socialLinks) } catch { socials = {} }
    } else {
      socials = socialLinks
    }
  }

  return (
    /* Rectangle 11065 — bg:#002143, height:604px */
    <footer className="w-full bg-[#002143] font-outfit text-white">
      {/* Inner content — max 1920px, inset ~292px each side ≈ pl-[292px] on 1920; responsive px */}
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-[80px] xl:px-[160px] 2xl:px-[292px] pt-[80px] pb-0">

        {/* ── 4-column grid ──
            Figma widths (on 1920px, content 292→1619 = 1327px):
            Logo col ~42%, Quick Links ~21%, Resources ~23%, Contact ~14% */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[42fr_21fr_23fr_22fr] lg:gap-0">

          {/* ── Column 1: Logo + Description + Socials ── */}
          <div className="lg:pr-12">
            {/* white homes logo 1 — 244.46×68px */}
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={brandName}
                style={{ width: 244, height: 68, objectFit: 'contain' }}
              />
            ) : (
              <span className="text-[2rem] font-semibold text-white">{brandName}</span>
            )}

            {/* Description — 18px/400, line-height:30px, width:434px, top:2843 = 208px from footer */}
            <p
              className="text-white font-outfit mt-[60px]"
              style={{ fontSize: 18, fontWeight: 400, lineHeight: '30px', maxWidth: 434 }}
            >
              Your trusted partner in finding the perfect home.
              Connecting Filipinos with quality properties nationwide.
            </p>

            {/* Social icons — top:2953 = ~318px from footer top */}
            <div className="flex items-center gap-[18px] mt-[65px]">
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  {/* ic:baseline-facebook — 32×32 */}
                  <SolidFacebookIcon style={{ width: 32, height: 32, color: '#fff' }} />
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  {/* formkit:instagram — 28×28 */}
                  <SolidInstagramIcon style={{ width: 28, height: 28, color: '#fff' }} />
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noreferrer" aria-label="Twitter / X">
                  {/* prime:twitter — 25×24 */}
                  <SolidXIcon style={{ width: 25, height: 24, color: '#fff' }} />
                </a>
              )}
            </div>
          </div>

          {/* ── Column 2: Quick Links — left:848, heading top:2715 (80px from footer) ── */}
          {showQuickLinks && (
            <div>
              {/* "Quick Links" — 22px/700 */}
              <h4 style={{ fontSize: 22, fontWeight: 700, lineHeight: '22px', color: '#FFFFFF' }}>
                Quick Links
              </h4>
              {/* Items spaced 43px apart (18px text + 25px gap) */}
              <nav className="flex flex-col" style={{ marginTop: 35, gap: 25 }}>
                {QUICK_LINKS.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-white hover:text-white/80 transition-colors"
                    style={{ fontSize: 18, fontWeight: 400, lineHeight: '18px' }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* ── Column 3: Resources — left:1129, heading top:2715 ── */}
          <div>
            {/* "Resources" — 22px/700 */}
            <h4 style={{ fontSize: 22, fontWeight: 700, lineHeight: '22px', color: '#FFFFFF' }}>
              Resources
            </h4>
            <nav className="flex flex-col" style={{ marginTop: 35, gap: 25 }}>
              {RESOURCE_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-white hover:text-white/80 transition-colors"
                  style={{ fontSize: 18, fontWeight: 400, lineHeight: '18px' }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Column 4: Contact Us — left:1431/1433, heading top:2715 ── */}
          <div>
            {/* "Contact Us" — 22px/700 */}
            <h4 style={{ fontSize: 22, fontWeight: 700, lineHeight: '22px', color: '#FFFFFF' }}>
              Contact Us
            </h4>

            <div className="flex flex-col" style={{ marginTop: 35, gap: 22 }}>
              {/* Phone — ic:baseline-phone 30×30, text 18px/400, sub 12px/300 */}
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="flex items-start gap-[10px] hover:opacity-80 transition-opacity">
                  <SolidPhoneIcon style={{ width: 30, height: 30, color: '#fff', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 400, lineHeight: '18px', color: '#FFFFFF' }}>{contactPhone}</div>
                    <div style={{ fontSize: 12, fontWeight: 300, lineHeight: '12px', color: '#FFFFFF', marginTop: 8 }}>Mon-Sat 9AM-6PM</div>
                  </div>
                </a>
              )}

              {/* Email — ic:round-email 30×30 */}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-start gap-[10px] hover:opacity-80 transition-opacity">
                  <SolidMailIcon style={{ width: 30, height: 30, color: '#fff', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 400, lineHeight: '18px', color: '#FFFFFF' }}>{contactEmail}</div>
                    <div style={{ fontSize: 12, fontWeight: 300, lineHeight: '12px', color: '#FFFFFF', marginTop: 8 }}>We reply within 24hrs</div>
                  </div>
                </a>
              )}

              {/* Location — ix:location-filled 30×30 */}
              <div className="flex items-start gap-[10px]">
                <SolidMapPinIcon style={{ width: 30, height: 30, color: '#fff', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 400, lineHeight: '18px', color: '#FFFFFF' }}>Manila, Philippines</div>
                  <div style={{ fontSize: 12, fontWeight: 300, lineHeight: '12px', color: '#FFFFFF', marginTop: 8 }}>Serving nationwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider — Rectangle 11074: bg:#25406E, 1440px centered, top:3118 = 483px from footer ── */}
        <div
          className="max-w-[1440px] mx-auto"
          style={{ marginTop: 120, height: 1, background: '#25406E' }}
        />

        {/* ── Bottom bar — top:3157 = 522px from footer, pb to fill 604px ── */}
        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
          style={{ paddingTop: 39, paddingBottom: 39 }}
        >
          {/* Copyright — left:300, 15px/300, #DDDDDD */}
          <div className="flex flex-col gap-[15px]">
            <p style={{ fontSize: 15, fontWeight: 300, lineHeight: '15px', color: '#DDDDDD' }}>
              © {year} Homes.ph. All rights reserved. Your dream home awaits.
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, lineHeight: '15px', color: '#DDDDDD' }}>
              Powered by passion and innovation
            </p>
          </div>

          {/* Legal links — Privacy Policy left:1302, Terms left:1424, Sitemap left:1564; 15px/300, #DDDDDD */}
          <nav className="flex flex-wrap items-center gap-x-[30px] gap-y-2">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:text-white transition-colors"
                style={{ fontSize: 15, fontWeight: 300, lineHeight: '15px', color: '#DDDDDD' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

      </div>
    </footer>
  )
}

