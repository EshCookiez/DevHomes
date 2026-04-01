'use server'

import { sendPasswordReset } from '@/lib/profile'

export interface ForgotPasswordFormState {
  success: boolean
  message: string | null
}

export async function forgotPasswordAction(_: ForgotPasswordFormState, formData: FormData): Promise<ForgotPasswordFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return { success: false, message: 'Email address is required.' }
  }

  try {
    await sendPasswordReset(email)
    return { success: true, message: 'Password reset email sent. Please check your inbox.' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to send reset email.',
    }
  }
}