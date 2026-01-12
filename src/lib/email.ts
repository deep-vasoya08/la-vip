import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL
const SENDGRID_CC_EMAIL = process.env.SENDGRID_CC_EMAIL
// const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !SENDGRID_CC_EMAIL) {
  console.warn(
    'SendGrid is not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables.',
  )
} else {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

interface SendPasswordResetEmailParams {
  to: string
  subject: string
  html: string
}

interface SendDynamicTemplateEmailParams {
  to: string
  templateId: string
  dynamicTemplateData?: Record<string, unknown>
  subject?: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendPasswordResetEmailParams): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.error('SendGrid not configured. Cannot send password reset email.')
    throw new Error('SendGrid service is not configured.')
  }

  const msg = {
    to,
    from: SENDGRID_FROM_EMAIL, // Use the verified SendGrid sender
    cc: SENDGRID_CC_EMAIL,
    subject,
    html,
  }

  try {
    await sgMail.send(msg)
    console.log(`Email sent to ${to} via SendGrid`)
  } catch (error) {
    console.error('Error sending email via SendGrid:', error)
    if (error instanceof Error) {
      console.error(error.message)
    }
    throw new Error('Could not send password reset email via SendGrid.')
  }
}

export async function sendDynamicTemplateEmail({
  to,
  from,
  templateId,
  dynamicTemplateData = {},
  subject,
}: SendDynamicTemplateEmailParams): Promise<void> {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.error('SendGrid not configured. Cannot send dynamic template email.')
    throw new Error('SendGrid service is not configured.')
  }

  const msg = {
    to,
    from: from ?? process.env.SENDGRID_BOOKING_FROM_EMAIL ?? 'bookings@laviptours.com',
    cc:
      dynamicTemplateData.emailType === 'user_registration' ||
      dynamicTemplateData.emailType === 'password_reset'
        ? undefined
        : SENDGRID_CC_EMAIL,
    bcc:
      dynamicTemplateData.emailType === 'user_registration' ||
      dynamicTemplateData.emailType === 'password_reset'
        ? SENDGRID_CC_EMAIL
        : undefined,
    templateId,
    dynamicTemplateData,
    ...(subject && { subject }), // Include subject only if provided
  }

  try {
    await sgMail.send(msg)
    console.log(`Dynamic template email sent to ${to} via SendGrid using template ${templateId}`)
  } catch (error) {
    console.error('Error sending dynamic template email via SendGrid:', error)
    if (error instanceof Error) {
      console.error(error.message)
    }
    throw new Error('Could not send dynamic template email via SendGrid.')
  }
}
