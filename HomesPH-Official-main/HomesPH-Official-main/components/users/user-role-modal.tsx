'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { changeUserRoleAction } from '@/app/dashboard/users/actions'
import { useToast } from '@/hooks/use-toast'
import type { ManagedUserRecord, UserRoleRecord } from '@/lib/users-types'

export default function UserRoleModal({
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
  const [role, setRole] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRole(user?.role ?? '')
  }, [user])

  function handleSave() {
    if (!user) return

    startTransition(async () => {
      const result = await changeUserRoleAction(user.id, role)

      if (!result.success || !result.data) {
        toast({ title: 'Role update failed', description: result.message, variant: 'destructive' })
        return
      }

      onSaved(result.data)
      toast({ title: 'Role updated', description: result.message })
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl border-slate-200">
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>Assign a different dashboard role for this user account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {roles.map((item) => (
                <SelectItem key={item.id} value={item.role_name}>{item.role_name.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]" disabled={isPending || !role} onClick={handleSave}>
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}