'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { forgotPasswordAction, type ForgotPasswordFormState } from '@/app/forgot-password/actions'

export default function ForgotPasswordForm() {
  const initialState: ForgotPasswordFormState = { success: false, message: null }
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const trimmedEmail = email.trim()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!trimmedEmail) {
      e.preventDefault()
      setError('Email address is required.')
      return
    }

    if (!emailRe.test(trimmedEmail)) {
      e.preventDefault()
      setError('Please enter a valid email address.')
      return
    }

    setError(null)
  }

  return (
    <div className="w-full max-w-[450px]">
      <div className="bg-white rounded-xl border-t-[3px] border-[#f59e0b] shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10),0_30px_60px_rgba(12,31,74,0.06)] ring-1 ring-[#0c1f4a]/[0.05] px-8 sm:px-10 py-9 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[1.65rem] font-black text-[#0c1f4a] tracking-tight leading-tight">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Enter the email address you use for HomesPH and we&apos;ll send you a reset link.
          </p>
        </div>

        {state.message && (
          <div className={`mb-5 px-4 py-3 rounded-xl border text-sm ${state.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {state.message}
          </div>
        )}

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[12.5px] font-bold text-gray-500 mb-1.5 tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={15} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError(null)
                }}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all duration-200"
              />
            </div>
          </div>

          <div className="pt-1.5 space-y-3">
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] text-white text-[15px] font-bold tracking-wide hover:from-[#0f2860] hover:to-[#1a44a0] active:scale-[0.99] hover:scale-[1.005] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_20px_rgba(12,31,74,0.28)] hover:shadow-[0_6px_30px_rgba(12,31,74,0.4)]"
            >
              {pending ? 'Sending reset link...' : 'Send reset link'}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Password reset is secured through Supabase Auth
            </p>
          </div>
        </form>

        <div className="mt-7 pt-6 border-t border-gray-100 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#0c1f4a] font-bold hover:text-[#f59e0b] transition-colors">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}