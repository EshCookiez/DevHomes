import Link from 'next/link'
import Image from 'next/image'
/* ── Solid / filled icon helpers identical to top bar ── */
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
    <footer className="bg-[#002143] text-slate-100 border-t border-[#25406E]">
      <div className="mx-auto w-full max-w-[1345px] px-4 pt-[68px] pb-[40px] sm:px-6 md:px-[287px] lg:px-0">
        {/* Main flex row matching sample.html tabular format */}
        <div className="flex flex-col lg:flex-row lg:gap-[117px] border-b border-[#25406E] pb-[40px]">

          {/* Col 1: Brand (left 444px block) */}
          <div className="w-full lg:w-[444px] shrink-0">
            <img src={resolvedLogoUrl} alt="HomesPH" className="h-[68px] w-auto object-contain" />
            <div className="pl-[8px]">
              <p className="font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[28px] text-[#FFFFFF]">
                Your trusted partner in finding the perfect home. Connecting Filipinos with quality properties nationwide.
              </p>
            </div>
            <div className="mt-[25px] flex items-center gap-[15px] pl-[7px]">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex items-center justify-center transition-opacity hover:opacity-80"
              >
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded bg-transparent">
                  <Image src="/socialIcons/fb.png" alt="Facebook" width={32} height={32} />
                </div>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center transition-opacity hover:opacity-80"
              >
                <div className="flex h-[28px] w-[28px] items-center justify-center rounded bg-transparent">
                  <Image src="/socialIcons/insta.png" alt="Instagram" width={28} height={28} />
                </div>
              </a>
              <a
                href="#"
                aria-label="X / Twitter"
                className="flex items-center justify-center transition-opacity hover:opacity-80"
              >
                <div className="flex h-[24px] w-[25px] items-center justify-center rounded bg-transparent">
                  <Image src="/socialIcons/X.png" alt="X" width={25} height={24} />
                </div>
              </a>
            </div>
          </div>

          {/* Col 2: Contact Us */}
          <div className="mt-[12px] flex w-full flex-col pl-[8px]">
            <div className="flex w-full flex-col lg:max-w-[1073px]">
              <h4 className="font-[family-name:var(--font-outfit)] text-[22px] font-bold leading-[22px] text-[#FFFFFF]">
                Contact Us
              </h4>
              <div className="mt-[24px] flex flex-col items-start gap-8 sm:flex-row sm:gap-0">
                {/* Phone item */}
                <a href={`tel:${contactPhone}`} className="group flex items-center pr-[1px] whitespace-nowrap">
                  <PhoneSolid size={30} className="shrink-0 text-white" />
                  <div className="flex flex-col w-[208px] pl-[8px] gap-[2.5px]">
                    <span className="font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[18px] text-[#FFFFFF] transition-opacity group-hover:opacity-80">
                      {contactPhone}
                    </span>
                    <span className="font-[family-name:var(--font-outfit)] text-[12px] font-light leading-[12px] text-[#FFFFFF]">
                      Mon-Sat 9AM-6PM
                    </span>
                  </div>
                </a>

                {/* Email item */}
                <a href={`mailto:${contactEmail}`} className="group flex items-center pr-[1px] whitespace-nowrap">
                  <MailSolid size={30} className="shrink-0 text-white" />
                  <div className="flex flex-col w-[184px] pl-[8px] gap-[2.5px]">
                    <span className="font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[18px] text-[#FFFFFF] transition-opacity group-hover:opacity-80">
                      {contactEmail}
                    </span>
                    <span className="font-[family-name:var(--font-outfit)] text-[12px] font-light leading-[12px] text-[#FFFFFF]">
                      We reply within 24hrs
                    </span>
                  </div>
                </a>

                {/* Location item */}
                <div className="flex items-center pr-[1px] whitespace-nowrap">
                  <MapPinSolid size={30} className="shrink-0 text-white" />
                  <div className="flex flex-col w-[563px] pl-[8px] gap-[2.5px]">
                    <span className="font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[18px] text-[#FFFFFF]">
                      Manila, Philippines
                    </span>
                    <span className="font-[family-name:var(--font-outfit)] text-[12px] font-light leading-[12px] text-[#FFFFFF]">
                      Serving nationwide
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-[40px] flex flex-col items-start justify-between gap-4 md:flex-row md:items-center font-[family-name:var(--font-outfit)] text-[15px] font-light leading-[15px] text-[#DDDDDD] lg:px-[1px]">
          <div className="flex flex-col gap-[7.5px] max-w-[1028px]">
            <span>© {year} Homes.ph. All rights reserved. Your dream home awaits.</span>
            <span>Powered by passion and innovation</span>
          </div>
          <div className="flex items-center gap-[24px]">
            <Link href="/privacy-policy" className="transition-opacity hover:opacity-80 focus:outline-none">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="transition-opacity hover:opacity-80 focus:outline-none">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="transition-opacity hover:opacity-80 focus:outline-none">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
