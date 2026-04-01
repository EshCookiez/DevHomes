'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { KeyRound, Mail, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction, sendResetPasswordAction } from '@/app/dashboard/profile/actions'
import { useToast } from '@/hooks/use-toast'

export default function ProfileSecurityTab({ email, lastLoginAt }: { email: string; lastLoginAt: string | null }) {
  const { toast } = useToast()
  const [isSaving, startSave] = useTransition()
  const [isResetting, startReset] = useTransition()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handlePasswordChange() {
    if (!password || password.length < 8) {
      toast({ title: 'Validation error', description: 'Password must be at least 8 characters.', variant: 'destructive' })
      return
    }

    if (password !== confirmPassword) {
      toast({ title: 'Validation error', description: 'Passwords do not match.', variant: 'destructive' })
      return
    }

    startSave(async () => {
      const result = await changePasswordAction(password)
      toast({
        title: result.success ? 'Password updated' : 'Change failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
      if (result.success) {
        setPassword('')
        setConfirmPassword('')
      }
    })
  }

  function handleResetEmail() {
    startReset(async () => {
      const result = await sendResetPasswordAction(email)
      toast({
        title: result.success ? 'Reset email sent' : 'Reset failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      })
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound size={16} /> Change Password</CardTitle>
          <CardDescription>Update your password for account security. Use at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input id="new_password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input id="confirm_password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handlePasswordChange} disabled={isSaving} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Save size={15} />
              {isSaving ? 'Saving...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck size={16} /> Security Overview</CardTitle>
          <CardDescription>Review account activity and send yourself a password reset email if needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Last Login</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {lastLoginAt ? format(new Date(lastLoginAt), 'PPP p') : 'No recent login data'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Recovery Email</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{email}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetEmail} disabled={isResetting} className="rounded-xl">
              <Mail size={15} />
              {isResetting ? 'Sending...' : 'Reset Password'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
