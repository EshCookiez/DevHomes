'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resubmitAccountCorrectionAction } from '@/app/account/correction/actions'
import { uploadIdAction } from '@/app/registration/actions'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Phone,
  Upload,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CorrectionResubmissionFormProps {
  correctionNote: string
  currentDocumentName?: string | null
  currentDocumentUrl?: string | null
  email: string
  initialFname: string
  initialLname: string
  initialPhone: string
  initialPrcNumber?: string | null
  role: string
}

function roleRequiresLicenseFields(role: string) {
  return role === 'franchise' || role === 'salesperson'
}

export default function CorrectionResubmissionForm({
  correctionNote,
  currentDocumentName,
  currentDocumentUrl,
  email,
  initialFname,
  initialLname,
  initialPhone,
  initialPrcNumber,
  role,
}: CorrectionResubmissionFormProps) {
  const router = useRouter()
  const requiresLicenseFields = roleRequiresLicenseFields(role)
  const [loading, setLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [idUrl, setIdUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fname: initialFname,
    lname: initialLname,
    phone: initialPhone,
    prcNumber: initialPrcNumber ?? '',
  })

  const effectiveDocumentUrl = idUrl ?? currentDocumentUrl ?? null

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingId(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      const result = await uploadIdAction(uploadFormData)

      if (!result.success || !result.url) {
        setError(result.message || 'Failed to upload the updated ID document.')
        return
      }

      setIdUrl(result.url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload the updated ID document.')
    } finally {
      setUploadingId(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await resubmitAccountCorrectionAction({
        fname: formData.fname,
        lname: formData.lname,
        phone: formData.phone,
        prcNumber: requiresLicenseFields ? formData.prcNumber : undefined,
        idUploadUrl: idUrl,
      })

      if (!result.success) {
        setError(result.message)
        return
      }

      setSuccessMessage(result.message)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to resubmit your correction request.')
    } finally {
      setLoading(false)
    }
  }

  if (successMessage) {
    return (
      <Card className="w-full max-w-lg overflow-hidden border-emerald-100 bg-emerald-50/30 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <CardTitle className="text-emerald-900">Correction Submitted</CardTitle>
          <CardDescription className="text-emerald-700">{successMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Return to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg overflow-hidden border-slate-200 shadow-xl">
      <div className="h-2 bg-[#0c1f4a]" />
      <CardHeader className="space-y-2 pb-8">
        <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Update Your Application</CardTitle>
        <CardDescription className="font-medium text-slate-500">
          Review the correction note below, update your details, and resubmit for secretary review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Correction Note</p>
            <p className="mt-2 text-sm leading-relaxed text-rose-800">{correctionNote}</p>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600">
              <AlertCircle size={14} />
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
            <Input id="email" value={email} readOnly className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fname" className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="fname"
                  name="fname"
                  required
                  value={formData.fname}
                  onChange={handleChange}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lname" className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="lname"
                  name="lname"
                  required
                  value={formData.lname}
                  onChange={handleChange}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-9"
              />
            </div>
          </div>

          {requiresLicenseFields ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="prcNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">PRC Number</Label>
                <div className="relative">
                  <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="prcNumber"
                    name="prcNumber"
                    value={formData.prcNumber}
                    onChange={handleChange}
                    placeholder="0001234"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-9"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                    <Upload size={16} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">Valid ID</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Upload a replacement ID if the secretary asked for a clearer or updated document.
                      </p>
                    </div>

                    {currentDocumentUrl ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-900">{currentDocumentName || 'Current valid ID on file'}</p>
                        <a
                          href={currentDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#0c1f4a] underline-offset-4 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Open current document
                        </a>
                      </div>
                    ) : null}

                    <input
                      id="correction-id-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadingId}
                    />

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="correction-id-upload"
                        className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                          idUrl
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-[#0c1f4a] hover:border-[#0c1f4a]/30'
                        } ${uploadingId ? 'cursor-wait opacity-60' : ''}`}
                      >
                        {uploadingId ? 'Uploading...' : idUrl ? 'Replacement Uploaded' : 'Upload Replacement'}
                      </label>
                      {effectiveDocumentUrl ? (
                        <span className="text-[11px] font-medium text-slate-500">
                          {idUrl ? 'New document ready for submission.' : 'A valid ID is already on file.'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <Button type="submit" disabled={loading || uploadingId} className="mt-2 h-12 w-full rounded-xl bg-[#0c1f4a] text-white hover:bg-[#163880]">
            {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            Resubmit Application
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
