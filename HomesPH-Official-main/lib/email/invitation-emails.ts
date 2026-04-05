import 'server-only'
import { getMailFromValue, getTransporter } from './account-review-notifications'

interface InvitationEmailInput {
  email: string
  companyName: string
  inviterName: string
  inviteUrl: string
  role: string
}

export async function sendFranchiseInvitationEmail(input: InvitationEmailInput) {
  const transporter = getTransporter()

  if (!transporter) {
    console.error('SMTP not configured - could not send invitation email')
    return { sent: false, message: 'SMTP not configured' }
  }

  const roleLabel = input.role.replace(/_/g, ' ')
  const from = getMailFromValue()

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0c1f4a; margin-bottom: 10px;">HomesPH</h1>
        <p style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">Franchise Partnership</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">You're Invited!</h2>
        <p>Hi there,</p>
        <p><strong>${input.inviterName}</strong> from <strong>${input.companyName}</strong> has invited you to join their team on <strong>HomesPH</strong> as a <strong>${roleLabel}</strong>.</p>
        
        <p style="margin-top: 25px; margin-bottom: 25px; text-align: center;">
          <a href="${input.inviteUrl}" style="background-color: #0c1f4a; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Accept Invitation & Register
          </a>
        </p>

        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
          If the button doesn't work, copy and paste this URL into your browser: <br/>
          <span style="color: #0c1f4a; word-break: break-all;">${input.inviteUrl}</span>
        </p>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p>This invitation was sent from your franchise office via HomesPH Operations Hub.</p>
        <p>&copy; ${new Date().getFullYear()} HomesPH. All rights reserved.</p>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from,
      to: input.email,
      subject: `Invitation to join ${input.companyName} on HomesPH`,
      text: `Hi! ${input.inviterName} has invited you to join ${input.companyName} as a ${roleLabel}. Register here: ${input.inviteUrl}`,
      html: html,
    })
    return { sent: true }
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    return {
      sent: false,
      message: error instanceof Error ? error.message : 'Failed to send invitation email.',
    }
  }
}
