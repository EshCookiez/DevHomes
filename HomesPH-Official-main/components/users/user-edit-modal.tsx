'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserAction } from '@/app/dashboard/users/actions'
import { useToast } from '@/hooks/use-toast'
import type { ManagedUserProfileInput, ManagedUserRecord, UserRoleRecord } from '@/lib/users-types'

function buildForm(user: ManagedUserRecord): ManagedUserProfileInput {
  return {
    fname: user.fname ?? '',
    mname: user.mname ?? '',
    lname: user.lname ?? '',
    gender: user.gender ?? '',
    birthday: user.birthday ?? '',
    role: user.role ?? '',
  }
}

export default function UserEditModal({
  open,
  onOpenChange,
  user,
  roles,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUserRecord | null
  roles: UserRoleRecord[]
  onSaved: (user: ManagedUserRecord) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<ManagedUserProfileInput>({
    fname: '',
    mname: '',
    lname: '',
    gender: '',
    birthday: '',
    role: '',
  })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (user) {
      setForm(buildForm(user))
    }
  }, [user])

  function handleSave() {
    if (!user) return

    startTransition(async () => {
      const result = await updateUserAction(user.id, form)

      if (!result.success || !result.data) {
        toast({ title: 'Update failed', description: result.message, variant: 'destructive' })
        return
      }

      onSaved(result.data)
      toast({ title: 'User updated', description: result.message })
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update personal details, birthday, and assigned role.</DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Profile Image</Label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {user.profile_image_url ? 'Profile image available' : 'No profile image uploaded'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={form.fname} onChange={(event) => setForm(current => ({ ...current, fname: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.lname} onChange={(event) => setForm(current => ({ ...current, lname: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              <Input value={form.mname} onChange={(event) => setForm(current => ({ ...current, mname: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(value) => setForm(current => ({ ...current, gender: value }))}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Input type="date" value={form.birthday} onChange={(event) => setForm(current => ({ ...current, birthday: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value) => setForm(current => ({ ...current, role: value }))}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.role_name}>{role.role_name.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSave} disabled={isPending || !user}>
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}