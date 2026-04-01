'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react'
import { loginAction } from '@/app/login/actions'
import type { LoginFormState } from '@/lib/auth/types'

const TOO_MANY_ATTEMPTS = 'Too many login attempts. Please wait a moment and try again.'

export default function LoginForm({
  logoUrl,
  notice,
}: {
  logoUrl?: string
  notice?: string | null
}) {
  const initialState: LoginFormState = { error: null }
  const [state, formAction, pending] = useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const isRateLimited = state.error === TOO_MANY_ATTEMPTS

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const nextErrors: typeof errors = {}
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) nextErrors.email = 'Email address is required.'
    else if (!emailRe.test(form.email)) nextErrors.email = 'Please enter a valid email address.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'

    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault()
      setErrors(nextErrors)
      return
    }
  }

  return (
    <div className="w-full max-w-[450px]">

      {/* Card — gold top accent for premium feel */}
      <div className="bg-white rounded-xl border-t-[3px] border-[#f59e0b] shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10),0_30px_60px_rgba(12,31,74,0.06)] ring-1 ring-[#0c1f4a]/[0.05] px-8 sm:px-10 py-9 sm:py-10">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-[1.65rem] font-black text-[#0c1f4a] tracking-tight leading-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Sign in to your HomesPH account to continue.
          </p>
        </div>

        {/* Google (top = higher conversion) */}
        <button
          type="button"
          className="w-full py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-3 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">or sign in with email</span>
          <span className="flex-1 h-px bg-gray-100" />
        </div>

        {notice && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {notice}
          </div>
        )}

        {state.error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {state.error}
            {isRateLimited && (
              <div className="mt-2 text-xs text-rose-700/90">
                Wait a few minutes before retrying, or use the{' '}
                <Link href="/forgot-password" className="font-semibold underline underline-offset-2 hover:text-rose-800">
                  password reset flow
                </Link>
                {' '}if you want to avoid more failed attempts.
              </div>
            )}
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
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
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl border text-[15px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all duration-200 ${errors.email
                    ? 'border-rose-400 bg-rose-50/60 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-gray-200'
                  }`}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5">
                <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-rose-500 text-white inline-flex items-center justify-center font-black text-[9px]">!</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-[12.5px] font-bold text-gray-500 tracking-wide uppercase">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] text-[#0c1f4a]/60 font-semibold hover:text-[#f59e0b] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={15} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3.5 rounded-xl border text-[15px] text-gray-900 placeholder:text-gray-300 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 focus:border-[#0c1f4a] hover:border-gray-300 transition-all duration-200 ${errors.password
                    ? 'border-rose-400 bg-rose-50/60 focus:ring-rose-200 focus:border-rose-400'
                    : 'border-gray-200'
                  }`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-rose-600 flex items-center gap-1.5">
                <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-rose-500 text-white inline-flex items-center justify-center font-black text-[9px]">!</span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-1.5 space-y-3">
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] text-white text-[15px] font-bold tracking-wide hover:from-[#0f2860] hover:to-[#1a44a0] active:scale-[0.99] hover:scale-[1.005] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_20px_rgba(12,31,74,0.28)] hover:shadow-[0_6px_30px_rgba(12,31,74,0.4)]"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Trust badge */}
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Secured with SSL encryption
            </p>
          </div>
        </form>

        {/* Register link */}
        <div className="mt-7 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Don&rsquo;t have an account?{' '}
            <Link
              href="/registration/broker"
              className="text-[#0c1f4a] font-bold hover:text-[#f59e0b] transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Fine print */}
      <p className="text-center text-[11px] text-gray-400 mt-4">
        © {new Date().getFullYear()} HomesPH · All rights reserved.
      </p>
    </div>
  )
}
