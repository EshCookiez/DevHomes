'use server'

import { revalidatePath } from 'next/cache'
import { deleteInquiry, replyToInquiry, updateInquiryStatus } from '@/lib/inquiries-admin'
import type { InquiryRecord, InquiryStatus } from '@/lib/inquiries-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateInquirySurfaces() {
  revalidatePath('/dashboard/inquiries')
  revalidatePath('/dashboard/buyer/inquiries')
  revalidatePath('/dashboard/developer/inquiries')
}

export async function updateInquiryStatusAction(id: number, status: InquiryStatus): Promise<ActionResult<InquiryRecord>> {
  try {
    const data = await updateInquiryStatus(id, status)
    revalidateInquirySurfaces()
    return { success: true, message: 'Inquiry updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update inquiry.' }
  }
}

export async function replyToInquiryAction(id: number, message: string): Promise<ActionResult<InquiryRecord>> {
  try {
    const data = await replyToInquiry(id, message)
    revalidateInquirySurfaces()
    return { success: true, message: 'Reply sent.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to send reply.' }
  }
}

export async function deleteInquiryAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteInquiry(id)
    revalidateInquirySurfaces()
    return { success: true, message: 'Inquiry deleted.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete inquiry.' }
  }
}