'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBasicProfileAction } from '@/app/dashboard/profile/actions'
import type { UserProfileRecord } from '@/lib/profile-types'
import { useToast } from '@/hooks/use-toast'

export default function ProfileBasicTab({
  profile,
  onUpdated,
}: {
  profile: UserProfileRecord
  onUpdated: (profile: Partial<UserProfileRecord>) => void
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fname, setFname] = useState(profile.fname ?? '')
  const [mname, setMname] = useState(profile.mname ?? '')
  const [lname, setLname] = useState(profile.lname ?? '')

  useEffect(() => {
    setFname(profile.fname ?? '')
    setMname(profile.mname ?? '')
    setLname(profile.lname ?? '')
  }, [profile])

  const fullName = useMemo(() => [fname.trim(), lname.trim()].filter(Boolean).join(' '), [fname, lname])

  function handleSave() {
    if (!fname.trim() || !lname.trim()) {
      toast({ title: 'Validation error', description: 'First and last name are required.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      const result = await saveBasicProfileAction({ fname, mname, lname })
      toast({
        title: result.success ? 'Profile updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success) {
        onUpdated({ fname, mname, lname, full_name: fullName })
        router.refresh()
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Keep your public identity accurate across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fname">First Name</Label>
            <Input id="fname" value={fname} onChange={(event) => setFname(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mname">Middle Name</Label>
            <Input id="mname" value={mname} onChange={(event) => setMname(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lname">Last Name</Label>
            <Input id="lname" value={lname} onChange={(event) => setLname(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" value={fullName} readOnly className="bg-slate-50" />
          </div>
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
