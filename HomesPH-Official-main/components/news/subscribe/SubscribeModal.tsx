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
      const res = await fetch('/api/news/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && (data.status === 'success' || res.status === 201)) {
        setStatus('success')
        setMessage('Success! Welcome email sent.')
        setEmail('')
        setProvince('')
        setCity('')
        setTimeout(() => {
          onClose()
          setStatus('idle')
          setMessage('')
        }, 2000)
      } else {
        setStatus('error')
        setMessage(data.message || data.error || 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Could not connect to the newsletter server.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl relative" style={{ width: '1007px', height: '605px', maxWidth: '95vw', maxHeight: '90vh' }}>
        {/* Close Button - Top Right Corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-light z-10 w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="flex h-full">
          {/* Logo Section with Gradient */}
          <div
            className="flex items-center justify-center relative"
            style={{
              width: '438px',
              height: '605px',
              background: 'linear-gradient(90deg, #1428AE 0%, #0A1B90 50%, #000F73 100%)',
              flexShrink: 0,
            }}
          >
            <Image
              src="/homes-h-logo.png"
              alt="HomesPH Logo"
              width={330}
              height={330}
              className="object-contain"
            />
          </div>

          {/* Form Section */}
          <div className="flex-1 p-12 flex flex-col overflow-y-auto" style={{ paddingTop: '60px' }}>
            <div className="mb-6">
              <h2 style={{ fontFamily: 'Outfit', color: '#1E40AF', fontSize: '30px', fontWeight: 'bold' }}>
                Subscribe to the latest updates!
              </h2>
              <p style={{ fontFamily: 'Outfit', color: '#666666', fontSize: '20px', marginTop: '8px' }}>
                Subscribe to our newsletters and get the latest Philippines daily updates.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#5B789D' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  style={{ fontFamily: 'Outfit' }}
                />
              </div>

              {/* Target Location Section */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#1E40AF' }}>
                  Target Location
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-semibold uppercase mb-1 block" style={{ fontFamily: 'Outfit', color: '#5B789D' }}>
                      Province
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                      placeholder="Select province"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      style={{ fontFamily: 'Outfit' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase mb-1 block" style={{ fontFamily: 'Outfit', color: '#5B789D' }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Select province first"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      style={{ fontFamily: 'Outfit' }}
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Defaults */}
              <div className="bg-blue-50 p-2.5 rounded-lg mb-2">
                <p className="text-xs" style={{ fontFamily: 'Outfit', color: '#1E40AF' }}>
                  <span className="font-semibold">Subscription Defaults</span>
                  <br />
                  <span className="text-gray-700 text-xs">Daily delivery at 8:00 AM with Real Estate, Home Buying, and Lifestyle updates for readers in the Philippines.</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-bold text-white transition-opacity disabled:opacity-60"
                style={{
                  fontFamily: 'Outfit',
                  background: '#1E40AF',
                  fontSize: '20px',
                }}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe Now!'}
              </button>

              {/* Message */}
              {message && (
                <p
                  className="text-center text-xs font-medium"
                  style={{ color: status === 'success' ? '#059669' : '#DC2626' }}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
