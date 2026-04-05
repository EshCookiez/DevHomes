import 'server-only'

import { getMailFromValue, getTransporter } from '@/lib/email/account-review-notifications'

interface CorrectionRequestNotificationInput {
  correctionNote: string
  correctionUrl: string
  email: string
  fullName: string
}

interface CorrectionRequestNotificationResult {
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

function buildCorrectionRequestCopy(input: CorrectionRequestNotificationInput) {
  const greetingName = input.fullName.trim() || 'there'
  const safeGreetingName = escapeHtml(greetingName)
  const safeCorrectionNote = escapeHtml(input.correctionNote)

  return {
    subject: 'Action needed: update your HomesPH application',
    text: [
      `Hi ${greetingName},`,
      '',
      'Your HomesPH application needs a few corrections before it can move forward.',
      '',
      `Correction note: ${input.correctionNote}`,
      '',
      `Open your correction page here: ${input.correctionUrl}`,
      '',
      'After you resubmit the requested details, the franchise office will review your application again.',
    ].join('\n'),
    html: `
      <p>Hi ${safeGreetingName},</p>
      <p>Your HomesPH application needs a few corrections before it can move forward.</p>
      <p><strong>Correction note:</strong> ${safeCorrectionNote}</p>
      <p><a href="${input.correctionUrl}">Open your correction page</a></p>
      <p>After you resubmit the requested details, the franchise office will review your application again.</p>
    `,
  }
}

export async function sendCorrectionRequestNotification(
  input: CorrectionRequestNotificationInput,
): Promise<CorrectionRequestNotificationResult> {
  const transporter = getTransporter()

  if (!transporter) {
    return {
      sent: false,
      message: 'Correction request was saved, but SMTP is not configured for outbound mail.',
    }
  }

  try {
    const from = getMailFromValue()
    const { subject, text, html } = buildCorrectionRequestCopy(input)

    await transporter.sendMail({
      from,
      to: input.email,
      subject,
      text,
      html,
    })

    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      message: error instanceof Error ? error.message : 'Correction request email failed to send.',
    }
  }
}
