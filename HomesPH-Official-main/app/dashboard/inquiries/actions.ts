'use server'

import { revalidatePath } from 'next/cache'
import { assignInquiryAgent, deleteInquiry, replyToInquiry, returnInquiryToQueue, updateInquiryStatus } from '@/lib/inquiries-admin'
import type { InquiryRecord, InquiryStatus } from '@/lib/inquiries-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateInquirySurfaces() {
  revalidatePath('/dashboard/inquiries')
  revalidatePath('/dashboard/franchise/inquiries')
  revalidatePath('/dashboard/secretary/inquiries')
  revalidatePath('/dashboard/buyer/inquiries')
  revalidatePath('/dashboard/salesperson/inquiries')
  revalidatePath('/dashboard/agent/inquiries')
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

export async function assignInquiryAgentAction(id: number, assignedTo: string): Promise<ActionResult<InquiryRecord>> {
  try {
    const data = await assignInquiryAgent(id, assignedTo)
    revalidateInquirySurfaces()
    return { success: true, message: 'Inquiry assignment updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to assign inquiry.' }
  }
}

export async function returnInquiryToQueueAction(id: number): Promise<ActionResult<InquiryRecord>> {
  try {
    const data = await returnInquiryToQueue(id)
    revalidateInquirySurfaces()
    return { success: true, message: 'Inquiry returned to queue.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to return inquiry to queue.' }
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
