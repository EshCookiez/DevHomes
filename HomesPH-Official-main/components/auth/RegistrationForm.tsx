'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { registerAccountAction } from '@/app/registration/actions'
import { uploadIdAction } from '@/app/registration/actions'
import type { RegisterAccountInput, RegistrationRole } from '@/app/registration/actions'
import {
  clearStaleBrowserSupabaseSession,
  ensureSupabaseBrowserSessionHealth,
  isInvalidRefreshTokenError,
  supabase,
} from '@/lib/supabase-browser'
import { applyInviteSessionFromHash, hasInviteAuthHash } from '@/lib/supabase-invite-browser'
import { Mail, Lock, User, Phone, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, BadgeCheck, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RegistrationFormProps {
  initialRole?: RegistrationRole
  invitationToken?: string
  invitedEmail?: string
}

const INVITE_SESSION_ALERT =
  'Auth session missing means this page was opened without the active invitation login. Open the latest invitation email link first. The same browser is fine after signing out the secretary account.'

export default function RegistrationForm({
  initialRole,
  invitationToken,
  invitedEmail,
}: RegistrationFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('Please check your email to verify your account. Once verified, your application will move into the approval queue.')
  const [preparingInvite, setPreparingInvite] = useState(false)
  const [lockedInviteEmail, setLockedInviteEmail] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [idUrl, setIdUrl] = useState<string | null>(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Pre-filled values from URL
  const roleParam = searchParams.get('role') as RegistrationRole | null
  const refParam = searchParams.get('ref')
  const tokenParam = invitationToken ?? searchParams.get('token')
  const codeParam = searchParams.get('code')
  const effectiveRole = initialRole ?? roleParam ?? 'salesperson'
  const [inviteSessionReady, setInviteSessionReady] = useState(!tokenParam)

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: invitedEmail ?? '',
    phone: '',
    prcNumber: '',
    password: '',
    confirmPassword: '',
  })

  const requiresLicenseFields = effectiveRole === 'franchise' || effectiveRole === 'salesperson'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingId(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadIdAction(fd)

      if (result.success && result.url) {
        setIdUrl(result.url)
      } else {
        setError(result.message || 'Failed to upload ID document.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload ID document.')
    } finally {
      setUploadingId(false)
    }
  }

  useEffect(() => {
    setInviteSessionReady(!tokenParam)
  }, [tokenParam])

  useEffect(() => {
    if (!invitedEmail) {
      return
    }

    setFormData((prev) => ({ ...prev, email: invitedEmail }))
    setLockedInviteEmail(true)
  }, [invitedEmail])

  useEffect(() => {
    let cancelled = false

    const prepareInviteFlow = async () => {
      if (!tokenParam) {
        await ensureSupabaseBrowserSessionHealth(supabase)
        setInviteSessionReady(true)
        return
      }

      setPreparingInvite(true)
      setInviteSessionReady(false)

      try {
        await ensureSupabaseBrowserSessionHealth(supabase)

        if (codeParam) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam)

          if (exchangeError) {
            throw exchangeError
          }

          const nextParams = new URLSearchParams(searchParams.toString())
          nextParams.delete('code')

          const nextQuery = nextParams.toString()
          const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
          window.history.replaceState({}, '', nextUrl)
        } else if (hasInviteAuthHash()) {
          await applyInviteSessionFromHash(supabase)
        } else {
          const { error: sessionError } = await supabase.auth.getSession()

          if (sessionError) {
            throw sessionError
          }
        }

        const { data, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!cancelled && data.user?.email) {
          setFormData((prev) => ({ ...prev, email: data.user?.email ?? prev.email }))
          setLockedInviteEmail(true)
          setInviteSessionReady(true)
          return
        }

        if (!cancelled) {
          setInviteSessionReady(false)
          setError(INVITE_SESSION_ALERT)
        }
      } catch (err) {
        if (!cancelled) {
          const isStaleRefreshToken = isInvalidRefreshTokenError(err)

          if (isInvalidRefreshTokenError(err)) {
            await clearStaleBrowserSupabaseSession(supabase)
          }

          setInviteSessionReady(false)
          const message = err instanceof Error ? err.message : 'Unable to prepare your invitation session.'
          setError(
            isStaleRefreshToken || message.toLowerCase().includes('auth session missing')
              ? INVITE_SESSION_ALERT
              : message,
          )
        }
      } finally {
        if (!cancelled) {
          setPreparingInvite(false)
        }
      }
    }

    void prepareInviteFlow()

    return () => {
      cancelled = true
    }
  }, [codeParam, searchParams, tokenParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (tokenParam && !inviteSessionReady) {
      setError(INVITE_SESSION_ALERT)
      return
    }

    if (requiresLicenseFields && !idUrl) {
      setError('Please upload a valid ID document before continuing.')
      return
    }

    setLoading(true)
    
    try {
      const result = await registerAccountAction({
        role: effectiveRole,
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        phone: formData.phone,
        prcNumber: requiresLicenseFields ? formData.prcNumber : undefined,
        password: formData.password,
        referralId: refParam,
        token: tokenParam,
        idUploadUrl: requiresLicenseFields ? idUrl : undefined,
      } as RegisterAccountInput)

      if (result.success) {
        if (tokenParam) {
          router.replace('/login?notice=invite-registration-submitted')
          return
        }

        setSuccessMessage(result.message)
        setSuccess(true)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong during registration.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-emerald-100 bg-emerald-50/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 size={24} />
          </div>
          <CardTitle className="text-emerald-900">Registration Successful!</CardTitle>
          <CardDescription className="text-emerald-700">
            {successMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg border-slate-200 shadow-xl overflow-hidden">
      <div className="h-2 bg-[#0c1f4a]" />
      <CardHeader className="space-y-1 pb-8">
        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Account Registration</CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          Fill out the form below to start your journey with HomesPH.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {tokenParam && preparingInvite && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Preparing your secure invitation...
            </div>
          )}

          {tokenParam && !preparingInvite && !inviteSessionReady ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm flex items-center gap-2">
              <AlertCircle size={14} />
              {INVITE_SESSION_ALERT}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fname" className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  id="fname" name="fname" placeholder="Juan" required 
                  className="pl-9 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  value={formData.fname} onChange={handleChange} 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lname" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  id="lname" name="lname" placeholder="Dela Cruz" required 
                  className="pl-9 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  value={formData.lname} onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</Label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                id="email" name="email" type="email" placeholder="name@example.com" required 
                className="pl-9 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                value={formData.email} onChange={handleChange}
                readOnly={lockedInviteEmail}
              />
            </div>
            {lockedInviteEmail && (
              <p className="mt-1 text-[11px] text-slate-500">
                This email came from your Supabase invitation and cannot be changed here.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                id="phone" name="phone" type="tel" placeholder="0917 XXX XXXX" required 
                className="pl-9 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                value={formData.phone} onChange={handleChange} 
              />
            </div>
          </div>

          {requiresLicenseFields && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="prcNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider">PRC Number</Label>
                <div className="relative">
                  <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="prcNumber"
                    name="prcNumber"
                    placeholder="0001234"
                    className="pl-9 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    value={formData.prcNumber}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Optional, but recommended for licensed agents.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 border border-slate-200">
                    <Upload size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">Upload Valid ID</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      This invited registration still requires identity verification. PRC verification is reviewed separately by platform admin after team approval.
                    </p>
                    <input
                      id="invite-id-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadingId}
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <label
                        htmlFor="invite-id-upload"
                        className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                          idUrl
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-[#0c1f4a] hover:border-[#0c1f4a]/30'
                        } ${uploadingId ? 'cursor-wait opacity-60' : ''}`}
                      >
                        {uploadingId ? 'Uploading...' : idUrl ? 'ID Uploaded (Change)' : 'Select File'}
                      </label>
                      {idUrl ? <span className="text-[11px] font-medium text-emerald-700">Document ready for submission.</span> : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  id="password" name="password" type={showPassword ? 'text' : 'password'} required 
                  className="pl-9 pr-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  value={formData.password} onChange={handleChange} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm</Label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required 
                  className="pl-9 pr-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  value={formData.confirmPassword} onChange={handleChange} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || preparingInvite || (Boolean(tokenParam) && !inviteSessionReady)}
            className="w-full h-12 rounded-xl bg-[#0c1f4a] hover:bg-[#163880] text-white font-black transition-all shadow-md mt-4"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Complete Registration
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2">
            By clicking register, you agree to our <span className="text-[#0c1f4a] font-bold underline cursor-pointer">Terms of Service</span>.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
