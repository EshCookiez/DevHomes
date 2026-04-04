import Link from 'next/link'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
import ListingMapView from './ListingMapView'
import SearchFilter from '@/components/projects/SearchFilter'
import {
  type ListingSearchMode,
  type PropertySearchParamsInput,
  searchPublicListings,
} from '@/lib/property-search'
import { getSiteSettings } from '@/lib/site-settings'
import {
  MapPin,
  ChevronDown,
  Search as SearchIcon,
  Settings2,
  Heart,
  Share,
  Share2,
  LayoutList,
  Bell,
  Bed,
  Bath,
  Maximize,
  User,
  Map as MapIcon,
  List,
  Star,
  Check,
  ChevronRight,
  PhilippinePeso,
  Files
} from 'lucide-react'
import BuySearchBar from './BuySearchBar'
import FilterDropdown from './FilterDropdown'
import PropertyTypeFilter from './PropertyTypeFilter'
import BedsBathsFilter from './BedsBathsFilter'
import MoreFilters from './MoreFilters'
import PropertyHeader from './PropertyHeader'
import UnifiedListingCard from './UnifiedListingCard'
import ListingSidebar from './ListingSidebar'
import type { RentPHProperty } from './RentPHListingsGrid'
import { normalizeLocationSlug, toListingSlug } from '@/lib/url-slugs'

interface PublicListingsPageProps {
  mode: ListingSearchMode
  searchParams: PropertySearchParamsInput
  rentPHListings?: RentPHProperty[]
  rentPHTotal?: number
  rentPHPage?: number
  rentPHLastPage?: number
}

function formatPrice(value: number | null) {
  if (value === null || value === undefined) {
    return '0'
  }
  return Number(value).toLocaleString()
}

