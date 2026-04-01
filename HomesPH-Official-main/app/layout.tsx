import type { Metadata } from 'next'
import { Outfit, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import PageTransitionLoader from '@/components/layout/PageTransitionLoader'
import { getSiteSettings } from '../lib/site-settings'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_URL = 'https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph'

export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle, siteDescription } = await getSiteSettings()
  return {
    title: { default: siteTitle, template: `%s | ${siteTitle}` },
    description: siteDescription,
    metadataBase: new URL('https://homesph.com'),
    applicationName: siteTitle,
    authors: [{ name: siteTitle }],
    keywords: [
      'real estate',
      'property',
      'homes',
      'franchises',
      'agents',
      'buyers',
      'Philippines',
      'property listings',
      'real estate marketplace',
    ],
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: siteTitle,
      locale: 'en_PH',
      url: 'https://homesph.com',
      images: [
        {
          url: `${BASE_URL}/preview.jpg`,
          width: 1200,
          height: 630,
          alt: `${siteTitle} — Your home starts here`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [`${BASE_URL}/preview.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    icons: {
      icon: [
        { url: `${BASE_URL}/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
        { url: `${BASE_URL}/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
        { url: `${BASE_URL}/android-chrome-192x192.png`, sizes: '192x192', type: 'image/png' },
        { url: `${BASE_URL}/android-chrome-512x512.png`, sizes: '512x512', type: 'image/png' },
        { url: `${BASE_URL}/favicon.ico`, rel: 'shortcut icon' },
      ],
      apple: `${BASE_URL}/apple-touch-icon.png`,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <PageTransitionLoader />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
