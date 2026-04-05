import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getArticles } from '@/lib/hybrid-articles'
import StickyAbsoluteSidebar from '@/components/listings/StickyAbsoluteSidebar'
import LatestUpdatesList from '@/components/news/LatestUpdatesList'

interface NewsItem {
  title: string
  imageUrl: string
  href: string
}

interface ListingSidebarProps {
  /** When true, renders with absolute positioning for the canvas layout (buy/rent). Otherwise, renders inline for flex layout (projects). */
  absolute?: boolean
  /** Top offset for absolute mode */
  top?: number
  /** Left offset for absolute mode */
  left?: number
  style?: React.CSSProperties
  
  /** Sidebar variant to display diff content */
  variant?: 'default' | 'project'
  /** Dynamic context data for project variant */
  projectData?: {
    name: string
    city_municipality: string
  }
}

async function fetchLatestNews(): Promise<NewsItem[]> {
  try {
    const result = await getArticles({ per_page: 5 })
    return result.data.data.slice(0, 5).map(a => ({
      title: a.title,
      imageUrl: a.image || '',
      href: a.city_slug ? `/${a.city_slug}/news/${a.slug}` : `/news/${a.slug}`,
    }))
  } catch {
    return []
  }
}

export default async function ListingSidebar({ absolute, top = 320, left = 1272, style, variant = 'default', projectData }: ListingSidebarProps) {
  const news = await fetchLatestNews()

  const sidebarContent = variant === 'project' && projectData ? (
    <aside className="space-y-8 w-[349px] font-outfit">
      {/* Contact Us Card */}
      <div className="bg-white rounded-[10px] border border-[#D3D3D3] p-6 text-center flex flex-col justify-center shadow-sm w-[349px] h-[208px]">
        <div className="space-y-1 mb-4">
          <h4 className="text-[22px] font-bold text-[#002143]">Contact Us</h4>
          <p className="text-[18px] text-[#002143] font-light">Submit your interest or inquiry for {projectData.name}.</p>
        </div>
        <button className="w-full bg-[#E5FFEB] text-[#008A2E] py-3.5 rounded-[12px] font-regular text-[18px] flex items-center justify-center gap-3 hover:bg-[#D4F7DB] transition-all group">
          <svg width="23" height="23" viewBox="0 0 58 58" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
            <g>
              <path fill="#2CB742" d="M0,58l4.988-14.963C2.457,38.78,1,33.812,1,28.5C1,12.76,13.76,0,29.5,0S58,12.76,58,28.5S45.24,57,29.5,57c-4.789,0-9.299-1.187-13.26-3.273L0,58z" />
              <path fill="#FFFFFF" d="M47.683,37.985c-1.316-2.487-6.169-5.331-6.169-5.331c-1.098-0.626-2.423-0.696-3.049,0.42c0,0-1.577,1.891-1.978,2.163c-1.832,1.241-3.529,1.193-5.242-0.52l-3.981-3.981l-3.981-3.981c-1.713-1.713-1.761-3.41-0.52-5.242c0.272-0.401,2.163-1.978,2.163-1.978c1.116-0.627,1.046-1.951,0.42-3.049c0,0-2.844-4.853-5.331-6.169c-1.058-0.56-2.357-0.364-3.203,0.482l-1.758,1.758c-5.577,5.577-2.831,11.873,2.746,17.45l5.097,5.097l5.097,5.097c5.577,5.577,11.873,8.323,17.45,2.746l1.758-1.758C48.048,40.341,48.243,39.042,47.683,37.985z" />
            </g>
          </svg>
          WhatsApp
        </button>
      </div>

      {/* Property Alert Card */}
      <button className="w-[349px] h-[56px] border-2 border-[#1428AE] text-[#1428AE] rounded-[10px] font-regular text-[16px] uppercase tracking-wider flex items-center justify-center gap-4 transition-all group">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-bounce">
          <path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
        </svg>
        Alert me of new properties
      </button>

      {/* Community Card */}
      <div className="bg-white rounded-[10px] border border-[#D3D3D3] p-4 flex items-center gap-4 group cursor-pointer hover:shadow-sm transition-all w-[349px] h-[129px] overflow-hidden">
        <div className="w-[99px] h-[99px] rounded-[10px] overflow-hidden bg-[#D9D9D9] shrink-0">
          <img
            src={`https://picsum.photos/seed/${projectData.city_municipality}/200/200`}
            alt={projectData.city_municipality}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="text-[20px] font-semibold text-[#002143] leading-tight">{projectData.city_municipality}</h4>
          <p className="text-[18px] font-light text-[#002143] leading-[22px] mt-1">See the community attractions and lifestyle</p>
        </div>
      </div>

      {/* Recommended Links */}
      <div className="w-[349px] space-y-6">
        <div className="space-y-4">
          <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
            <h4 className="text-[18px] font-normal text-[#002143]">Recommended searches</h4>
          </div>
          <div className="px-4 space-y-[15px]">
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">1 Bedroom Properties for rent in {projectData.city_municipality}</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">2 Bedroom Properties for rent in {projectData.city_municipality}</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Apartments for rent in {projectData.city_municipality}</Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
            <h4 className="text-[18px] font-normal text-[#002143]">Near {projectData.name}</h4>
          </div>
          <div className="px-4 space-y-[15px]">
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">De Rosa Residences Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Ters Gardenia Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Pete Heights Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">NC Residences Properties</Link>
            <button className="block text-[15px] font-medium text-[#1428AE] hover:underline transition-all leading-none mt-2">View More</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#F4F4F9] h-[35px] rounded-[5px] flex items-center px-4">
            <h4 className="text-[18px] font-normal text-[#002143]">Other nearby area properties</h4>
          </div>
          <div className="px-4 space-y-[15px]">
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Blue Valley Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Quezon North Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Nest House Properties</Link>
            <Link href="#" className="block text-[15px] font-light text-[#002143] hover:text-[#1428AE] transition-all leading-none">Miltier 101 Propertiesw</Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <iframe src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=300x600" width="300" height="600" frameBorder="0" scrolling="no" style={{ border: 'none', overflow: 'hidden' }}></iframe>
      </div>
    </aside>
  ) : (
    <>
      {/* ═══ AD 1 (Small) — 350×292 ═══ */}
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '350px', height: '292px', background: '#D9D9D9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
          <iframe
            src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=300x250"
            width="300"
            height="250"
            frameBorder="0"
            scrolling="no"
            style={{ border: 'none', overflow: 'hidden', display: 'block', transformOrigin: 'top left', transform: 'scale(1.1667, 1.168)' }}
          />
        </div>
        <span style={{ marginTop: '9px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '18px', color: '#7F7F7F' }}>Advertisement</span>
      </div>

      {/* ═══ Alert Button — 350.85×56.3 ═══ */}
      <div style={{ width: '350.85px', height: '56.3px', marginTop: '22px', boxSizing: 'border-box', border: '1px solid #1428AE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '13px', cursor: 'pointer' }}>
        <Bell size={25.13} color="#1428AE" fill="#1428AE" />
        <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>ALERT ME OF NEW PROPERTIES</span>
      </div>

      {/* ═══ News Sidebar — 351×615.28 ═══ */}
      <LatestUpdatesList news={news} />

      {/* ═══ Recommended Searches — 349.85 wide ═══ */}
      <div style={{ width: '349.85px', marginTop: '30px' }}>
        <div style={{ width: '349.85px', height: '35.19px', background: '#F4F4F9', borderRadius: '5px', display: 'flex', alignItems: 'center', paddingLeft: '16.04px' }}>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#002143' }}>Recommended searches</span>
        </div>
        <div style={{ paddingLeft: '16.04px', display: 'flex', flexDirection: 'column', marginTop: '15.07px' }}>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '15.08px' }}>1 Bedroom Properties for rent in Quezon City</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '15.08px' }}>2 Bedroom Properties for rent in Quezon City</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '20.11px' }}>Apartments for rent in Quezon City</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '15px', lineHeight: '15px', color: '#1428AE', textDecoration: 'none' }}>View More</Link>
        </div>
      </div>

      {/* ═══ Useful Links — 349.85 wide ═══ */}
      <div style={{ width: '349.85px', marginTop: '20px' }}>
        <div style={{ width: '349.85px', height: '35.19px', background: '#F4F4F9', borderRadius: '5px', display: 'flex', alignItems: 'center', paddingLeft: '16.04px' }}>
          <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#002143' }}>Useful Links</span>
        </div>
        <div style={{ paddingLeft: '16.04px', display: 'flex', flexDirection: 'column', marginTop: '15.07px' }}>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '15.08px' }}>Apartments for rent in the Philippines</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '15.08px' }}>Apartment for sale in the Philippines</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none', marginBottom: '15.08px' }}>Hotel Apartment for rent in the Philippines</Link>
          <Link href="#" style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', textDecoration: 'none' }}>Villa Compound for sale in the Philippines</Link>
        </div>
      </div>

      {/* ═══ AD 2 (Large) — 350×701 ═══ */}
      <div style={{ width: '350px', marginTop: '27px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '350px', height: '701px', background: '#D9D9D9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
          <iframe
            src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=300x600"
            width="300"
            height="600"
            frameBorder="0"
            scrolling="no"
            style={{ border: 'none', overflow: 'hidden', display: 'block', transformOrigin: 'top left', transform: 'scale(1.1667, 1.1683)' }}
          />
        </div>
        <span style={{ marginTop: '3.5px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '18px', color: '#7F7F7F' }}>Advertisement</span>
      </div>
    </>
  )

  if (absolute) {
    return (
      <StickyAbsoluteSidebar left={left} initialTop={top} style={{ paddingTop: '32px', paddingBottom: '32px', ...style }}>
        {sidebarContent}
      </StickyAbsoluteSidebar>
    )
  }

  return (
    <div className="hidden lg:flex flex-col" style={{ width: '351px', flexShrink: 0, ...style }}>
      <div style={{ position: 'sticky', top: '20px', paddingTop: '32px', paddingBottom: '32px' }}>
        {sidebarContent}
      </div>
    </div>
  )
}
