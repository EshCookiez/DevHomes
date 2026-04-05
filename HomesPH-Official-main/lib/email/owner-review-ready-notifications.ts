import 'server-only'

import { getMailFromValue, getTransporter } from '@/lib/email/account-review-notifications'

interface OwnerReviewReadyNotificationInput {
  applicantName: string
  officeName: string
  ownerEmail: string
  ownerName?: string | null
  reviewUrl: string
}

interface OwnerReviewReadyNotificationResult {
  sent: boolean
  message?: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmailCopy(input: OwnerReviewReadyNotificationInput) {
  const greetingName = input.ownerName?.trim() || 'there'
  const applicantName = input.applicantName.trim() || 'An applicant'
  const officeName = input.officeName.trim() || 'your office'

  return {
    subject: `Application ready for owner approval: ${applicantName}`,
    text: [
      `Hi ${greetingName},`,
      '',
      `${applicantName} has been reviewed by the secretary and is ready for your final approval in ${officeName}.`,
      '',
      `Review the application here: ${input.reviewUrl}`,
    ].join('\n'),
    html: `
      <p>Hi ${escapeHtml(greetingName)},</p>
      <p><strong>${escapeHtml(applicantName)}</strong> has been reviewed by the secretary and is ready for your final approval in ${escapeHtml(officeName)}.</p>
      <p><a href="${input.reviewUrl}">Open the reviewed application</a></p>
    `,
  }
}

export async function sendOwnerReviewReadyNotification(
  input: OwnerReviewReadyNotificationInput,
): Promise<OwnerReviewReadyNotificationResult> {
  const transporter = getTransporter()

  if (!transporter) {
    return {
      sent: false,
      message: 'Owner notification could not be sent because SMTP is not configured.',
    }
  }

  try {
    const from = getMailFromValue()
    const { subject, text, html } = buildEmailCopy(input)

    await transporter.sendMail({
      from,
      to: input.ownerEmail,
      subject,
      text,
      html,
    })

    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      message: error instanceof Error ? error.message : 'Owner notification failed to send.',
    }
  }
}
