'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  registerAccountAction,
  searchRegistrationCompaniesAction,
  type RegistrationCompanySearchOption,
  uploadIdAction,
} from '@/app/registration/actions'
import { trackRecruitmentClick } from '@/components/dashboard/ambassador/actions'
import OtpVerifyStep from './OtpVerifyStep'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
} from 'lucide-react'

type SupportedWizardRole = 'franchise' | 'salesperson'

const schema = z
  .object({
    role: z.enum(['franchise', 'salesperson']).optional(),
    isCompanyLinked: z.boolean(),
    fname: z.string().min(2, 'First name is required'),
    lname: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    prcNumber: z.string().optional(),
    companyName: z.string().optional(),
    officeStreet: z.string().optional(),
    officeCity: z.string().optional(),
    officeZip: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

interface FranchiseRegistrationWizardProps {
  initialRole?: SupportedWizardRole
}

export default function FranchiseRegistrationWizard({
  initialRole,
}: FranchiseRegistrationWizardProps) {
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('affiliate-code') || searchParams.get('ref')
  const source = searchParams.get('source')
  const campaign = searchParams.get('campaign')
  const trackedClicksRef = useRef(new Set<string>())
  const companySearchRequestRef = useRef(0)
  const stepOrder = [1, 2, 3]

  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [idUrl, setIdUrl] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState(false)
  const [companyMatches, setCompanyMatches] = useState<RegistrationCompanySearchOption[]>([])
  const [companySearchError, setCompanySearchError] = useState<string | null>(null)
  const [companySearchLoading, setCompanySearchLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<RegistrationCompanySearchOption | null>(null)
  const [roleSwitchNotice, setRoleSwitchNotice] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: initialRole,
      isCompanyLinked: true,
      fname: '',
      lname: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      prcNumber: '',
      companyName: '',
      officeStreet: '',
      officeCity: '',
      officeZip: '',
    },
    mode: 'onTouched',
  })

  const formValues = watch()
  const selectedRole = formValues.role
  const roleLabel = selectedRole === 'franchise' ? 'Franchise Partner' : 'Salesperson'
  const activeStepIndex = Math.max(0, stepOrder.indexOf(step))
  const normalizedCompanyQuery = formValues.companyName?.trim().toLowerCase() ?? ''
  const normalizedSelectedCompanyName = selectedCompany?.companyName.trim().toLowerCase() ?? ''
  const showCompanyMatches =
    formValues.isCompanyLinked &&
    normalizedCompanyQuery.length >= 2 &&
    (!selectedCompany || normalizedCompanyQuery !== normalizedSelectedCompanyName)
  const companyNameField = register('companyName')

  useEffect(() => {
    if (initialRole) {
      setValue('role', initialRole, { shouldValidate: true })
    }
  }, [initialRole, setValue])

  useEffect(() => {
    if (!affiliateCode || !selectedRole) {
      return
    }

    const trackingKey = `${affiliateCode}:${selectedRole}:${source ?? ''}:${campaign ?? ''}`
    if (trackedClicksRef.current.has(trackingKey)) {
      return
    }

    trackedClicksRef.current.add(trackingKey)
    trackRecruitmentClick(affiliateCode, selectedRole, source, campaign).catch(console.error)
  }, [affiliateCode, campaign, selectedRole, source])

  useEffect(() => {
    if (!formValues.isCompanyLinked) {
      setCompanyMatches([])
      setCompanySearchError(null)
      setCompanySearchLoading(false)
      return
    }

    const companyQuery = formValues.companyName?.trim() ?? ''
    if (selectedCompany && companyQuery.toLowerCase() === selectedCompany.companyName.trim().toLowerCase()) {
      setCompanyMatches([])
      setCompanySearchError(null)
      setCompanySearchLoading(false)
      return
    }

    if (companyQuery.length < 2) {
      setCompanyMatches([])
      setCompanySearchError(null)
      setCompanySearchLoading(false)
      return
    }

    const requestId = companySearchRequestRef.current + 1
    companySearchRequestRef.current = requestId
    setCompanySearchLoading(true)
    setCompanySearchError(null)

    const timeoutId = window.setTimeout(async () => {
      try {
        const matches = await searchRegistrationCompaniesAction(companyQuery)
        if (companySearchRequestRef.current !== requestId) {
          return
        }

        const exactMatch = matches.find(
          (company) => company.companyName.trim().toLowerCase() === companyQuery.toLowerCase(),
        )

        if (exactMatch) {
          setSelectedCompany(exactMatch)
          setCompanyMatches([])
          return
        }

        setCompanyMatches(matches)
      } catch (error) {
        if (companySearchRequestRef.current !== requestId) {
          return
        }

        setCompanyMatches([])
        setCompanySearchError(
          error instanceof Error ? error.message : 'Unable to search existing company records right now.',
        )
      } finally {
        if (companySearchRequestRef.current === requestId) {
          setCompanySearchLoading(false)
        }
      }
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [formValues.companyName, formValues.isCompanyLinked, selectedCompany])

  async function onSubmit(data: FormData) {
    const resolvedRole = initialRole ?? data.role

    if (!resolvedRole) {
      setServerError('Select a role before continuing.')
      return
    }

    if (data.isCompanyLinked) {
      if (!selectedCompany && !data.companyName?.trim()) {
        setServerError('Add your realty company or office name before continuing.')
        return
      }

      if (!selectedCompany && (!data.officeStreet?.trim() || !data.officeCity?.trim())) {
        setServerError('Set the office street and city for the company-linked path.')
        return
      }
    } else if (!idUrl) {
      setServerError('Upload a valid ID before continuing with independent registration.')
      return
    }

    setLoading(true)
    setServerError(null)

    const result = await registerAccountAction({
      role: resolvedRole,
      fname: data.fname,
      lname: data.lname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      prcNumber: data.prcNumber?.trim() || undefined,
      affiliateCode,
      source,
      campaign,
      isCompanyLinked: data.isCompanyLinked,
      companyId: data.isCompanyLinked ? selectedCompany?.id : undefined,
      companyName: data.isCompanyLinked ? selectedCompany?.companyName ?? data.companyName : undefined,
      officeStreet: data.isCompanyLinked ? data.officeStreet : undefined,
      officeCity: data.isCompanyLinked ? data.officeCity : undefined,
      officeZip: data.isCompanyLinked ? data.officeZip : undefined,
      idUploadUrl: idUrl ?? undefined,
    })

    setLoading(false)

    if (!result.success) {
      setServerError(result.message)
      return
    }

    setOtpEmail(result.email ?? data.email)
  }

  function goToNextStep() {
    setServerError(null)

    if (step === 1 && !selectedRole) {
      setServerError('Choose whether you are registering as a franchise partner or salesperson.')
      return
    }

    const currentIndex = stepOrder.indexOf(step)
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1] ?? step)
    }
  }

  function goToPreviousStep() {
    setServerError(null)
    const currentIndex = stepOrder.indexOf(step)
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1] ?? step)
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingId(true)
    setServerError(null)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadIdAction(formData)
    setUploadingId(false)

    if (result.success && result.url) {
      setIdUrl(result.url)
      return
    }

    setServerError(result.message || 'Failed to upload ID.')
  }

  function handleCompanyNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    companyNameField.onChange(event)
    setServerError(null)
    setCompanySearchError(null)

    const nextValue = event.target.value.trim().toLowerCase()
    if (selectedCompany && nextValue !== selectedCompany.companyName.trim().toLowerCase()) {
      setSelectedCompany(null)
    }
  }

  function handleCompanySelect(company: RegistrationCompanySearchOption) {
    setSelectedCompany(company)
    setCompanyMatches([])
    setCompanySearchError(null)
    setServerError(null)
    setValue('companyName', company.companyName, { shouldDirty: true, shouldValidate: true })

    // Force role to salesperson if joining an existing franchise
    if (selectedRole === 'franchise') {
      setValue('role', 'salesperson', { shouldDirty: true, shouldValidate: true })
      setRoleSwitchNotice(true)
    }

    if (!formValues.officeStreet?.trim() && company.street) {
      setValue('officeStreet', company.street, { shouldDirty: true, shouldValidate: true })
    }

    if (!formValues.officeCity?.trim() && company.city) {
      setValue('officeCity', company.city, { shouldDirty: true, shouldValidate: true })
    }

    if (!formValues.officeZip?.trim() && company.zipCode) {
      setValue('officeZip', company.zipCode, { shouldDirty: true, shouldValidate: true })
    }
  }

  if (otpEmail) {
    return <OtpVerifyStep email={otpEmail} />
  }

  return (
    <div className="w-full max-w-[560px]">
      <div className="rounded-xl border-t-[3px] border-[#f59e0b] bg-white px-8 py-9 shadow-[0_4px_6px_rgba(12,31,74,0.04),0_10px_40px_rgba(12,31,74,0.10)] ring-1 ring-[#0c1f4a]/[0.05] transition-all duration-300 sm:px-10 sm:py-10">
        <div className="mb-8 flex justify-center gap-2">
          {stepOrder.map((visibleStep, index) => (
            <div
              key={visibleStep}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeStepIndex ? 'w-8 bg-[#f59e0b]' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {affiliateCode ? (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Referral link detected for <span className="font-black uppercase">{affiliateCode}</span>.
          </div>
        ) : null}

        {serverError ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {step === 1 ? (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-[#0c1f4a]">Select Your Role</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Choose the registration path that matches your account.
                </p>
              </div>

              <div className="grid gap-4">
                <div
                  onClick={() => setValue('role', 'franchise', { shouldValidate: true })}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    selectedRole === 'franchise'
                      ? 'border-[#f59e0b] bg-amber-50/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${
                        selectedRole === 'franchise' ? 'bg-[#f59e0b] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Franchise Partner</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Open or manage a branch office and build your team under HomesPH.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setValue('role', 'salesperson', { shouldValidate: true })}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    selectedRole === 'salesperson'
                      ? 'border-[#f59e0b] bg-amber-50/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${
                        selectedRole === 'salesperson' ? 'bg-[#f59e0b] text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <BadgeCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Salesperson</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Join a realty company or register independently under the HomesPH network.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!selectedRole}
                  className="w-full rounded-xl bg-[#0c1f4a] py-3.5 font-bold text-white transition-colors hover:bg-[#163880] disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="mb-6 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f59e0b]">{roleLabel}</p>
                <h2 className="mt-2 text-2xl font-black text-[#0c1f4a]">Company Check</h2>
                <p className="mt-2 text-sm text-gray-500">Are you part of a realty company or office already?</p>

                {initialRole ? (
                  <div className="mt-3">
                    <Link
                      href={`/registration/${initialRole === 'franchise' ? 'salesperson' : 'franchise'}`}
                      className="text-[11px] font-bold text-blue-600 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-400"
                    >
                      Not a {roleLabel}? Register as a {initialRole === 'franchise' ? 'Salesperson' : 'Franchise Partner'}{' '}
                      instead.
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                <div
                  onClick={() => setValue('isCompanyLinked', true, { shouldValidate: true })}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    formValues.isCompanyLinked
                      ? 'border-[#0c1f4a] bg-blue-50/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900">Yes, I am part of a realty company</p>
                      <p className="mt-1 text-sm text-gray-500">
                        We will ask for the company or office name and the office address.
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        formValues.isCompanyLinked ? 'border-[#0c1f4a] bg-[#0c1f4a]' : 'border-gray-300'
                      }`}
                    >
                      {formValues.isCompanyLinked ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setValue('isCompanyLinked', false, { shouldValidate: true })}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    formValues.isCompanyLinked === false
                      ? 'border-[#0c1f4a] bg-blue-50/50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900">No, I am registering independently</p>
                      <p className="mt-1 text-sm text-gray-500">
                        You will continue with identity details and review under the HomesPH umbrella.
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        formValues.isCompanyLinked === false ? 'border-[#0c1f4a] bg-[#0c1f4a]' : 'border-gray-300'
                      }`}
                    >
                      {formValues.isCompanyLinked === false ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="w-1/3 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-2/3 rounded-xl bg-[#0c1f4a] py-3.5 font-bold text-white transition-colors hover:bg-[#163880]"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="animate-in slide-in-from-right-4 fade-in space-y-4 duration-300">
              <div className="mb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="text-gray-400 transition-colors hover:text-[#0c1f4a]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-black text-[#0c1f4a]">Complete Registration</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {roleLabel} · {formValues.isCompanyLinked ? 'Company-linked path' : 'Independent path'}
                  </p>
                  {initialRole ? (
                    <div className="mt-1">
                      <Link
                        href={`/registration/${initialRole === 'franchise' ? 'salesperson' : 'franchise'}`}
                        className="text-[10px] font-bold text-blue-600 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-800 hover:decoration-blue-400"
                      >
                        Not a {roleLabel}? Register as a {initialRole === 'franchise' ? 'Salesperson' : 'Franchise Partner'}{' '}
                        instead.
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              {formValues.isCompanyLinked ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <h3 className="text-sm font-black text-[#0c1f4a]">Realty Company / Office</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Search and select an existing franchise to route the application directly to that company. If your
                    office is not listed yet, keep typing and we will create a new company record from the address
                    details below.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">
                        Search Franchise / Company
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <Building2 size={14} />
                        </span>
                        <input
                          name={companyNameField.name}
                          onBlur={companyNameField.onBlur}
                          onChange={handleCompanyNameChange}
                          placeholder="Type Worknook, HomesPH Cebu, or another franchise"
                          ref={companyNameField.ref}
                          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-[13px]"
                        />
                      </div>

                      {roleSwitchNotice && selectedCompany ? (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-800">
                          <div className="flex gap-2">
                            <AlertCircle size={14} className="mt-0.5 shrink-0 text-blue-600" />
                            <p className="leading-relaxed">
                              <strong>Note:</strong> You are joining an existing franchise. Your role has been adjusted
                              to <strong>Salesperson</strong>. Franchise Partner registration is only for creating new
                              offices.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {selectedCompany ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                          <p className="font-bold uppercase tracking-[0.14em] text-emerald-700">Linked Franchise</p>
                          <p className="mt-1 text-sm font-semibold text-emerald-950">{selectedCompany.companyName}</p>
                          <p className="mt-1 leading-relaxed">
                            {selectedCompany.fullAddress ||
                              [selectedCompany.street, selectedCompany.city, selectedCompany.zipCode]
                                .filter(Boolean)
                                .join(', ') ||
                              'No office address is saved yet. You can add one below for review.'}
                          </p>
                          <p className="mt-2 text-[11px] font-medium text-emerald-700">
                            New applications from this form will appear under this franchise.
                          </p>
                        </div>
                      ) : null}

                      {showCompanyMatches && companyMatches.length > 0 ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                          {companyMatches.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => handleCompanySelect(company)}
                              className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{company.companyName}</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                  {company.fullAddress ||
                                    [company.street, company.city, company.zipCode].filter(Boolean).join(', ') ||
                                    'No saved office address yet'}
                                </p>
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0c1f4a]">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {showCompanyMatches && companySearchLoading ? (
                        <p className="mt-2 text-xs text-slate-500">Searching existing franchise records...</p>
                      ) : null}

                      {showCompanyMatches && !companySearchLoading && companyMatches.length === 0 && !companySearchError ? (
                        <p className="mt-2 text-xs text-slate-500">
                          No existing franchise matched that search. Continue filling this out to create a new company
                          record.
                        </p>
                      ) : null}

                      {companySearchError ? (
                        <p className="mt-2 text-xs text-rose-600">{companySearchError}</p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">
                        Office Street Address{' '}
                        {selectedCompany ? <span className="normal-case text-gray-400">(optional if already linked)</span> : null}
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <MapPin size={14} />
                        </span>
                        <input
                          {...register('officeStreet')}
                          placeholder="Street, building, barangay"
                          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">
                          Office City {selectedCompany ? <span className="normal-case text-gray-400">(optional)</span> : null}
                        </label>
                        <input
                          {...register('officeCity')}
                          placeholder="e.g. Cebu City"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-gray-500">ZIP Code</label>
                        <input
                          {...register('officeZip')}
                          placeholder="6000"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">First Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={14} />
                    </span>
                    <input
                      {...register('fname')}
                      placeholder="Juan"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                    />
                  </div>
                  {errors.fname ? <p className="mt-1 text-xs text-rose-600">{errors.fname.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Last Name</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={14} />
                    </span>
                    <input
                      {...register('lname')}
                      placeholder="Dela Cruz"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                    />
                  </div>
                  {errors.lname ? <p className="mt-1 text-xs text-rose-600">{errors.lname.message}</p> : null}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Email Address</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={14} />
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                  />
                </div>
                {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Phone Number</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={14} />
                  </span>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="0917 XXX XXXX"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                  />
                </div>
                {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">
                  PRC Number <span className="normal-case font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <BadgeCheck size={14} />
                  </span>
                  <input
                    {...register('prcNumber')}
                    placeholder="0001234"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm font-bold text-gray-700">
                  {formValues.isCompanyLinked ? 'Upload Government ID (Recommended)' : 'Upload Government ID'}
                </p>
                <p className="mb-3 text-xs text-gray-500">
                  {formValues.isCompanyLinked
                    ? 'Attach an ID if you want the review team to verify the account faster.'
                    : 'Independent registration requires a valid ID before review.'}
                </p>

                <input
                  id={`registration-id-upload-${selectedRole ?? 'account'}`}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingId}
                />
                <label
                  htmlFor={`registration-id-upload-${selectedRole ?? 'account'}`}
                  className={`inline-flex cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                    idUrl
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      : 'border-[#f59e0b] text-[#f59e0b] hover:bg-amber-50'
                  } ${uploadingId ? 'cursor-wait opacity-50' : ''}`}
                >
                  {uploadingId ? 'Uploading...' : idUrl ? 'ID Uploaded (Change)' : 'Select File'}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Password</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={14} />
                    </span>
                    <input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-8 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wide text-gray-500">Confirm Password</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={14} />
                    </span>
                    <input
                      {...register('confirm_password')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-3 pl-9 pr-8 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0c1f4a]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirm_password ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.confirm_password.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || uploadingId}
                  className="w-full rounded-xl bg-gradient-to-r from-[#0c1f4a] to-[#163880] py-3.5 font-bold tracking-wide text-white transition-all hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? 'Submitting Application...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  )
}
