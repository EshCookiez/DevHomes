import { ChevronDown } from 'lucide-react'
import HomeSearchBar from './HomeSearchBar'

const BG = 'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/bg_elements'

interface HeroProps {
  title?: string
  subtitle?: string
  ctaText?: string
  counts?: { cities?: string; listings?: string; free?: string }
}

export default function HomeHero({
  title = 'Discover Your Dream Home in the Philippines',
  subtitle = "Browse houses, condos & investment properties across the country's top cities — free.",
  ctaText = 'Browse Locations',
  counts = { cities: '10+', free: '100%' },
}: HeroProps) {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-r from-[#1428ae] to-[#0f1f8a] py-10 md:py-14">
      <img
        src={`${BG}/ph-map.png`}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain object-right opacity-[0.06] pointer-events-none select-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">{title}</h1>
            <p className="text-blue-200 text-sm leading-relaxed max-w-md">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {([
              [counts.cities ?? '10+', 'Cities'],
              [counts.free ?? '100%', 'Free'],
            ] as const).map(([num, label]) => (
              <div key={String(label)} className="text-center leading-none">
                <p className="text-base font-bold text-white">{num}</p>
                <p className="text-[10px] text-blue-300 uppercase tracking-wide">{label}</p>
              </div>
            ))}

            <a
              href="#locations"
              className="inline-flex items-center gap-1.5 bg-[#f59e0b] hover:bg-amber-400 active:bg-amber-600 text-[#1428ae] font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-md ml-2"
            >
              {ctaText}
              <ChevronDown size={15} strokeWidth={2.5} />
            </a>
          </div>
        </div>

        {/* ── Search bar ── */}
        <HomeSearchBar />
      </div>
    </section>
  )
}
