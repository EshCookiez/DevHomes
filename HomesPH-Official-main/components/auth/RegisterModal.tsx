'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Building2, BadgeCheck } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const ROLES = [
  {
    key: 'developer',
    href: '/registration/developer',
    icon: Building2,
    title: 'Real Estate Developer',
    description:
      'Register your development company and showcase your projects, condominiums, and properties to thousands of buyers.',
    badge: 'For Companies',
    badgeColor: 'bg-blue-50 text-blue-700',
    cta: 'Register as Developer',
    accent: '#0c1f4a',
  },
  {
    key: 'franchise',
    href: '/registration/franchise',
    icon: BadgeCheck,
    title: 'Franchise Partner',
    description:
      'Start your own real estate agency branch with our proven database and marketing systems.',
    badge: 'For Agencies',
    badgeColor: 'bg-amber-50 text-amber-700',
    cta: 'Register as Franchise',
    accent: '#f59e0b',
  },
]

export default function RegisterModal({ open, onClose }: Props) {
  const router = useRouter()

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  function handleSelect(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-[0_32px_80px_rgba(12,31,74,0.2)] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c1f4a] to-[#163880] px-8 py-7 flex items-start justify-between">
          <div>
            <p className="text-[#f59e0b] text-[10px] font-bold tracking-[0.28em] uppercase mb-1">
              Create Account
            </p>
            <h2 className="text-white font-black text-2xl tracking-tight leading-tight">
              Join HomesPH
            </h2>
            <p className="text-blue-200/80 text-sm mt-1">
              How would you like to join our platform?
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map(({ key, href, icon: Icon, title, description, badge, badgeColor, cta, accent }) => (
            <button
              key={key}
              onClick={() => handleSelect(href)}
              className="group text-left rounded-xl border-2 border-gray-100 hover:border-[#0c1f4a]/20 bg-white hover:bg-[#f7f9ff] p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0c1f4a]"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                <Icon size={22} />
              </div>

              {/* Badge */}
              <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-3 ${badgeColor}`}>
                {badge}
              </span>

              <h3 className="font-black text-[#0c1f4a] text-base leading-tight mb-2">
                {title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                {description}
              </p>

              {/* CTA */}
              <span
                className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
                style={{ color: accent }}
              >
                {cta}
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => { onClose(); router.push('/login') }}
              className="text-[#0c1f4a] font-semibold hover:text-[#f59e0b] transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
