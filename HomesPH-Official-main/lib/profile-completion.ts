import type { ContactInformationRecord, ProfileCompletionStatus, UserProfileRecord } from '@/lib/profile-types'

export function getProfileCompletionStatus(profile: Pick<UserProfileRecord, 'fname' | 'lname' | 'profile_image_url' | 'birthday'>, contact: Pick<ContactInformationRecord, 'primary_mobile'>): ProfileCompletionStatus {
  const missingFields: string[] = []

  if (!profile.fname?.trim()) missingFields.push('First name')
  if (!profile.lname?.trim()) missingFields.push('Last name')
  if (!contact.primary_mobile?.trim()) missingFields.push('Primary mobile')

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  }
}
