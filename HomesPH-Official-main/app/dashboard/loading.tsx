import Image from 'next/image'

const LOGO_URL =
  'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png'

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-200/70 ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-slide 1.6s linear infinite',
        }}
      />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <>
      <style>{`
        @keyframes shimmer-slide {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes dash-loading-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top progress stripe */}
      <div className="h-[3px] w-full bg-slate-200">
        <div
          className="h-full rounded-r-full"
          style={{
            background: 'linear-gradient(90deg, #1428ae 0%, #3b5fea 55%, #f4aa1d 100%)',
            animation: 'dash-loading-progress 1.4s cubic-bezier(0.4,0,0.2,1) forwards',
            width: '0%',
          }}
        />
      </div>

      <div
        className="p-6 max-w-7xl mx-auto space-y-6"
        style={{ animation: 'dash-loading-fadein 0.4s ease both' }}
      >
        {/* Logo + page title area */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-200/70 overflow-hidden relative shrink-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-slide 1.6s linear infinite',
              }}
            />
          </div>
          <div className="space-y-2">
            <Shimmer className="h-7 w-52" />
            <Shimmer className="h-4 w-80" />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-9 w-9 !rounded-full" />
              </div>
              <Shimmer className="h-8 w-20" />
              <Shimmer className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Shimmer className="h-5 w-36" />
              <Shimmer className="h-8 w-28 !rounded-lg" />
            </div>
            <Shimmer className="h-56 w-full !rounded-lg" />
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <Shimmer className="h-5 w-32" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="h-9 w-9 !rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-3.5 w-full" />
                  <Shimmer className="h-3 w-3/4" />
                </div>
                <Shimmer className="h-6 w-14 !rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <Shimmer className="h-5 w-40" />
            <Shimmer className="h-9 w-28 !rounded-lg" />
          </div>
          <div className="divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <Shimmer className="h-8 w-8 !rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-4 w-48" />
                  <Shimmer className="h-3 w-72" />
                </div>
                <Shimmer className="h-6 w-16 !rounded-full" />
                <Shimmer className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dash-loading-progress {
          0%   { width: 0%; }
          60%  { width: 75%; }
          100% { width: 88%; }
        }
      `}</style>
    </>
  )
}
