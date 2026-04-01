'use client'

import { useState, useTransition } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
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
import { createUserAction } from '@/app/dashboard/users/actions'
import { useToast } from '@/hooks/use-toast'
import type { CreateManagedUserInput, ManagedUserRecord, UserRoleRecord } from '@/lib/users-types'

const INITIAL_FORM: CreateManagedUserInput = {
  email: '',
  password: '',
  role: '',
  fname: '',
  mname: '',
  lname: '',
  gender: '',
  birthday: '',
}

export default function UserCreateModal({
  roles,
  onCreated,
}: {
  roles: UserRoleRecord[]
  onCreated: (user: ManagedUserRecord) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateManagedUserInput>(INITIAL_FORM)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setForm(INITIAL_FORM)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createUserAction(form)

      if (!result.success || !result.data) {
        toast({ title: 'Create failed', description: result.message, variant: 'destructive' })
        return
      }

      onCreated(result.data)
      toast({ title: 'User created', description: result.message })
      setOpen(false)
      reset()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
        <UserPlus size={15} />
        Add New User
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}>
        <DialogContent className="max-w-2xl rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new platform account and assign the initial role profile.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(event) => setForm(current => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(event) => setForm(current => ({ ...current, password: event.target.value }))} placeholder="Minimum 8 characters" />
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

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}