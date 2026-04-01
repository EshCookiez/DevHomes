import Link from 'next/link'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
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
import type { RentPHProperty } from './RentPHListingsGrid'

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

          {/* Search Bar Section */}
          <BuySearchBar initialValue={(Array.isArray(searchParams.location) ? searchParams.location[0] : searchParams.location) || ''} />

          {/* Filter Dropdowns */}
          <PropertyTypeFilter />
          <BedsBathsFilter />
          <MoreFilters />

          <div style={{ position: 'absolute', left: '1418px', top: '259.12px', fontSize: '16px', fontWeight: 500, color: '#001392' }}>Clear Filters</div>
          <div style={{ position: 'absolute', left: '1535px', top: '259.12px', fontSize: '16px', fontWeight: 500, color: '#001392' }}>Save Search</div>

          {/* Main Divider */}
          <div style={{
            position: 'absolute',
            width: '1920px',
            height: '1px',
            left: '0px',
            top: '300.12px',
            background: '#D3D3D3'
          }} />

          {/* Main Content Area */}
          {!selectedProject && (
            <>
              {/* Page Header - For Sale Breadcrumb */}
              <div style={{ position: 'absolute', left: '296px', top: '331.12px', width: '215px', height: '16.08px', display: 'flex', gap: '5px' }}>
                <span style={{ fontFamily: "'Outfit'", fontSize: '16px', fontWeight: 300, color: '#002143', width: '63.33px', display: 'inline-block' }}>{isSale ? 'For Sale:' : 'For Rent:'}</span>
                <span style={{ fontFamily: "'Outfit'", fontSize: '16px', fontWeight: 300, color: '#002143', width: '146.77px', display: 'inline-block' }}>Philippine Properties</span>
              </div>

              {/* H1 Title */}
              <h1 style={{
                position: 'absolute',
                left: '296px',
                top: '382.4px',
                width: '495.61px',
                height: '35.19px',
                fontFamily: "'Outfit'",
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '35px',
                lineHeight: '35px',
                color: '#002143',
                margin: 0
              }}>Properties {isSale ? 'for sale' : 'for rent'} in Philippines</h1>

              {/* Activity Bar - Popular & List/Map Toggle */}
              <div style={{ position: 'absolute', left: '854.95px', top: '377.37px', width: '387.04px', height: '45.24px', display: 'flex', gap: '10px' }}>
                {/* Popular Dropdown - Group 481910 */}
                <div style={{
                  boxSizing: 'border-box',
                  width: '149.79px',
                  height: '45.24px',
                  border: '1px solid #D3D3D3',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: '6px',
                  cursor: 'pointer',
                  background: '#FFFFFF'
                }}>
                  <LayoutList size={22} color="#002143" />
                  <span style={{ fontFamily: "'Outfit'", fontSize: '18px', fontWeight: 300, color: '#002143', width: '63.33px' }}>Popular</span>
                  <ChevronDown size={22} color="#002143" />
                </div>

                {/* View Mode Toggle - Group 481909 */}
                <div style={{
                  boxSizing: 'border-box',
                  width: '227.2px',
                  height: '45.24px',
                  border: '1px solid #D3D3D3',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  padding: '0 3px',
                  background: '#FFFFFF'
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '105.56px',
                    height: '39.21px',
                    left: '3px',
                    background: '#DFE3FF',
                    borderRadius: '8px'
                  }} />
                  <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-around' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '65px', justifyContent: 'center' }}>
                      <List size={22} color="#1428AE" />
                      <span style={{ fontFamily: "'Outfit'", fontSize: '18px', fontWeight: 500, color: '#1428AE' }}>List</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '75px', justifyContent: 'center' }}>
                      <MapIcon size={20} color="#8187B0" />
                      <span style={{ fontFamily: "'Outfit'", fontSize: '18px', fontWeight: 300, color: '#8187B0' }}>Map</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Stats Bar (Rectangle 11193) */}
              {(() => {
                const cityCounts = (listings || []).reduce((acc: Record<string, number>, listing: any) => {
                  const city = listing.projects?.city_municipality || 'Other'
                  acc[city] = (acc[city] || 0) + 1
                  return acc
                }, {} as Record<string, number>)

                const topCities = Object.entries(cityCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)

                return (
                  <div style={{
                    boxSizing: 'border-box',
                    position: 'absolute',
                    width: '945.99px',
                    height: '65.34px',
                    left: '296px',
                    top: '452.77px',
                    border: '1px solid #D3D3D3',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20.11px',
                    pointerEvents: 'auto'
                  }}>
                    <div style={{
                      display: 'flex',
                      flex: 1,
                      justifyContent: 'space-between',
                      paddingRight: '60px' // gap before VIEW ALL
                    }}>
                      {topCities.slice(0, 3).map(([city, count], idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                          <Link
                            href={`${mode === 'sale' ? '/buy' : '/rent'}?location=${encodeURIComponent(city)}`}
                            style={{
                              fontFamily: "'Outfit'",
                              fontSize: '18px',
                              fontWeight: 300,
                              color: '#1428AE',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {city}
                          </Link>
                          <span style={{
                            fontFamily: "'Outfit'",
                            fontSize: '18px',
                            fontWeight: 300,
                            color: '#002143'
                          }}>
                            ({count.toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      fontFamily: "'Outfit'",
                      fontSize: '18px',
                      fontWeight: 500,
                      color: '#1428AE',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                      VIEW ALL LOCATIONS
                    </div>
                  </div>
                )
              })()}
            </>
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
            // Shift down if project header is active
            const top = selectedProject ? projectTops[index] : defaultTops[index]
            const image = listing.property_listing_galleries[0]?.image_url || listing.projects?.main_image_url

            // Check if this slot should have a broker badge (based on Figma CSS indices 3 and 5)
            const hasFranchiseBadge = index === 2 || index === 4 || index === 5

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="listing-card-interactive"
                style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: '945.99px',
                  height: '317.68px',
                  left: '296px',
                  top: `${top}px`,
                  border: '1px solid #D3D3D3',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  display: 'block'
                }}
              >
                {/* Frame 2147223313 - Image Container */}
                <div style={{
                  position: 'absolute',
                  width: '453.39px', // Frame size
                  height: '295.56px',
                  left: '12px',
                  top: '11px',
                  overflow: 'hidden',
                  borderRadius: '10px',
                  background: '#D9D9D9' // Rectangle 11196 mask
                }}>
                  {/* Actual Image (image 2035) with masking/offset */}
                  <div style={{
                    position: 'absolute',
                    width: '451px',
                    height: '294px',
                    left: '0px',
                    top: '0px',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={image || 'https://via.placeholder.com/460x314'}
                      alt={listing.title}
                      style={{
                        position: 'absolute',
                        width: '460px',
                        height: '314px',
                        left: 'calc(50% - 460px/2 - 0.7px)',
                        top: 'calc(50% - 314px/2 + 0.22px)',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Pagination Dots - Group 481931 - OVER the image */}
                  <div style={{ position: 'absolute', left: '201px', top: '261px', display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ width: '8.04px', height: '8.04px', background: '#FFFFFF', borderRadius: '50%' }} />
                    <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(211, 211, 211, 0.5)', borderRadius: '50%' }} />
                    <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(211, 211, 211, 0.5)', borderRadius: '50%' }} />
                    <div style={{ width: '6.03px', height: '6.03px', background: 'rgba(211, 211, 211, 0.5)', borderRadius: '50%' }} />
                  </div>

                  {/* Icons on Image - Heart and Share */}
                  <div style={{ position: 'absolute', right: '15px', bottom: '15px', display: 'flex', gap: '15px', zIndex: 10 }}>
                    <Heart size={28.15} color="white" fill="none" style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }} />
                    <Share2 size={28.15} color="white" fill="none" style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.3))' }} />
                  </div>

                  {/* Franchise Badge Section - OVER the image bottom-left */}
                  {hasFranchiseBadge && (
                    <div style={{ position: 'absolute', left: '14px', top: '247px', zIndex: 20 }}>
                      <div style={{
                        width: '101.54px',
                        height: '32.17px',
                        left: '20px', // Offset for the profile circle
                        position: 'relative',
                        background: 'linear-gradient(207.12deg, #2D43D8 33.52%, #081148 89.63%)',
                        borderRadius: '0px 10px 10px 0px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '21px'
                      }}>
                        <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#FFFFFF' }}>TopFranchise</span>
                      </div>
                      {/* profile group */}
                      <div style={{
                        position: 'absolute',
                        width: '45.24px',
                        height: '45.24px',
                        left: '-10px',
                        top: '-7px',
                        borderRadius: '50%',
                        background: '#3249E7',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          boxSizing: 'border-box',
                          width: '43.23px',
                          height: '43.23px',
                          background: '#D9D9D9',
                          border: '1px solid #0A124D',
                          borderRadius: '50%',
                          overflow: 'hidden'
                        }}>
                          {listing.user_profiles?.profile_image_url ? (
                            <img
                              src={listing.user_profiles.profile_image_url}
                              alt="Franchise"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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

                {/* Info Area (Right side of image) */}
                <div style={{ position: 'absolute', left: '488px', width: '430px', top: '0px', height: '100%' }}>
                  {/* Project Logo - Top Right */}
                  <div style={{
                    position: 'absolute',
                    width: '95px',
                    height: '61.86px',
                    right: '10px',
                    top: '15px',
                    background: 'transparent',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {listing.developers_profiles?.logo_url ? (
                      <img
                        src={listing.developers_profiles.logo_url}
                        alt="Project Logo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>Project<br />Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Group 481922 - Price Group */}
                  <div style={{ position: 'absolute', left: '0px', top: '54px', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{
                      fontFamily: "'Outfit'",
                      fontWeight: 500,
                      fontSize: '30px',
                      lineHeight: '30px',
                      color: '#002143'
                    }}>Php</span>
                    <span style={{
                      marginLeft: '10px',
                      fontFamily: "'Outfit'",
                      fontWeight: 500,
                      fontSize: '40px',
                      lineHeight: '40px',
                      color: '#002143'
                    }}>{formatPrice(listing.price)}</span>
                  </div>

                  {/* Group 481923 - Info/Details Group */}
                  <div style={{ position: 'absolute', left: '0px', top: '115px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
                      {listing.projects?.project_type || 'Apartment'}
                    </span>
                    <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bed size={20.11} color="#002143" />
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
                        {listing.project_units?.bedrooms || 0}
                      </span>
                    </div>
                    <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bath size={20.11} color="#002143" />
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
                        {listing.project_units?.bathrooms || 0}
                      </span>
                    </div>
                    <div style={{ width: '1.01px', height: '20.11px', background: '#D3D3D3' }} />
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
                      Area: {listing.project_units?.floor_area_sqm || 0} sqm
                    </span>
                  </div>

                  {/* Group 481924 - Title/Link Group */}
                  <div style={{ position: 'absolute', left: '0px', top: '152px', display: 'flex', alignItems: 'center', gap: '10px', width: '430px', overflow: 'hidden' }}>
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{listing.title}</span>
                    {listing.project_amenities?.[0] && (
                      <>
                        <div style={{ width: '1.01px', height: '15.08px', background: '#D3D3D3' }} />
                        <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE', whiteSpace: 'nowrap' }}>{listing.project_amenities[0]}</span>
                      </>
                    )}
                    {listing.projects?.project_type && (
                      <>
                        <div style={{ width: '1.01px', height: '15.08px', background: '#D3D3D3' }} />
                        <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#1428AE', whiteSpace: 'nowrap' }}>{listing.projects.project_type}</span>
                      </>
                    )}
                  </div>

                  {/* Location Group */}
                  <div style={{ position: 'absolute', left: '0px', top: '188px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={17.09} color="#002143" />
                    <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143' }}>
                      {listing.projects?.city_municipality}, {listing.projects?.province}, Philippines
                    </span>
                  </div>

                  {/* Action Buttons - Group 481925 */}
                  <div style={{ position: 'absolute', left: '0px', top: '235px', display: 'flex', gap: '15px' }}>
                    {/* Email Button */}
                    <div style={{
                      width: '109.58px',
                      height: '50.27px',
                      background: '#DFE3FF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8.13px',
                      cursor: 'pointer'
                    }}>
                      <svg width="25.13" height="25.13" viewBox="0 0 24 24" fill="#1428AE">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>Email</span>
                    </div>

                    {/* Call Button */}
                    <div style={{
                      width: '97.51px',
                      height: '50.27px',
                      background: '#DFE3FF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8.13px',
                      cursor: 'pointer'
                    }}>
                      <svg width="25.13" height="25.13" viewBox="0 0 24 24" fill="#1428AE">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>Call</span>
                    </div>

                    {/* WhatsApp Button */}
                    <div style={{
                      width: '152.81px',
                      height: '50.27px',
                      background: '#E1FFDF',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: 'pointer'
                    }}>
                      <svg width="23.12" height="23.12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" fill="#00A629" />
                        <path d="M12.05 0C5.414 0 .004 5.408 0 12.046c0 2.123.543 4.192 1.571 6.059L0 24l6.105-1.602a11.834 11.834 0 005.937 1.598h.005c6.637 0 12.048-5.408 12.052-12.046a11.824 11.824 0 00-3.417-8.514L12.05 0z" fill="#00A629" fillOpacity="0.1" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 14.1522 1.62123 16.155 2.68652 17.8441L1 23L6.28955 21.2831C7.94043 22.3721 9.9043 23 12 23Z" fill="#00A629" />
                        <path d="M17.5015 14.3315C17.2275 14.1945 15.881 13.5315 15.6315 13.4415C15.381 13.3505 15.1985 13.305 15.016 13.5785C14.8335 13.8515 14.309 14.4665 14.15 14.6495C13.991 14.832 13.832 14.8545 13.558 14.718C13.2845 14.581 12.4045 14.293 11.36 13.3615C10.547 12.636 9.9985 11.7435 9.839 11.4705C9.6795 11.1975 9.822 11.05 9.959 10.914C10.082 10.7915 10.232 10.595 10.369 10.435C10.5055 10.2755 10.551 10.1615 10.642 9.979C10.7335 9.797 10.688 9.6375 10.6195 9.501C10.551 9.364 10.0045 8.0195 9.7765 7.468C9.5545 6.9315 9.3295 7.001 9.163 6.9925C9.006 6.9845 8.824 6.983 8.642 6.983C8.4595 6.983 8.1635 7.0515 7.913 7.3245C7.6625 7.5975 6.9565 8.258 6.9565 9.6015C6.9565 10.945 7.936 12.2425 8.0725 12.425C8.2095 12.6075 10.0015 15.3675 12.741 16.549C13.3925 16.83 13.9015 17.0005 14.3005 17.127C14.9545 17.334 15.5495 17.305 16.021 17.2345C16.5465 17.156 17.6405 16.5715 17.868 15.934C18.096 15.297 18.096 14.75 18.0275 14.6365C17.959 14.5225 17.7765 14.4685 17.5015 14.3315Z" fill="white" />
                      </svg>
                      <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#00A629' }}>WhatsApp</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Sidebar Elements */}
          {/* Sidebar Elements */}
          {/* AD 1 (Small) */}
          <div style={{ position: 'absolute', width: '350.85px', height: '335.77px', left: '1272.15px', top: '351.23px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '350.85px', height: '335.77px', background: '#D9D9D9', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <iframe
                src="https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/14?size=300x250"
                width="300"
                height="250"
                frameBorder="0"
                scrolling="no"
                style={{ border: 'none', overflow: 'hidden' }}
              />
            </div>
            <span style={{ marginTop: '10px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', color: '#7F7F7F' }}>Advertisement</span>
          </div>

          {/* Alert Me Button */}
          <div style={{
            boxSizing: 'border-box',
            position: 'absolute',
            width: '350.85px',
            height: '56.3px',
            left: '1272.15px',
            top: '740.28px',
            border: '1px solid #1428AE',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '13px',
            cursor: 'pointer'
          }}>
            <Bell size={25.13} color="#1428AE" fill="#1428AE" />
            <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#1428AE' }}>ALERT ME OF NEW PROPERTIES</span>
          </div>

          {/* Recommended Searches */}
          <div style={{ position: 'absolute', width: '350.85px', left: '1272.15px', top: '826.74px' }}>
            <div style={{ width: '350.85px', height: '35.19px', background: '#F4F4F9', borderRadius: '5px', display: 'flex', alignItems: 'center', paddingLeft: '16px', marginBottom: '15px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#002143' }}>Recommended searches</span>
            </div>
            <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>1 Bedroom Properties for sale in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>2 Bedroom Properties for sale in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>Apartments for sale in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 500, fontSize: '15px', lineHeight: '15px', color: '#1428AE', cursor: 'pointer' }}>View More</span>
            </div>
          </div>

          {/* Useful Links */}
          <div style={{ position: 'absolute', width: '350.85px', left: '1272.15px', top: '1007.69px' }}>
            <div style={{ width: '350.85px', height: '35.19px', background: '#F4F4F9', borderRadius: '5px', display: 'flex', alignItems: 'center', paddingLeft: '16px', marginBottom: '15px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#002143' }}>Useful Links</span>
            </div>
            <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>Apartments for rent in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>Apartment for sale in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>Hotel Apartment for rent in the Philippines</span>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', lineHeight: '15px', color: '#002143', cursor: 'pointer' }}>Villa Compound for sale in the Philippines</span>
            </div>
          </div>

          {/* AD 2 (Large) */}
          <div style={{ position: 'absolute', width: '350.85px', height: '588.1px', left: '1272.15px', top: '1193.67px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '350.85px', height: '588.1px', background: '#D9D9D9', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Outfit'", fontWeight: 900, fontSize: '80px', lineHeight: '80px', color: '#002143', textAlign: 'center' }}>ADS</span>
            </div>
            <span style={{ marginTop: '10px', fontFamily: "'Outfit'", fontWeight: 300, fontSize: '15px', color: '#7F7F7F' }}>Advertisement</span>
          </div>

        </div>
      </div>
    </div>
    </>
  )
}

