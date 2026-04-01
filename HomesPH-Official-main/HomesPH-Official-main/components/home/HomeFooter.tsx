import Link from 'next/link'
import Image from 'next/image'
import {
  SolidMailIcon,
  SolidMapPinIcon,
  SolidPhoneIcon,
} from '../layout/FooterIcons'

const LOGO = 'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png'
const FOOTER_LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/whiteLogo.png'

export default function HomeFooter({
  contactEmail = 'info@homes.ph',
  contactPhone = '(+63) 977 815 0888',
  logoUrl = LOGO,
}: {
  contactEmail?: string
  contactPhone?: string
  logoUrl?: string
}) {
  const year = new Date().getFullYear()
  const resolvedLogoUrl = logoUrl?.includes('whiteLogo.png') ? logoUrl : FOOTER_LOGO_URL

  return (
    <footer className="bg-[#002143] text-slate-100">
      <div className="mx-auto w-full max-w-[1346px] px-4 pt-16 pb-8 sm:px-6 md:px-8 lg:px-10 min-[1346px]:px-0">

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-[1fr_auto] md:gap-16">

          {/* Col 1: Brand */}
          <div className="space-y-5">
            <img src={resolvedLogoUrl} alt="HomesPH" className="h-10 w-auto object-contain" />
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Your trusted partner in finding the perfect home.
              Connecting Filipinos with quality properties nationwide.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex items-center justify-center"
              >
                <Image src="/socialIcons/fb.png" alt="Facebook" width={24} height={24} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center"
              >
                <Image src="/socialIcons/insta.png" alt="Instagram" width={24} height={24} />
              </a>
              <a
                href="#"
                aria-label="X / Twitter"
                className="flex items-center justify-center"
              >
                <Image src="/socialIcons/X.png" alt="X" width={24} height={24} />
              </a>
            </div>
          </div>

          {/* Col 2: Contact Us */}
          <div className="space-y-6">
            <h4 className="text-[22px] font-bold leading-[22px] text-white font-[family-name:var(--font-outfit)]">Contact Us</h4>
            <div className="flex flex-col gap-5 text-slate-300 sm:flex-row sm:gap-8">
              <a href={`tel:${contactPhone}`} className="flex items-start gap-3 group">
                <SolidPhoneIcon className="mt-1 h-5 w-5 text-white" />
                <div>
                  <div className="font-medium text-white group-hover:text-[#D9991D] transition-colors">{contactPhone}</div>
                  <div className="text-xs text-slate-400">Mon-Sat 9AM-6PM</div>
                </div>
              </a>
              <a href={`mailto:${contactEmail}`} className="flex items-start gap-3 group">
                <SolidMailIcon className="mt-1 h-5 w-5 text-white" />
                <div>
                  <div className="font-medium text-white group-hover:text-[#D9991D] transition-colors">{contactEmail}</div>
                  <div className="text-xs text-slate-400">We reply within 24hrs</div>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <SolidMapPinIcon className="mt-1 h-5 w-5 text-white" />
                <div>
                  <div className="font-medium text-white">Manila, Philippines</div>
                  <div className="text-xs text-slate-400">Serving nationwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span>© {year} Homes.ph. All rights reserved. Your dream home awaits.</span>
            <span>Powered by passion and innovation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
