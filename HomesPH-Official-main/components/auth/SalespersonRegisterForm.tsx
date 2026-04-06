'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Phone, BadgeCheck, ShieldCheck, UserPlus } from 'lucide-react'
import { registerAccountAction } from '@/app/registration/actions'
import { trackRecruitmentClick } from '@/components/dashboard/affiliate/actions'
import OtpVerifyStep from './OtpVerifyStep'

const schema = z.object({
  fname: z.string().min(2, 'First name must be at least 2 characters.'),
  lname: z.string().min(2, 'Last name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  prc_number: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match.",
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function SalespersonRegisterForm() {
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('affiliate-code') || searchParams.get('ref')
  const source = searchParams.get('source')
  const campaign = searchParams.get('campaign')
  
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState<string | null>(null)

  useEffect(() => {
    if (affiliateCode) {
      trackRecruitmentClick(affiliateCode, 'salesperson', source, campaign).catch(console.error)
    }
  }, [affiliateCode, source, campaign])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)

    const result = await registerAccountAction({
      role: 'salesperson',
      fname: data.fname,
      lname: data.lname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      prcNumber: data.prc_number ?? '',
      affiliateCode: affiliateCode,
      source: source,
      campaign: campaign,
    })

    setLoading(false)

    if (!result.success) {
      setServerError(result.message)
    } else {
      setOtpEmail(result.email ?? data.email)
    }
  }

  if (otpEmail) {
    return <OtpVerifyStep email={otpEmail} />
  }

  return (
    <div className="w-full max-w-[540px]">
      <div className="bg-white rounded-xl border-t-[3px] border-[#0c1f4a] shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10),0_30px_60px_rgba(12,31,74,0.06)] ring-1 ring-[#0c1f4a]/[0.05] px-8 sm:px-10 py-9 sm:py-10">

        {/* Heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <UserPlus size={20} className="text-[#0c1f4a]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0c1f4a] tracking-tight leading-tight">Salesperson Registration</h1>
            <p className="text-xs text-gray-500 mt-0.5">Join a professional real estate team</p>
          </div>
        </div>

        {affiliateCode && (
          <div className="mb-6 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
            <BadgeCheck size={14} className="text-emerald-600" />
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Referred by: <span className="font-black underline">{affiliateCode}</span>
            </p>
          </div>
        )}

        {serverError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">First Name</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={14} /></span>
                <input
                  {...register('fname')}
                  placeholder="Juan"
                  className={`w-full pl-9 pr-3 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.fname ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
                />
              </div>
              {errors.fname && <p className="mt-1 text-xs text-rose-600">{errors.fname.message}</p>}
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Last Name</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={14} /></span>
                <input
                  {...register('lname')}
                  placeholder="Dela Cruz"
                  className={`w-full pl-9 pr-3 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.lname ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
                />
              </div>
              {errors.lname && <p className="mt-1 text-xs text-rose-600">{errors.lname.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={14} /></span>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.email ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Phone Number</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={14} /></span>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+63 912 345 6789"
                className={`w-full pl-9 pr-4 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.phone ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">
              PRC Accreditation No. <span className="normal-case font-normal text-gray-400">(if any)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><BadgeCheck size={14} /></span>
              <input
                {...register('prc_number')}
                placeholder="e.g. 0012345"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={14} /></span>
              <input
                {...register('password')}
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className={`w-full pl-9 pr-10 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.password ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Confirm Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={14} /></span>
              <input
                {...register('confirm_password')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password"
                className={`w-full pl-9 pr-10 py-3 rounded-xl border text-[14px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all ${errors.confirm_password ? 'border-rose-400 bg-rose-50/60' : 'border-gray-200'}`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-1 text-xs text-rose-600">{errors.confirm_password.message}</p>}
          </div>

          <div className="pt-1.5 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] text-white text-[15px] font-bold tracking-wide hover:from-[#0f2860] hover:to-[#1a44a0] active:scale-[0.99] hover:scale-[1.005] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_20px_rgba(12,31,74,0.28)] hover:shadow-[0_6px_30px_rgba(12,31,74,0.4)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                'Create Salesperson Account'
              )}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Secured with SSL encryption
            </p>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0c1f4a] font-bold hover:text-[#f59e0b] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">
        © {new Date().getFullYear()} HomesPH · All rights reserved.
      </p>
    </div>
  )
}