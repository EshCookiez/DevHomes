'use client'

import { useState } from 'react'
import { registerAccountAction, uploadIdAction } from '@/app/registration/actions'
import OtpVerifyStep from './OtpVerifyStep'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, Briefcase, BadgeCheck, Building2, Upload } from 'lucide-react'

// Step 1: Role Selection
// Step 2: Company Check
// Step 3: Registration Form (Dynamic)

const schema = z.object({
  role: z.enum(['franchise', 'salesperson']),
  isCompanyLinked: z.boolean(),
  fname: z.string().min(2, 'First name is required'),
  lname: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  prcNumber: z.string().optional(),
  
  // Company-linked specific
  companyName: z.string().optional(),
  officeStreet: z.string().optional(),
  officeCity: z.string().optional(),
  officeZip: z.string().optional(),
  
  // Independent specific
  idImage: z.any().optional(), // For file inputs we handle separately or as base64/signed URL
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match.",
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

export default function FranchiseRegistrationWizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [idUrl, setIdUrl] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isCompanyLinked: true,
    },
    mode: 'onTouched'
  })

  const formValues = watch()

  async function onSubmit(data: FormData) {
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    setServerError(null)

    // Ensure we handle file uploads in the future, for now mock it to the server action
    // @ts-ignore - The action expects specific types we will extend shortly
    const result = await registerAccountAction({
      role: data.role,
      fname: data.fname,
      lname: data.lname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      prcNumber: data.prcNumber,
      isCompanyLinked: data.isCompanyLinked,
      companyName: data.companyName,
      officeStreet: data.officeStreet,
      officeCity: data.officeCity,
      officeZip: data.officeZip,
      idUploadUrl: idUrl,
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

  // Helper for progressing steps
  const nextStep = () => setStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingId(true)
    setServerError(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadIdAction(fd)
    setUploadingId(false)
    if (res.success && res.url) {
      setIdUrl(res.url)
    } else {
      setServerError(res.message || 'Failed to upload ID')
    }
  }

  return (
    <div className="w-full max-w-[540px]">
      <div className="bg-white rounded-xl border-t-[3px] border-[#f59e0b] shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10)] ring-1 ring-[#0c1f4a]/[0.05] px-8 sm:px-10 py-9 sm:py-10 transition-all duration-300">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-[#f59e0b]' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>

        {serverError && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          
          {/* STEP 1: ROLE SELECTION */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-[#0c1f4a]">Select Your Role</h2>
                <p className="text-sm text-gray-500 mt-2">How would you like to interact with the platform?</p>
              </div>
              
              <div className="grid gap-4">
                <div 
                  onClick={() => setValue('role', 'franchise')}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all flex items-start gap-4 ${formValues.role === 'franchise' ? 'border-[#f59e0b] bg-amber-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`p-3 rounded-lg ${formValues.role === 'franchise' ? 'bg-[#f59e0b] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Franchise Partner</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage a team, office, and properties under your agency branch.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setValue('role', 'salesperson')}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all flex items-start gap-4 ${formValues.role === 'salesperson' ? 'border-[#f59e0b] bg-amber-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className={`p-3 rounded-lg ${formValues.role === 'salesperson' ? 'bg-[#f59e0b] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <BadgeCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Salesperson</h3>
                    <p className="text-sm text-gray-500 mt-1">Join an existing network and list properties directly.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button type="button" onClick={nextStep} disabled={!formValues.role} className="w-full py-3.5 rounded-xl bg-[#0c1f4a] text-white font-bold hover:bg-[#163880] transition-colors disabled:opacity-50">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COMPANY CHECK */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-[#0c1f4a]">Company Check</h2>
                <p className="text-sm text-gray-500 mt-2">Are you part of a realty company or franchise?</p>
              </div>

              <div className="grid gap-4">
                <div 
                  onClick={() => setValue('isCompanyLinked', true)}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all flex items-center justify-between ${formValues.isCompanyLinked === true ? 'border-[#0c1f4a] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-gray-900">Yes, I have a company</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formValues.isCompanyLinked === true ? 'border-[#0c1f4a] bg-[#0c1f4a]' : 'border-gray-300'}`}>
                    {formValues.isCompanyLinked === true && <div className="w-2 h-2 bg-white rounded-full"/>}
                  </div>
                </div>

                <div 
                  onClick={() => setValue('isCompanyLinked', false)}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all flex items-center justify-between ${formValues.isCompanyLinked === false ? 'border-[#0c1f4a] bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-gray-900">No, I am independent</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formValues.isCompanyLinked === false ? 'border-[#0c1f4a] bg-[#0c1f4a]' : 'border-gray-300'}`}>
                    {formValues.isCompanyLinked === false && <div className="w-2 h-2 bg-white rounded-full"/>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={prevStep} className="w-1/3 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
                  Back
                </button>
                <button type="button" onClick={nextStep} className="w-2/3 py-3.5 rounded-xl bg-[#0c1f4a] text-white font-bold hover:bg-[#163880] transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REGISTRATION FORM */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="mb-6 flex items-center gap-3">
                <button type="button" onClick={prevStep} className="text-gray-400 hover:text-[#0c1f4a] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                  <h2 className="text-xl font-black text-[#0c1f4a]">Complete Profile</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{formValues.isCompanyLinked ? 'Company-linked Registration' : 'Independent Registration'}</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">First Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={14} /></span>
                    <input {...register('fname')} placeholder="Juan" className="w-full pl-9 pr-3 py-3 rounded-xl border text-[14px] bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 border-gray-200" />
                  </div>
                  {errors.fname && <p className="mt-1 text-xs text-rose-600">{errors.fname.message}</p>}
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Last Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={14} /></span>
                    <input {...register('lname')} placeholder="Dela Cruz" className="w-full pl-9 pr-3 py-3 rounded-xl border text-[14px] bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20 border-gray-200" />
                  </div>
                  {errors.lname && <p className="mt-1 text-xs text-rose-600">{errors.lname.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Email Details</label>
                <div className="relative flex">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={14} /></span>
                  <input {...register('email')} type="email" placeholder="Email Address" className="w-full pl-9 pr-4 py-3 rounded-xl border text-[14px] bg-gray-50/70 border-gray-200" />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">Phone Number</label>
                <div className="relative flex">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={14} /></span>
                  <input {...register('phone')} type="tel" placeholder="Mobile Number" className="w-full pl-9 pr-4 py-3 rounded-xl border text-[14px] bg-gray-50/70 border-gray-200" />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1 tracking-wide uppercase">PRC Number (Optional)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><BadgeCheck size={14} /></span>
                  <input {...register('prcNumber')} placeholder="0001234" className="w-full pl-9 pr-4 py-3 rounded-xl border text-[14px] bg-gray-50/70 border-gray-200" />
                </div>
              </div>

              {/* Conditional Company Info */}
              {formValues.isCompanyLinked && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                  <h3 className="font-bold text-sm text-[#0c1f4a]">Company Details</h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Company Name</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Building2 size={14} /></span>
                      <input {...register('companyName')} placeholder="Search or Enter Company" className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-[13px] border-gray-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Main Office City</label>
                    <input {...register('officeCity')} placeholder="e.g. Cebu City" className="w-full px-3 py-2.5 rounded-lg border text-[13px] border-gray-200" />
                  </div>
                </div>
              )}

              {/* ID Upload (Required for all) */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <Upload className="text-gray-400 mb-2" size={24} />
                <p className="text-sm font-bold text-gray-700">Upload Valid ID</p>
                <p className="text-xs text-gray-500 mb-3">Required for profile verification</p>
                
                <input type="file" id="id-upload" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploadingId} />
                <label htmlFor="id-upload" className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${idUrl ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-[#f59e0b] border-[#f59e0b] hover:bg-amber-50'} ${uploadingId ? 'opacity-50 cursor-wait' : ''}`}>
                  {uploadingId ? 'Uploading...' : idUrl ? 'ID Uploaded ✓ (Click to change)' : 'Select File'}
                </label>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={14} /></span>
                    <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Password" className="w-full pl-9 pr-8 py-3 rounded-xl border text-[14px] bg-gray-50/70 border-gray-200" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
                </div>
                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={14} /></span>
                    <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="Confirm" className="w-full pl-9 pr-8 py-3 rounded-xl border text-[14px] bg-gray-50/70 border-gray-200" />
                  </div>
                  {errors.confirm_password && <p className="mt-1 text-xs text-rose-600">{errors.confirm_password.message}</p>}
                </div>
              </div>

              {/* Final Submit */}
              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] text-white font-bold tracking-wide hover:shadow-lg transition-all disabled:opacity-60">
                  {loading ? 'Submitting Application...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}
