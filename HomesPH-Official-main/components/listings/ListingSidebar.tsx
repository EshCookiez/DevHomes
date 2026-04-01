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
}

async function fetchLatestNews(): Promise<NewsItem[]> {
  try {
    const result = await getArticles({ per_page: 5 })
    return result.data.data.slice(0, 5).map(a => ({
      title: a.title,
      imageUrl: a.image || '',
      href: `/news/${a.slug}`,
    }))
  } catch {
    return []
  }
}

export default async function ListingSidebar({ absolute, top = 320, left = 1272, style }: ListingSidebarProps) {
  const news = await fetchLatestNews()

  const sidebarContent = (
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
