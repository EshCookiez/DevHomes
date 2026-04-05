'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const payload = {
      email,
      categories: ['Real Estate', 'Home Buying', 'Lifestyle'],
      countries: ['Philippines'],
      target_province: province || 'All Provinces',
      target_city: city || 'All Cities',
      user_country: 'Philippines',
      user_province: province || '',
      user_city: city || '',
      time: '08:00 AM',
      features: 'Daily',
    }

    try {
      console.log('Subscribing with payload:', payload)
      const res = await fetch('/api/news/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)

      if (res.ok || res.status === 201 || data.status === 'success') {
        setStatus('success')
        setMessage('Success! Welcome email sent.')
        setEmail('')
        setProvince('')
        setCity('')
        setTimeout(() => {
          onClose()
          setStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.message || data.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      setStatus('error')
      setMessage('Could not connect to the newsletter server.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl relative w-full" style={{ maxWidth: '1007px', maxHeight: '90vh' }}>
        {/* Close Button - Top Right Corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-light z-10 w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="flex h-full flex-col md:flex-row overflow-hidden">
          {/* Logo Section with Gradient */}
          <div
            className="flex items-center justify-center relative w-full md:w-[43.5%] order-2 md:order-1 py-8 md:py-0"
            style={{
              background: 'linear-gradient(90deg, #1428AE 0%, #0A1B90 50%, #000F73 100%)',
              flexShrink: 0,
              minHeight: '300px',
            }}
          >
            <Image
              src="/homes-h-logo.png"
              alt="HomesPH Logo"
              width={330}
              height={330}
              className="object-contain max-w-xs md:max-w-sm"
            />
          </div>

          {/* Form Section */}
          <div className="flex-1 p-4 md:p-8 lg:p-12 flex flex-col overflow-y-auto w-full md:w-[56.5%] order-1 md:order-2">
            {status === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'Outfit', color: '#059669', fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 'bold', lineHeight: '1.2' }}>
                  Subscribed successfully!
                </h2>
                <p style={{ fontFamily: 'Outfit', color: '#666666', fontSize: 'clamp(13px, 3vw, 18px)', lineHeight: '1.4' }}>
                  You will receive your first newsletter at 8:00 AM tomorrow.
                </p>
              </div>
            ) : (
            <>
            <div className="mb-4 md:mb-6">
              <h2 style={{ fontFamily: 'Outfit', color: '#1E40AF', fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 'bold', lineHeight: '1.2', wordBreak: 'break-word' }}>
                Subscribe to the latest updates!
              </h2>
              <p style={{ fontFamily: 'Outfit', color: '#666666', fontSize: 'clamp(13px, 3vw, 18px)', marginTop: '8px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                Subscribe to our newsletters and get the latest Philippines daily updates.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-2 md:space-y-3 flex-1 flex flex-col">
              {/* Email Input */}
              <div>
                <label className="block text-xs md:text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#5B789D' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  className="w-full px-3 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
                  style={{ fontFamily: 'Outfit' }}
                />
              </div>

              {/* Target Location Section */}
              <div>
                <label className="block text-xs md:text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#1E40AF' }}>
                  Target Location
                </label>
                <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2">
                  <div>
                    <label className="text-xs font-semibold uppercase mb-1 block" style={{ fontFamily: 'Outfit', color: '#5B789D', fontSize: '11px' }}>
                      Province
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                      placeholder="Select province"
                      className="w-full px-2 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      style={{ fontFamily: 'Outfit' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase mb-1 block" style={{ fontFamily: 'Outfit', color: '#5B789D', fontSize: '11px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Select province first"
                      className="w-full px-2 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      style={{ fontFamily: 'Outfit' }}
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Defaults */}
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg mb-2 md:mb-3">
                <p className="text-xs md:text-sm" style={{ fontFamily: 'Outfit', color: '#1E40AF', lineHeight: '1.4' }}>
                  <span className="font-semibold block mb-1">Subscription Defaults</span>
                  <span className="text-gray-700 text-xs md:text-sm leading-relaxed">Daily delivery at 8:00 AM with Real Estate, Home Buying, and Lifestyle updates for readers in the Philippines.</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-2.5 md:py-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-60 mt-auto"
                style={{
                  fontFamily: 'Outfit',
                  background: '#1E40AF',
                  fontSize: 'clamp(16px, 3.5vw, 24px)',
                }}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe Now!'}
              </button>

              {/* Message */}
              {message && status === 'error' && (
                <p
                  className="text-center text-xs font-medium mt-2"
                  style={{ color: '#DC2626', wordBreak: 'break-word' }}
                >
                  {message}
                </p>
              )}
            </form>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
