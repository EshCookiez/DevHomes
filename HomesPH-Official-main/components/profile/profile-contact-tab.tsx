'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveContactInformationAction } from '@/app/dashboard/profile/actions'
import type { ContactInformationRecord } from '@/lib/profile-types'
import { useToast } from '@/hooks/use-toast'

export default function ProfileContactTab({
  contact,
  onUpdated,
}: {
  contact: ContactInformationRecord
  onUpdated: (contact: ContactInformationRecord) => void
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    primary_mobile: contact.primary_mobile ?? '',
    secondary_mobile: contact.secondary_mobile ?? '',
    telephone: contact.telephone ?? '',
    email: contact.email ?? '',
    facebook_url: contact.facebook_url ?? '',
    twitter_url: contact.twitter_url ?? '',
    instagram_url: contact.instagram_url ?? '',
    linkedin_url: contact.linkedin_url ?? '',
    website_url: contact.website_url ?? '',
  })

  useEffect(() => {
    setForm({
      primary_mobile: contact.primary_mobile ?? '',
      secondary_mobile: contact.secondary_mobile ?? '',
      telephone: contact.telephone ?? '',
      email: contact.email ?? '',
      facebook_url: contact.facebook_url ?? '',
      twitter_url: contact.twitter_url ?? '',
      instagram_url: contact.instagram_url ?? '',
      linkedin_url: contact.linkedin_url ?? '',
      website_url: contact.website_url ?? '',
    })
  }, [contact])

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function handleSave() {
    if (!form.primary_mobile.trim()) {
      toast({ title: 'Validation error', description: 'Primary mobile is required.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = await saveContactInformationAction(form)
      toast({
        title: result.success ? 'Contact information updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success) {
        onUpdated({ ...contact, ...form })
        router.refresh()
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Manage the primary channels buyers, franchises, and admins use to contact you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['primary_mobile', 'Primary Mobile'],
            ['secondary_mobile', 'Secondary Mobile'],
            ['telephone', 'Telephone'],
            ['email', 'Email'],
            ['facebook_url', 'Facebook'],
            ['twitter_url', 'Twitter / X'],
            ['instagram_url', 'Instagram'],
            ['linkedin_url', 'LinkedIn'],
            ['website_url', 'Website'],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} value={form[key as keyof typeof form]} onChange={(event) => setField(key as keyof typeof form, event.target.value)} className="h-11" />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
            <Save size={15} />
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
