import 'server-only'

import nodemailer from 'nodemailer'

interface AccountReviewNotificationInput {
  email: string
  fullName: string
  decision: 'approved' | 'rejected'
  prcStatusNote?: string | null
  rejectionReason?: string | null
}

interface AccountReviewNotificationResult {
  sent: boolean
  message?: string
}

let cachedTransporter: nodemailer.Transporter | null | undefined

export function getMailFromValue() {
  const address =
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    process.env.MAIL_FROM_ADDRESS ||
    process.env.SMTP_USER ||
    process.env.MAIL_USERNAME ||
    'no-reply@homes.ph'
  const fromName = process.env.MAIL_FROM_NAME || 'HomesPH'

  if (address.includes('<') || !fromName.trim()) {
    return address
  }

  return `"${fromName}" <${address}>`
}

export function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter
  }

  const host = process.env.SMTP_HOST || process.env.MAIL_HOST
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || '587')
  const user = process.env.SMTP_USER || process.env.MAIL_USERNAME
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD

  if (!host || !user || !pass || !Number.isFinite(port)) {
    cachedTransporter = null
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

function buildEmailCopy(input: AccountReviewNotificationInput) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const loginUrl = `${siteUrl.replace(/\/$/, '')}/login`
  const greetingName = input.fullName.trim() || 'there'

  if (input.decision === 'approved') {
    const prcStatusNote = input.prcStatusNote?.trim()
    return {
      subject: 'Your HomesPH account has been approved',
      text: [
        `Hi ${greetingName},`,
        '',
        'Your HomesPH account has been approved. You can now sign in to your dashboard.',
        prcStatusNote || null,
        '',
        `Sign in here: ${loginUrl}`,
      ].join('\n'),
      html: `
        <p>Hi ${greetingName},</p>
        <p>Your HomesPH account has been approved. You can now sign in to your dashboard.</p>
        ${prcStatusNote ? `<p>${prcStatusNote}</p>` : ''}
        <p><a href="${loginUrl}">Sign in to HomesPH</a></p>
      `,
    }
  }

  const rejectionNote = input.rejectionReason?.trim()

  return {
    subject: 'Your HomesPH registration was not approved',
    text: [
      `Hi ${greetingName},`,
      '',
      'Your HomesPH registration was not approved at this time.',
      rejectionNote ? `Reason: ${rejectionNote}` : null,
      '',
      'If you need more information, please contact the HomesPH support team.',
    ].filter(Boolean).join('\n'),
    html: `
      <p>Hi ${greetingName},</p>
      <p>Your HomesPH registration was not approved at this time.</p>
      ${rejectionNote ? `<p><strong>Reason:</strong> ${rejectionNote}</p>` : ''}
      <p>If you need more information, please contact the HomesPH support team.</p>
    `,
  }
}

export async function sendAccountReviewNotification(
  input: AccountReviewNotificationInput,
): Promise<AccountReviewNotificationResult> {
  const transporter = getTransporter()

  if (!transporter) {
    return {
      sent: false,
      message: 'Email notification could not be sent because SMTP is not configured.',
    }
  }

  try {
    const from = getMailFromValue()
    const { subject, text, html } = buildEmailCopy(input)

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
      message: error instanceof Error ? error.message : 'Email notification failed to send.',
    }
  }
}
