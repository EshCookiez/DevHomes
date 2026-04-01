'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { savePersonalProfileAction } from '@/app/dashboard/profile/actions'
import type { UserProfileRecord } from '@/lib/profile-types'
import { useToast } from '@/hooks/use-toast'

const GENDERS = ['Male', 'Female', 'Prefer not to say']

export default function ProfilePersonalTab({
  profile,
  onUpdated,
}: {
  profile: UserProfileRecord
  onUpdated: (profile: Partial<UserProfileRecord>) => void
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [gender, setGender] = useState(profile.gender ?? '')
  const [birthday, setBirthday] = useState<Date | undefined>(profile.birthday ? new Date(profile.birthday) : undefined)

  useEffect(() => {
    setGender(profile.gender ?? '')
    setBirthday(profile.birthday ? new Date(profile.birthday) : undefined)
  }, [profile])

  function handleSave() {
    startTransition(async () => {
      const result = await savePersonalProfileAction({
        gender,
        birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
      })

      toast({
        title: result.success ? 'Personal details updated' : 'Save failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })

      if (result.success) {
        onUpdated({ gender, birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null })
        router.refresh()
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
        <CardDescription>Use accurate demographic information for compliance and verification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map(item => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Birthday</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-11 w-full justify-between rounded-xl font-normal', !birthday && 'text-slate-400')}>
                  {birthday ? format(birthday, 'PPP') : 'Select birthday'}
                  <CalendarIcon size={16} className="text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={birthday} onSelect={setBirthday} captionLayout="dropdown" fromYear={1940} toYear={new Date().getFullYear()} />
              </PopoverContent>
            </Popover>
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
