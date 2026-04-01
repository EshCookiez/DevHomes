import { cn } from '@/lib/utils'

interface AdBannerProps {
  id?: string
  sizes?: ('160x600' | '320x50' | '320x100' | '300x250' | '300x600' | '728x90' | '970x50' | '970x250')[]
  className?: string
}

export default function AdBanner({ id = '14', sizes = ['320x50', '728x90', '970x250'], className }: AdBannerProps) {
  // Map sizes to their dimensions
  const dims = {
    '160x600': { w: 160, h: 600 },
    '320x50': { w: 320, h: 50 },
    '320x100': { w: 320, h: 100 },
    '300x250': { w: 300, h: 250 },
    '300x600': { w: 300, h: 600 },
    '728x90': { w: 728, h: 90 },
    '970x50': { w: 970, h: 50 },
    '970x250': { w: 970, h: 250 },
  }

  // Helper to generate iframe block
  const renderIframe = (size: keyof typeof dims) => {
    const { w, h } = dims[size]
    return (
      <iframe
        src={`https://homesphnews-api-394504332858.asia-southeast1.run.app/ads/${id}?size=${size}`}
        width={w}
        height={h}
        frameBorder="0"
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden' }}
      />
    )
  }

  // Pre-configured responsive combinations
  const hasResponsiveSet = sizes.includes('320x50') && sizes.includes('728x90') && sizes.includes('970x250')
  const hasBannerSet = sizes.includes('320x50') && sizes.includes('728x90') && sizes.includes('970x50')

  if (hasResponsiveSet || hasBannerSet) {
    const desktopSize = hasResponsiveSet ? '970x250' : '970x50'
    return (
      <section className={cn("py-8 flex justify-center items-center w-full", className)}>
        {/* Mobile (320px) */}
        <div className="block sm:hidden">
          {renderIframe('320x50')}
        </div>
        {/* Tablet (728px) */}
        <div className="hidden sm:block lg:hidden">
          {renderIframe('728x90')}
        </div>
        {/* Desktop (970px) */}
        <div className="hidden lg:block">
          {renderIframe(desktopSize)}
        </div>
      </section>
    )
  }

  // For specific exact sizes (like sidebar '160x600' or in-content '300x250')
  return (
    <section className={cn("flex justify-center items-center", className)}>
      {sizes.map((s) => (
        <div key={s}>{renderIframe(s as keyof typeof dims)}</div>
      ))}
    </section>
  )
}