export default async function PublicListingsPage({
  mode,
  searchParams,
  rentPHListings,
  rentPHTotal = 0,
  rentPHPage = 1,
  rentPHLastPage = 1,
}: PublicListingsPageProps) {
  const settings = await getSiteSettings()
  const { listings, propertyTypeChips, selectedProject } = await searchPublicListings(
    mode,
    searchParams
  )

  const isSale = mode === 'sale'
  const selectedLocationSlug = normalizeLocationSlug(
    typeof searchParams.location === 'string' ? searchParams.location : undefined
  )
  const modePath = isSale ? 'buy' : 'rent'

  // Normalise searchParams to Record<string, string | undefined> for map view
  const viewParam = typeof searchParams.view === 'string'
    ? searchParams.view
    : Array.isArray(searchParams.view)
      ? searchParams.view[0]
      : undefined

  if (viewParam === 'map') {
    const normalizedSearchParams: Record<string, string | undefined> = {}
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') normalizedSearchParams[key] = value
      else if (Array.isArray(value) && value.length > 0) normalizedSearchParams[key] = value[0]
    }
    return (
      <>
        <div style={{ position: 'relative', zIndex: 50 }}>
          <SiteHeader
            logoUrl={settings.logoUrl}
            contactEmail={settings.contactEmail}
            contactPhone={settings.contactPhone}
            socialLinks={settings.socialLinks}
          />
        </div>
        <ListingMapView listings={listings} mode={mode} searchParams={normalizedSearchParams} />
        <SiteFooter
          logoUrl={settings.logoUrl}
          contactEmail={settings.contactEmail}
          contactPhone={settings.contactPhone}
          socialLinks={settings.socialLinks}
          brandName={settings.siteTitle}
        />
      </>
    )
  }

  return (
    <>
    <div style={{ position: 'relative', zIndex: 50 }}>
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />
    </div>
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '3239px',
      background: '#FFFFFF',
      fontFamily: "'Outfit', sans-serif",
      overflowX: 'hidden',
      marginTop: '-150px'
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .listing-card-interactive {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        .listing-card-interactive:hover {
          transform: translateY(-8px);
          box-shadow: 0px 20px 40px rgba(0, 33, 67, 0.12);
          z-index: 50 !important;
        }
      `}} />

      {/* Footer Wrapper - Center across 100% (Full Width) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        left: '0px',
        bottom: '0px',
        zIndex: 5
      }}>
        <SiteFooter
          logoUrl={settings.logoUrl}
          contactEmail={settings.contactEmail}
          contactPhone={settings.contactPhone}
          socialLinks={settings.socialLinks}
          brandName={settings.siteTitle}
        />
      </div>

      {/* Centered 1920px Content Frame */}
      <div style={{
        position: 'relative',
        width: '1920px',
        margin: '0 auto',
        height: '3239px',
        zIndex: 10,
        pointerEvents: 'none' // Allow clicks to pass to full-width elements if needed
      }}>
        {/* Enable interactions for children */}
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>

          {/* Top Divider (Rectangle 11074) */}
          <div style={{ position: 'absolute', width: '1920px', height: '1px', left: 'calc(50% - 1920px/2)', top: '150px', background: '#D3D3D3' }} />

          <div style={{ position: 'absolute', top: '176px', left: '296px', zIndex: 50, width: '1327px' }}>
            <SearchFilter />
          </div>

          {/* Main Divider (Rectangle 11219) */}
          <div style={{
            position: 'absolute',
            width: '1920px',
            height: '1px',
            left: 'calc(50% - 1920px/2)',
            top: '300.12px',
            background: '#D3D3D3'
          }} />

          {/* Main Content Area */}
          {!selectedProject && (
            <div style={{ position: 'absolute', left: '296px', top: '331.12px', width: '945.99px', height: '186.99px', pointerEvents: 'auto' }}>
              <PropertyHeader
                breadcrumbPrefix={isSale ? 'For Sale:' : 'For Rent:'}
                breadcrumbLinkHref={mode === 'sale' ? '/buy' : '/rent'}
                title={`Properties ${isSale ? 'for sale' : 'for rent'} in Philippines`}
                topLocations={(() => {
                  const cityCounts = (listings || []).reduce((acc: Record<string, number>, listing: any) => {
                    const city = listing.projects?.city_municipality || 'Other'
                    acc[city] = (acc[city] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)

                  return Object.entries(cityCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name, count]) => ({
                      name,
                      count,
                      href: `${mode === 'sale' ? '/buy' : '/rent'}?location=${encodeURIComponent(name)}`
                    }))
                })()}
                viewAllHref={`${mode === 'sale' ? '/buy' : '/rent'}`}
              />
            </div>
          )}

          {/* Project Overview Header Section */}
          {selectedProject && (
            <div style={{ position: 'absolute', width: '1920px', height: '727px', left: '0px', top: '301px', background: 'linear-gradient(180deg, rgba(239, 241, 255, 0.8) 0%, #FFFFFF 100%)', zIndex: 1, pointerEvents: 'auto' }}>
              {/* Rectangle 11219 - Separator above header */}
              <div style={{ position: 'absolute', width: '1920px', height: '1px', left: 'calc(50% - 1920px/2)', top: '-0.88px', background: '#D3D3D3' }} />

              {/* Breadcrumbs Group */}
              <div style={{ position: 'absolute', left: '296px', top: '30.12px', display: 'flex', alignItems: 'center', gap: '0px' }}>
                <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '16px', lineHeight: '16px', color: '#002143', width: '63px', height: '16px', display: 'inline-block' }}>For Sale:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginLeft: '8px' }}>
                  <Link href="/buy" style={{ textDecoration: 'none', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '16px', lineHeight: '16px', color: '#001392', width: '146px', height: '16px', display: 'inline-block' }}>Philippine Properties</Link>
                  <div style={{ position: 'relative', width: '7px', height: '14px', margin: '0 10px', top: '1px' }}>
                    <ChevronRight size={14} color="#002143" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(0deg)' }} />
                  </div>
                  <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '16px', lineHeight: '16px', color: '#001392', width: '97px', height: '16px', display: 'inline-block', cursor: 'pointer' }}>{selectedProject.developer?.developer_name || 'Filipinohomes'}</span>
                  <div style={{ position: 'relative', width: '7px', height: '14px', margin: '0 11px', top: '1px' }}>
                    <ChevronRight size={14} color="#002143" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(0deg)' }} />
                  </div>
                  <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '16px', lineHeight: '16px', color: '#002143', width: '61px', height: '16px', display: 'inline-block' }}>{selectedProject.name}</span>
                </div>
              </div>

              {/* Title - M Tower (377.12px absolute) */}
              <h1 style={{ position: 'absolute', width: '151px', height: '39px', left: '296px', top: '76.12px', margin: 0, fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '40px', lineHeight: '40px', color: '#002143' }}>
                {selectedProject.name}
              </h1>

              {/* Category - Apartments (441.12px absolute) */}
              <span style={{ position: 'absolute', width: '117px', height: '21px', left: '296px', top: '140.12px', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '20px', lineHeight: '20px', color: '#002143' }}>
                {selectedProject.project_type || 'Apartments'}
              </span>

              {/* Metadata Tags (474.12px absolute) */}
              <div style={{ position: 'absolute', width: '66px', height: '25px', left: '296px', top: '173.12px', background: '#1428AE', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '13px', lineHeight: '13px', color: '#FFFFFF', textAlign: 'center', width: '59px', height: '15px' }}>Studio</span>
              </div>
              <div style={{ position: 'absolute', width: '96px', height: '25px', left: '372px', top: '173.12px', background: '#0099C8', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '13px', lineHeight: '13px', color: '#FFFFFF', textAlign: 'center', width: '80px', height: '15px' }}>1 Bathroom</span>
              </div>
              <div style={{ position: 'absolute', width: '117px', height: '25px', left: '478px', top: '173.12px', background: '#00AB89', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '13px', lineHeight: '13px', color: '#FFFFFF', textAlign: 'center', width: '97px', height: '15px' }}>Area: 500 sqft</span>
              </div>
              <div style={{ position: 'absolute', width: '5px', height: '5px', left: '605px', top: '184.12px', background: '#002143', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '97px', height: '15px', left: '614px', top: '179.12px', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '13px', lineHeight: '13px', color: '#002143' }}>
                By {selectedProject.developer?.developer_name || 'Filipinohomes'}
              </div>

              {/* Amenities Stats Box (Rectangle 11185) (518.12px absolute) */}
              <div style={{ boxSizing: 'border-box', position: 'absolute', width: '498px', height: '103px', left: '296px', top: '217.12px', background: '#FFFFFF', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', padding: '12px 32px' }}>
                {/* Amenities Column */}
                <div style={{ position: 'absolute', width: '132px', height: '66px', left: '32px', top: '18px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '15px', lineHeight: '16px', color: '#002143', marginBottom: '17px' }}>Amenities</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'min-content min-content', gap: '12px', columnGap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={10} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '10px', lineHeight: '8px', color: '#002143', whiteSpace: 'nowrap' }}>Air Condition</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={10} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '10px', lineHeight: '8px', color: '#002143', whiteSpace: 'nowrap' }}>Kitchen</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={10} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '10px', lineHeight: '8px', color: '#002143', whiteSpace: 'nowrap' }}>Wi-Fi Internet</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={10} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '10px', lineHeight: '8px', color: '#002143', whiteSpace: 'nowrap' }}>Pool</span>
                    </div>
                  </div>
                </div>

                {/* Separator 1 (Rectangle 11186) */}
                <div style={{ position: 'absolute', width: '1px', height: '79px', left: '203px', top: '12px', background: '#D9D9D9' }} />

                {/* Furnishing Column */}
                <div style={{ position: 'absolute', width: '80px', height: '43px', left: '234px', top: '18px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '15px', lineHeight: '16px', color: '#002143', marginBottom: '17px' }}>Furnishing</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={10} color="#1428AE" />
                    <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '10px', lineHeight: '8px', color: '#002143', whiteSpace: 'nowrap' }}>Fully Furnished</span>
                  </div>
                </div>

                {/* Separator 2 (Rectangle 11187) */}
                <div style={{ position: 'absolute', width: '1px', height: '79px', left: '344px', top: '12px', background: '#D9D9D9' }} />

                {/* Rating Column */}
                <div style={{ position: 'absolute', width: '90px', height: '47px', left: '375px', top: '18px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '15px', lineHeight: '16px', color: '#002143', marginBottom: '15px' }}>Rating</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Star size={15} color="#1428AE" fill="#1428AE" />
                    <Star size={15} color="#1428AE" fill="#1428AE" />
                    <Star size={15} color="#1428AE" fill="#1428AE" />
                    <Star size={15} color="#DFE3FF" fill="#DFE3FF" />
                    <Star size={15} color="#DFE3FF" fill="#DFE3FF" />
                  </div>
                </div>
              </div>

              {/* Description Area (631.12px absolute) */}
              <div style={{ position: 'absolute', width: '568px', height: '99px', left: '296px', top: '330.12px' }}>
                <p style={{ margin: 0, fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 300, fontSize: '15px', lineHeight: '25px', color: '#002143' }}>
                  {selectedProject.description || (selectedProject.name + ' presents a contemporary residential development in the heart of Makati City, Philippines, offering thoughtfully designed apartments suited for modern urban living. Rising elegantly within the city skyline, the building features clean architectural lines, private balconies, and expansive windows that invite natural light and city views.')}
                </p>
              </div>

              {/* Read more (745.12px absolute) */}
              <div style={{ position: 'absolute', width: '73px', height: '17px', left: '296px', top: '444.12px', cursor: 'pointer' }}>
                <span style={{ fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 500, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>Read more</span>
              </div>

              {/* Interactive Unit/Plan Blocks */}
              <div style={{ position: 'absolute', width: '1440px', height: '1px', left: '240px', top: '586.12px', background: '#D3D3D3' }} />

              <div style={{ boxSizing: 'border-box', position: 'absolute', width: '427px', height: '65px', left: '296px', top: '491.12px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }}>
                {/* Group 481898 - Payment Plan Peso Icon */}
                <div style={{ position: 'absolute', width: '29.99px', height: '20.99px', left: '26px', top: '23px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: '#DFE3FF', border: '2px solid #1428AE', borderRadius: '2px' }} />
                  <PhilippinePeso size={12} color="#1428AE" style={{ position: 'absolute', left: '55%', top: '55%', transform: 'translate(-50%, -50%)' }} />
                </div>
                <span style={{ position: 'absolute', width: '135px', height: '22px', left: '82.4px', top: '22px', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '22px', lineHeight: '22px', color: '#002143' }}>Payment Plan</span>
                <div style={{ position: 'absolute', width: '14px', height: '28px', left: '386px', top: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#D2D2D2" />
                </div>
              </div>

              <div style={{ boxSizing: 'border-box', position: 'absolute', width: '426px', height: '65px', left: '747px', top: '491.12px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }}>
                {/* unit icon - group 481902 */}
                <div style={{ position: 'absolute', width: '32.79px', height: '23.85px', left: '24.64px', top: '23px' }}>
                  <div style={{ position: 'absolute', width: '32.79px', height: '23.85px', left: 0, top: 0, background: '#DFE3FF', border: '3px solid #1428AE', borderRadius: '1px' }} />
                  <div style={{ position: 'absolute', width: '5px', height: '3px', left: '20.36px', top: '13px', background: '#1428AE', transform: 'rotate(180deg)', borderRadius: '0px 5px 5px 0' }} />
                  <div style={{ position: 'absolute', width: '9px', height: '3px', left: '24.36px', top: '7px', background: '#1428AE', transform: 'rotate(90deg)', borderRadius: '0px 2px 0 0' }} />
                  <div style={{ position: 'absolute', width: '5px', height: '3px', left: '13.36px', top: '18px', background: '#1428AE', transform: 'rotate(-90deg)', borderRadius: '0px 5px 5px 0' }} />
                  <div style={{ position: 'absolute', width: '7px', height: '3px', left: '13.36px', top: '8px', background: '#1428AE', transform: 'rotate(90deg)', borderRadius: '0px 5px 5px 0' }} />
                  <div style={{ position: 'absolute', width: '6px', height: '3px', left: '0px', top: '5px', background: '#1428AE', borderRadius: '0px 5px 5px 0' }} />
                  <div style={{ position: 'absolute', width: '23px', height: '3px', left: '9.36px', top: '5px', background: '#1428AE', borderRadius: '5px 0 0 5px' }} />
                </div>
                <span style={{ position: 'absolute', width: '101px', height: '22px', left: '83.59px', top: '22px', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '22px', lineHeight: '22px', color: '#002143' }}>Unit Types</span>
                <div style={{ position: 'absolute', width: '14px', height: '28px', left: '387.19px', top: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#D2D2D2" />
                </div>
              </div>

              <div style={{ boxSizing: 'border-box', position: 'absolute', width: '427px', height: '65px', left: '1196px', top: '491.12px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }}>
                {/* About icon - document stack */}
                <div style={{ position: 'absolute', width: '42px', height: '42px', left: '24px', top: '12px' }}>
                  <div style={{ position: 'absolute', left: '26.19%', right: '16.67%', top: '11.9%', bottom: '21.43%', background: '#DFE3FF', border: '2.28571px solid #1428AE', borderRadius: '2px' }} />
                  <div style={{ position: 'absolute', left: '9.45%', right: '30.95%', top: '23.5%', bottom: '9.81%', border: '2.28571px solid #1428AE', borderRadius: '2px' }} />
                </div>
                <span style={{ position: 'absolute', width: '135px', height: '22px', left: '86px', top: '22px', fontFamily: "'Outfit'", fontStyle: 'normal', fontWeight: 400, fontSize: '22px', lineHeight: '22px', color: '#002143' }}>About Project</span>
                <div style={{ position: 'absolute', width: '14px', height: '28px', left: '389.6px', top: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} color="#D2D2D2" />
                </div>
              </div>

              {/* Gallery Images (347.12px & 562.12px absolute) */}
              <div style={{ position: 'absolute', left: '930px', top: '46.12px', width: '334px', height: '415px', background: '#D9D9D9', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={selectedProject.gallery[0]?.image_url || selectedProject.main_image_url || 'https://via.placeholder.com/334x415'} alt="Project Feature" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', left: '1280px', top: '46.12px', width: '343px', height: '200px', background: '#D9D9D9', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={selectedProject.gallery[1]?.image_url || 'https://via.placeholder.com/343x200'} alt="Project secondary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', left: '1280px', top: '261.12px', width: '343px', height: '200px', background: '#D9D9D9', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={selectedProject.gallery[2]?.image_url || 'https://via.placeholder.com/343x200'} alt="Project tertiary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}

          {/* Listing Results Header and Sub-Projects Bar */}
          {selectedProject && (
            <>
              <div style={{ position: 'absolute', width: '941px', height: '45px', left: '296px', top: '918.12px', display: 'flex', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '35px', color: '#002143', margin: 0 }}>Properties for sale {selectedProject.name}</h3>

                {/* Sort/Filter Bar (Group 481910) */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                  <div style={{ boxSizing: 'border-box', width: '149px', height: '45px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '10px', cursor: 'pointer' }}>
                    <List size={20} color="#002143" />
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '18px', color: '#002143' }}>Popular</span>
                    <ChevronDown size={20} color="#002143" />
                  </div>

                  <div style={{ boxSizing: 'border-box', width: '226px', height: '45px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 3px' }}>
                    <div style={{ width: '105px', height: '39px', background: '#DFE3FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                      <LayoutList size={20} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '18px', color: '#1428AE' }}>List</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                      <MapPin size={20} color="#8187B0" />
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '18px', color: '#8187B0' }}>Map</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Projects / Phases Navigation Bar (Rectangle 11193) */}
              <div style={{ boxSizing: 'border-box', position: 'absolute', width: '941px', height: '65px', left: '296px', top: '993.12px', border: '1px solid #D3D3D3', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 30px', gap: '40px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '22px', color: '#1428AE' }}>{selectedProject.name} 101</span>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '22px', color: '#002143' }}>(8)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '22px', color: '#1428AE' }}>{selectedProject.name} 102</span>
                  <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '22px', color: '#002143' }}>(5)</span>
                </div>
              </div>

              {/* Sidebar Contact Us Box */}
              <div style={{ position: 'absolute', width: '343px', height: '235px', left: '1280px', top: '918.12px', background: '#FFFFFF', border: '1px solid #D3D3D3', borderRadius: '10px', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h4 style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '22px', color: '#002143', margin: '30px 0 15px 0' }}>Contact Us</h4>
                <p style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '18px', color: '#002143', margin: 0 }}>
                  Submit your interest or inquiry for {selectedProject.name}.
                </p>
              </div>
            </>
          )}

          {/* Listing Slots */}
          {(listings || []).slice(0, 6).map((listing, index) => {
            const defaultTops = [548.27, 886.05, 1223.83, 1561.62, 1899.4, 2237.18]
            const projectTops = [1120.12, 1456.12, 1792.12, 2128.12, 2464.12, 2800.12]
            const top = selectedProject ? projectTops[index] : defaultTops[index]
            const image = listing.property_listing_galleries[0]?.image_url || listing.projects?.main_image_url
            const hasFranchiseBadge = index === 2 || index === 4 || index === 5

            const tags = [
              listing.title,
              listing.project_amenities?.[0],
              listing.projects?.project_type,
            ].filter(Boolean) as string[]

            return (
              <UnifiedListingCard
                key={listing.id}
                variant="buy-rent"
                href={selectedLocationSlug
                  ? `/${selectedLocationSlug}/${modePath}/${toListingSlug(listing.title, listing.id)}`
                  : `/listings/${listing.id}`}
                imageUrl={image || 'https://via.placeholder.com/460x314'}
                developerLogoUrl={listing.developers_profiles?.logo_url}
                developerName={listing.developers_profiles?.developer_name}
                location={`${listing.projects?.city_municipality}, ${listing.projects?.province}, Philippines`}
                price={listing.price}
                propertyType={listing.projects?.project_type}
                bedrooms={listing.project_units?.bedrooms}
                bathrooms={listing.project_units?.bathrooms}
                areaSqm={listing.project_units?.floor_area_sqm}
                listingTitle={listing.title}
                tags={tags}
                brokerBadge={hasFranchiseBadge ? { label: 'TopFranchise', profileImageUrl: listing.user_profiles?.profile_image_url } : undefined}
                style={{ position: 'absolute', left: '296px', top: `${top}px` }}
                className="listing-card-interactive"
              />
            )
          })}

          {/* Sidebar */}
          <ListingSidebar absolute top={320} left={1273} />

        </div>
      </div>
    </div>
    </>
  )
}

