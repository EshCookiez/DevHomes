'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface Props {
  email: string
}

export default function OtpVerifyStep({ email }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResend() {
    setResending(true)
    setError(null)
    
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
    
    setResending(false)
    
    if (resendError) {
      setError(resendError.message)
    } else {
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    }
  }

  return (
    <div className="w-full max-w-[540px]">
      <div className="bg-white rounded-xl border-t-[3px] border-[#f59e0b] shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10),0_30px_60px_rgba(12,31,74,0.06)] ring-1 ring-[#0c1f4a]/[0.05] px-8 sm:px-10 py-9">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-[#0c1f4a]/[0.06] flex items-center justify-center">
            <MailCheck size={28} className="text-[#0c1f4a]" />
          </div>
        </div>

        <div className="text-center mb-7">
          <h2 className="text-[1.5rem] font-black text-[#0c1f4a] tracking-tight">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            We sent a verification link to
          </p>
          <p className="text-sm font-bold text-[#0c1f4a] mt-1">{email}</p>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            After you verify your email, your account will stay pending until an administrator approves your registration.
          </p>
        </div>

        {error && (
          <p className="mb-6 text-center text-sm text-rose-600 flex items-center justify-center gap-1.5">
            <span className="shrink-0 w-4 h-4 rounded-full bg-rose-500 text-white inline-flex items-center justify-center font-black text-[9px]">!</span>
            {error}
          </p>
        )}

        {resent && (
          <p className="mb-6 text-center text-sm text-emerald-600 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} />
            Verification email resent!
          </p>
        )}

        <Link
          href="/login?notice=approval-pending"
          className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] text-white text-[15px] font-bold tracking-wide hover:from-[#0f2860] hover:to-[#1a44a0] active:scale-[0.99] hover:scale-[1.005] transition-all duration-150 shadow-[0_4px_20px_rgba(12,31,74,0.28)]"
        >
          Return to Login
        </Link>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500">
            Didn&rsquo;t receive an email?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#0c1f4a] font-semibold hover:text-[#f59e0b] transition-colors inline-flex items-center gap-1"
            >
              {resending ? (
                <><RefreshCw size={12} className="animate-spin" /> Sending…</>
              ) : (
                'Resend link'
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
