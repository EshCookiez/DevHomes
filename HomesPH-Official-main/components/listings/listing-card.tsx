import Link from 'next/link'
import { MapPin, Bed, Bath, LayoutTemplate, Building2, CheckCircle2 } from 'lucide-react'

interface ListingCardProps {
  listing: any
  type?: 'sale' | 'rent'
}

export function ListingCard({ listing, type = 'sale' }: ListingCardProps) {
  const thumb = listing.property_listing_galleries?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]?.image_url
  const locArr = [listing.projects?.city_municipality, listing.projects?.province].filter(Boolean)
  const loc = locArr.length > 0 ? locArr.join(', ') : 'Unknown Location'
  const unit = listing.project_units

  const fmt = (n?: number | null) => {
    if (!n) return 'Price on request'
    return type === 'sale' ? `₱ ${Number(n).toLocaleString()}` : `₱ ${Number(n).toLocaleString()} / mo`
  }

  const badgeColor = type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
  const badgeText = type === 'sale' ? 'For Sale' : 'For Rent'

  return (
    <Link 
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="h-52 bg-gray-100 relative overflow-hidden">
        {thumb ? (
          <img 
            src={thumb} 
            alt={listing.title} 
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Building2 className="w-8 h-8 opacity-20 mb-2" />
            <span className="text-xs font-medium">No image</span>
          </div>
        )}
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white shadow-md ${badgeColor}`}>
            {badgeText}
          </span>
          {listing.is_featured && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white bg-amber-500 shadow-md">
              Featured 🌟
            </span>
          )}
        </div>

        {/* Status / RFO Badge */}
        {unit?.is_rfo && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-800 px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            RFO
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-1.5">
          <h3 className="font-semibold text-[15px] text-gray-900 leading-snug line-clamp-2 md:group-hover:text-[#1428ae] transition-colors">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-center text-[12px] text-gray-500 mb-3 gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{loc}</span>
          {listing.projects?.name && (
            <>
              <span className="text-gray-300 px-1">•</span>
              <span className="truncate">{listing.projects.name}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-[#1428ae] tracking-tight mb-4">
          {fmt(listing.price)}
        </div>

        {/* Specs Grid */}
        {(unit?.bedrooms != null || unit?.bathrooms != null || unit?.floor_area_sqm) ? (
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-600 pt-4 border-t border-gray-100">
            {unit?.bedrooms != null && (
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{unit.bedrooms}</span>
              </div>
            )}
            {unit?.bathrooms != null && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{unit.bathrooms}</span>
              </div>
            )}
            {unit?.floor_area_sqm && (
              <div className="flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{unit.floor_area_sqm} <span className="text-[10px] text-gray-400">sqm</span></span>
              </div>
            )}
          </div>
        ) : (
           <div className="pt-4 border-t border-gray-100 text-[12px] text-gray-400 flex items-center gap-1.5">
             <Building2 className="w-4 h-4" />
             View for details
           </div>
        )}

        {/* Developer / Extra Footer */}
        {listing.developers_profiles?.developer_name && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
               <Building2 className="w-3 h-3 text-gray-400" />
            </div>
            <span className="text-[11px] text-gray-400 truncate font-medium">
              By {listing.developers_profiles.developer_name}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
