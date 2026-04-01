import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/site-settings'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import {
  MapPin, Bed, Bath, Maximize2, ChevronRight,
  Phone, Mail, ExternalLink, Star, Home,
} from 'lucide-react'
import type { RentPHProperty } from '@/components/listings/RentPHListingsGrid'

const BASE = process.env.RENTPH_API_URL ?? 'https://rent.ph/api'
const RENTPH_LOGO = 'https://rent.ph/uploads/0000/1/2025/02/06/rentlogo-official1.png'

async function getProperty(slug: string): Promise<RentPHProperty | null> {
  try {
    const res = await fetch(`${BASE}/property/${slug}`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json ?? null
  } catch {
    return null
  }
}

function formatPrice(raw: string | number): string {
  const n = Number(String(raw).replace(/[^0-9.]/g, ''))
  if (isNaN(n) || n === 0) return 'Price on request'
  return `₱${n.toLocaleString('en-PH')}/mo`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const property = await getProperty(slug)
  if (!property) return { title: 'Property Not Found' }
  return {
    title: `${property.title} | HomesPH Rentals`,
    description: `${property.address} — listed for ${formatPrice(property.price)}`,
  }
}

export default async function RentPropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [property, settings] = await Promise.all([
    getProperty(slug),
    getSiteSettings(),
  ])

  if (!property) notFound()

  const price = formatPrice(property.price)
  const coverImg = property.image || property.gallery?.[0]?.large || ''
  const galleryImages = property.gallery?.slice(0, 8) ?? []
  const baths = Number(property.bath) || 0
  const sqm = Number(property.square) || 0

  return (
    <div className="min-h-screen bg-white font-sans">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#1428ae] transition-colors">Home</Link>
          <ChevronRight size={13} />
          <Link href="/rent" className="hover:text-[#1428ae] transition-colors">Rent</Link>
          <ChevronRight size={13} />
          <span className="text-slate-800 font-medium line-clamp-1">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left / Main ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cover image + gallery mosaic */}
            {coverImg || galleryImages.length > 0 ? (
              <div className="grid gap-2">
                {/* Main image */}
                <div className="relative rounded-2xl overflow-hidden h-[380px] bg-slate-100">
                  {coverImg ? (
                    <img src={coverImg} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home size={48} className="text-slate-300" />
                    </div>
                  )}
                  {property.is_featured && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      <Star size={11} fill="currentColor" />
                      Featured
                    </div>
                  )}
                  {/* RentPH logo badge */}
                  <div className="absolute top-4 right-4 bg-white rounded-xl px-2.5 py-1.5 shadow-md">
                    <img src={RENTPH_LOGO} alt="Rent.PH" className="h-5 object-contain" />
                  </div>
                </div>

                {/* Thumbnail strip */}
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {galleryImages.slice(1, 5).map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden h-24 bg-slate-100">
                        <img
                          src={img.large || img.thumb}
                          alt={`Photo ${i + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {i === 3 && galleryImages.length > 5 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">+{galleryImages.length - 5} more</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Title + Price */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex-1">
                  {property.title}
                </h1>
                <span className="text-2xl md:text-3xl font-black text-[#1428ae] shrink-0">
                  {price}
                </span>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{property.address}</span>
              </div>
            </div>

            {/* Specs badges */}
            <div className="flex flex-wrap gap-3">
              {property.property_type && (
                <span className="px-3 py-1.5 bg-[#1428ae]/8 text-[#1428ae] text-sm font-semibold rounded-lg">
                  {property.property_type}
                </span>
              )}
              {property.bed > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                  <Bed size={15} className="text-[#1428ae]" />
                  {property.bed} {property.bed === 1 ? 'Bedroom' : 'Bedrooms'}
                </span>
              )}
              {baths > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                  <Bath size={15} className="text-[#1428ae]" />
                  {baths} {baths === 1 ? 'Bathroom' : 'Bathrooms'}
                </span>
              )}
              {sqm > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                  <Maximize2 size={15} className="text-[#1428ae]" />
                  {sqm} sqm
                </span>
              )}
            </div>

            {/* Source attribution pill */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 w-fit">
              <span className="text-xs text-slate-500 font-medium">Listing powered by</span>
              <img src={RENTPH_LOGO} alt="Rent.PH" className="h-5 object-contain" />
            </div>

            {/* Description */}
            {property.content && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Description</h2>
                <div
                  className="text-slate-600 text-sm leading-relaxed prose prose-sm max-w-none
                    [&_p]:mb-3 [&_br]:block [&_*]:font-[inherit]"
                  dangerouslySetInnerHTML={{ __html: property.content }}
                />
              </div>
            )}

            {/* Source link */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={`https://rent.ph/property/${property.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#1428ae] font-semibold hover:underline"
              >
                View original listing on Rent.PH
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* ── Right / Sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-28 self-start">

            {/* Agent card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Contact Agent</h3>

              {/* Agent info */}
              <div className="flex items-center gap-3">
                {property.user_avatar ? (
                  <img
                    src={property.user_avatar}
                    alt={property.user_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1428ae]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#1428ae] font-bold text-lg">
                      {property.user_name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{property.user_name}</p>
                  {property.agent_title && (
                    <p className="text-xs text-slate-500 truncate">{property.agent_title}</p>
                  )}
                </div>
              </div>

              {/* Contact buttons */}
              <div className="space-y-2">
                {property.agent_phone && (
                  <a
                    href={`tel:${property.agent_phone}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#1428ae] text-white text-sm font-bold rounded-xl hover:bg-[#0f1f8a] transition-colors shadow-sm shadow-[#1428ae]/20"
                  >
                    <Phone size={15} />
                    {property.agent_phone}
                  </a>
                )}
                {property.agent_email && (
                  <a
                    href={`mailto:${property.agent_email}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <Mail size={15} />
                    Email Agent
                  </a>
                )}
              </div>

              {/* RentPH CTA */}
              <a
                href={`https://rent.ph/property/${property.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:border-[#1428ae]/40 hover:text-[#1428ae] transition-all"
              >
                <img src={RENTPH_LOGO} alt="Rent.PH" className="h-4 object-contain" />
                View on Rent.PH
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Price card */}
            <div className="bg-gradient-to-br from-[#1428ae] to-[#0f1f8a] rounded-2xl p-5 text-white space-y-1">
              <p className="text-sm text-white/70 font-medium uppercase tracking-widest">Monthly Rent</p>
              <p className="text-3xl font-black">{price}</p>
              {property.property_type && (
                <p className="text-sm text-white/80">{property.property_type} · {property.address}</p>
              )}
            </div>

            {/* Back link */}
            <Link
              href="/rent"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#1428ae] transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              Back to all rentals
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
      />
    </div>
  )
}
