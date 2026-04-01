'use client'

import { useState } from 'react'

interface Props {
  listingId?: number
  projectId?: number
  listingTitle?: string
}

export default function InquiryForm({ listingId, projectId, listingTitle }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg('Name, email and message are required.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          project_id: projectId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Server error')
      }
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="font-semibold text-green-800">Inquiry Sent!</h3>
        <p className="text-sm text-green-700 mt-1">We received your inquiry and will get back to you soon.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-green-700 underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {listingTitle && (
        <p className="text-xs text-gray-500">
          Inquiring about: <span className="font-medium text-gray-700">{listingTitle}</span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30"
            placeholder="Juan dela Cruz"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30"
            placeholder="juan@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30"
          placeholder="+63 912 345 6789"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428ae]/30 resize-none"
          placeholder="I'm interested in this property. Please contact me..."
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-[#1428ae] text-white font-semibold py-2.5 text-sm hover:bg-amber-500 hover:text-[#1428ae] transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
      </button>
    </form>
  )
}
