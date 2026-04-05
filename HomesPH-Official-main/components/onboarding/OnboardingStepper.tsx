'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  User, MapPin, Building2, CheckCircle2, ChevronRight, ChevronLeft, Loader2, ArrowRight,
} from 'lucide-react'
import type { DashboardUser } from '@/lib/auth/types'
import type { ProfileBundle } from '@/lib/profile-types'
import ProfileBasicTab from '@/components/profile/profile-basic-tab'
import ProfileContactTab from '@/components/profile/profile-contact-tab'
import { skipProfileCompletionAction } from '@/app/dashboard/profile/actions'

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User, description: 'Your full name, birthday, and account basics.' },
  { id: 'contact',  label: 'Contact',       icon: MapPin, description: 'Phone number and how clients can reach you.' },
  { id: 'done',     label: 'Done',          icon: CheckCircle2, description: 'You\'re all set!' },
]

interface Props {
  user: DashboardUser
  initialBundle: ProfileBundle
}

export default function OnboardingStepper({ user, initialBundle }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(initialBundle.profile)
  const [contact, setContact] = useState(initialBundle.contact)
  const [completing, setCompleting] = useState(false)

  const isLastContentStep = step === STEPS.length - 2 // just before 'done'
  const isDoneStep = step === STEPS.length - 1

  async function handleFinish() {
    setCompleting(true)
    // Persist the setup skip against the account so it survives across browsers.
    await skipProfileCompletionAction()
    router.push(`/dashboard/${user.roleSegment}`)
  }

  async function handleSkip() {
    await skipProfileCompletionAction()
    router.push(`/dashboard/${user.roleSegment}`)
  }

  const CurrentIcon = STEPS[step].icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1f4a] via-[#163880] to-[#0c1f4a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1">
              <Image
                src="https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png"
                alt="HomesPH" width={32} height={32} className="object-contain" unoptimized
              />
            </div>
            <span className="text-white font-black text-xl tracking-tight">HomesPH</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Progress header */}
          <div className="bg-gradient-to-r from-[#0c1f4a] to-[#163880] px-8 py-6">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              Account Setup
            </p>
            <h1 className="text-white text-xl font-black mb-5">
              Welcome, {user.fullName.split(' ')[0]}! Let's set up your profile.
            </h1>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isComplete = i < step
                const isActive = i === step
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all
                      ${isComplete ? 'bg-emerald-400 text-white' : isActive ? 'bg-white text-[#0c1f4a]' : 'bg-white/15 text-white/50'}
                    `}>
                      {isComplete ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <ChevronRight size={14} className="text-white/20 mx-1" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="px-8 py-8">
            {!isDoneStep && (
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0c1f4a]">
                  <CurrentIcon size={18} />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">{STEPS[step].label}</h2>
                  <p className="text-xs text-slate-500">{STEPS[step].description}</p>
                </div>
              </div>
            )}

            {/* Step 0 — Personal Info */}
            {step === 0 && (
              <ProfileBasicTab
                profile={profile}
                onUpdated={(next) => setProfile(cur => ({ ...cur, ...next }))}
              />
            )}

            {/* Step 1 — Contact */}
            {step === 1 && (
              <ProfileContactTab
                contact={contact}
                onUpdated={(next) => setContact(next)}
              />
            )}

            {/* Step 2 — Done */}
            {isDoneStep && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">You're all set!</h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Your basic profile is ready. You can always update more details from the dashboard.
                </p>
                <button
                  onClick={handleFinish}
                  disabled={completing}
                  className="mt-8 flex items-center gap-2 bg-[#0c1f4a] hover:bg-[#163880] text-white px-8 py-3 rounded-xl font-bold transition-all mx-auto disabled:opacity-50"
                >
                  {completing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {completing ? 'Loading dashboard…' : 'Go to My Dashboard'}
                </button>
              </div>
            )}
          </div>

          {/* Footer nav */}
          {!isDoneStep && (
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Skip setup
                </button>
              </div>
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 bg-[#0c1f4a] hover:bg-[#163880] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                {isLastContentStep ? 'Finish' : 'Continue'}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Step {step + 1} of {STEPS.length} · HomesPH Dashboard Setup
        </p>
      </div>
    </div>
  )
}
