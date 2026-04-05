'use server'

import { revalidatePath } from 'next/cache'
import { assignLeadAgent, createLead, deleteLead, returnLeadToQueue, updateLead, updateLeadNote, updateLeadStatus } from '@/lib/leads-admin'
import type { LeadInput, LeadRecord, LeadStatus } from '@/lib/leads-types'

interface ActionResult<T = undefined> {
  success: boolean
  message: string
  data?: T
}

function revalidateLeadSurfaces() {
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/franchise/leads')
  revalidatePath('/dashboard/secretary/leads')
  revalidatePath('/dashboard/salesperson/leads')
  revalidatePath('/dashboard/agent/leads')
  revalidatePath('/dashboard/developer/leads')
}

export async function createLeadAction(input: LeadInput): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await createLead(input)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead created successfully.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to create lead.' }
  }
}

export async function updateLeadAction(id: number, input: LeadInput): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await updateLead(id, input)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update lead.' }
  }
}

export async function updateLeadStatusAction(id: number, status: LeadStatus): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await updateLeadStatus(id, status)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead status updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update lead status.' }
  }
}

export async function assignLeadAgentAction(id: number, assignedTo: string): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await assignLeadAgent(id, assignedTo)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead assignment updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to assign agent.' }
  }
}

export async function returnLeadToQueueAction(id: number): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await returnLeadToQueue(id)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead returned to queue.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to return lead to queue.' }
  }
}

export async function updateLeadNoteAction(id: number, notes: string): Promise<ActionResult<LeadRecord>> {
  try {
    const data = await updateLeadNote(id, notes)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead note updated.', data }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to update note.' }
  }
}

export async function deleteLeadAction(id: number): Promise<ActionResult<{ id: number }>> {
  try {
    await deleteLead(id)
    revalidateLeadSurfaces()
    return { success: true, message: 'Lead deleted.', data: { id } }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unable to delete lead.' }
  }
}
