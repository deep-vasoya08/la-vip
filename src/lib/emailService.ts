import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendEmail, sendDynamicTemplateEmail } from './email'
import { formatDateTime } from '@/utilities/formatDateTime'
import { formatPhoneForEmail } from '@/utilities/textFormatting'

// SendGrid Template ID Configuration
const EMAIL_TEMPLATES = {
  USER_REGISTRATION: 'd-efb1a1bfbee34bc9820a377e4c6f82f7', // Welcome email template
  PASSWORD_RESET: 'd-3be600d7a4264cfd80428ec3ecdb1892', // Password reset template

  BOOKING_CONFIRMATION: 'd-cbfe9f23fe414ebeb7c0d16def4336dd', // Main booking template
  TOUR_BOOKING_CONFIRMATION: 'd-de8506a29e3e41068dd26e0820cc9b3d', // Tour booking template

  EVENT_BOOKING_CANCELLATION: 'd-9f9091669d2f4f359f199f82b8128484', // Event booking template
  TOUR_BOOKING_CANCELLATION: 'd-25b84f011b024efcb8159b42f01a4ac6', // Tour booking template

  EVENT_REFUND: 'd-ceb3aec2699244af9d7795506efbe061', // Event refund template
  TOUR_REFUND: 'd-a500d55992004a18afb672c808c75fbe', // Tour refund template

  EVENT_PENDING_PAYMENT: 'd-10bb7f6073dc4854a9546ad7f300a118', // Event pending payment template (replace with actual SendGrid template ID)
  TOUR_PENDING_PAYMENT: 'd-tour-pending-payment-template-id', // Tour pending payment template (replace with actual SendGrid template ID)
} as const

// Email types for logging
export type EmailType =
  | 'tour_booking_confirmation'
  | 'event_booking_confirmation'
  | 'event_booking_cancellation'
  | 'tour_booking_cancellation'
  | 'event_refund'
  | 'tour_refund'
  | 'event_pending_payment'
  | 'tour_pending_payment'
  | 'password_reset'
  | 'user_registration'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'test_email'
  | 'admin_copy'
  | 'resend_email'
  | 'other'

// Interface for logging email
interface EmailLogData {
  sentTo: string
  sentFrom?: string
  subject: string
  emailType: EmailType
  templateId?: string
  templateData?: Record<string, any>
  status: 'sent' | 'failed' | 'pending'
  errorMessage?: string
  userId?: string | number
  bookingReference?: string
  metadata?: Record<string, any>
}

// Interface for basic email
interface BasicEmailParams {
  to: string
  subject: string
  html: string
  emailType: EmailType
  customerPhoneNumber?: string
  userId?: string | number
  bookingReference?: string
  metadata?: Record<string, any>
}

// Interface for dynamic template email
interface DynamicEmailParams {
  to: string
  from?: string
  templateId: string
  templateData: Record<string, any>
  emailType: EmailType
  customerPhoneNumber?: string
  userId?: string | number
  bookingReference?: string
  metadata?: Record<string, any>
}

// Interface for booking confirmation email
interface BookingEmailData {
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingType: 'tour' | 'event'
  bookingId: string
  bookingDetails: {
    // id: string
    description?: string
    name: string
    date: string
    eventLocation?: string
    totalAmount: string
    pickupLocation?: string
    pickupTime?: string
    totalGuests?: number
    scheduleNotes?: string
  }
  userId?: string | number
}

/**
 * Log email activity to the database
 */
async function logEmail(logData: EmailLogData): Promise<void> {
  try {
    const payload = await getPayload({ config })

    await payload.create({
      collection: 'email-logs',
      data: {
        sentTo: logData.sentTo,
        sentFrom: logData.sentFrom || process.env.SENDGRID_FROM_EMAIL,
        subject: logData.subject,
        emailType: logData.emailType,
        templateId: logData.templateId,
        templateData: logData.templateData,
        status: logData.status,
        errorMessage: logData.errorMessage,
        user: logData.userId ? Number(logData.userId) : undefined,
        bookingReference: logData.bookingReference,
        metadata: logData.metadata,
      },
    })
  } catch (error) {
    console.error('Failed to log email:', error)
    // Don't throw error here to avoid breaking email flow
  }
}

/**
 * Send basic HTML email with logging
 */
export async function sendBasicEmail(
  params: BasicEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    // Log successful email
    await logEmail({
      sentTo: params.to,
      subject: params.subject,
      emailType: params.emailType,
      status: 'sent',
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: params.metadata,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log failed email
    await logEmail({
      sentTo: params.to,
      subject: params.subject,
      emailType: params.emailType,
      status: 'failed',
      errorMessage,
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: params.metadata,
    })

    console.error('Failed to send basic email:', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send dynamic template email with logging
 */
export async function sendDynamicEmail(
  params: DynamicEmailParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendDynamicTemplateEmail({
      to: params.to,
      from: params.from,
      subject: params.templateData.subject,
      templateId: params.templateId,
      dynamicTemplateData: {
        ...params.templateData,
        emailType: params.emailType,
        customerPhoneNumber: formatPhoneForEmail(params.templateData.customerPhoneNumber),
        customerName: `${params.templateData.customerName} ${params.templateData.customerPhoneNumber ? `(Phone No. ${formatPhoneForEmail(params.templateData.customerPhoneNumber)})` : '(Phone No. N/A)'}`,

        // Company information
        company: 'LA VIP Tours & Charters',

        // Contact information
        contactPhone: '1-800-438-1814',
        contactEmail: 'info@laviptours.com',
        website: process.env.NEXT_PUBLIC_SERVER_URL,
        websiteUrl: process.env.NEXT_PUBLIC_SERVER_URL,

        // Dashboard information
        dashboardUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account`,

        // Social Media information
        instagramUrl: 'https://www.instagram.com/laviptours/',
        facebookUrl: 'https://www.facebook.com/laviptours/',
        tripadvisorUrl:
          'https://www.tripadvisor.com/Attraction_Review-g32655-d1101383-Reviews-LA_VIP_Tours-Los_Angeles_California.html',
        yelpUrl: 'https://www.yelp.com/biz/la-vip-tours-los-angeles',
        linkedinUrl: 'https://www.linkedin.com/company/laviptours/',

        instagramIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-instagram.svg',
        facebookIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-facebook.svg',
        tripadvisorIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-tripadvisor.svg',
        yelpIconUrl: 'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-yelp.svg',

        privacyPolicyUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/privacy-policy`,
        termsOfServiceUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/terms-and-conditions`,
        cancellationPolicyUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/cancellation-policy`,
      },
    })

    // Log successful email
    await logEmail({
      sentTo: params.to,
      sentFrom:
        params.emailType === 'user_registration'
          ? process.env.SENDGRID_FROM_EMAIL || 'info@laviptours.com'
          : process.env.SENDGRID_BOOKING_FROM_EMAIL || 'bookings@laviptours.com',
      subject: params.templateData.subject || 'Email from LA VIP Tours',
      emailType: params.emailType,
      templateId: params.templateId,
      templateData: params.templateData,
      status: 'sent',
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: params.metadata,
    })

    // here write condition user_registration or password_reset mail copy do not send to admin
    if (params.emailType === 'user_registration' || params.emailType === 'password_reset') {
      return { success: true }
    }

    // i need also send a copy of the email to the admin
    await sendDynamicTemplateEmail({
      to: process.env.SENDGRID_BOOKING_FROM_EMAIL || 'bookings@laviptours.com',
      from: process.env.SENDGRID_BOOKING_FROM_EMAIL || 'bookings@laviptours.com',
      templateId: params.templateId,
      subject: params.templateData.subject || 'Email from LA VIP Tours Admin Copy',
      dynamicTemplateData: {
        ...params.templateData,
        customerPhoneNumber: formatPhoneForEmail(params.templateData.customerPhoneNumber),
        customerName: `${params.templateData.customerName} ${params.templateData.customerPhoneNumber ? `(Phone No. ${formatPhoneForEmail(params.templateData.customerPhoneNumber)})` : '(Phone No. N/A)'}`,

        // Company information
        company: 'LA VIP Tours & Charters',

        // Contact information
        contactPhone: '1-800-438-1814',
        contactEmail: 'info@laviptours.com',
        website: process.env.NEXT_PUBLIC_SERVER_URL,
        websiteUrl: process.env.NEXT_PUBLIC_SERVER_URL,

        // Dashboard information
        dashboardUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account`,

        // Social Media information
        instagramUrl: 'https://www.instagram.com/laviptours/',
        facebookUrl: 'https://www.facebook.com/laviptours/',
        tripadvisorUrl:
          'https://www.tripadvisor.com/Attraction_Review-g32655-d1101383-Reviews-LA_VIP_Tours-Los_Angeles_California.html',
        yelpUrl: 'https://www.yelp.com/biz/la-vip-tours-los-angeles',
        linkedinUrl: 'https://www.linkedin.com/company/laviptours/',

        instagramIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-instagram.svg',
        facebookIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-facebook.svg',
        tripadvisorIconUrl:
          'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-tripadvisor.svg',
        yelpIconUrl: 'https://lavip-test.s3.us-east-1.amazonaws.com/media/email-footer-yelp.svg',

        privacyPolicyUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/privacy-policy`,
        termsOfServiceUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/terms-and-conditions`,
        cancellationPolicyUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/cancellation-policy`,
      },
    })

    await logEmail({
      sentTo: process.env.SENDGRID_BOOKING_FROM_EMAIL || 'bookings@laviptours.com',
      sentFrom: process.env.SENDGRID_BOOKING_FROM_EMAIL || 'bookings@laviptours.com',
      subject: params.templateData.subject || 'Email from LA VIP Tours',
      emailType: 'admin_copy',
      templateId: params.templateId,
      templateData: params.templateData,
      status: 'sent',
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: params.metadata,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log failed email
    await logEmail({
      sentTo: params.to,
      subject: params.templateData.subject || 'Email from LA VIP Tours',
      emailType: params.emailType,
      templateId: params.templateId,
      templateData: params.templateData,
      status: 'failed',
      errorMessage,
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: params.metadata,
    })

    console.error('Failed to send dynamic email:', error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send professional booking confirmation email using dynamic template
 */
export async function sendBookingConfirmationEmail(
  data: BookingEmailData,
): Promise<{ success: boolean; error?: string }> {
  const templateData =
    data.bookingType === 'tour'
      ? {
          // Customer information
          customerName: data.customerName,
          customerPhoneNumber: data.customerPhoneNumber,

          // Tour-specific booking details

          tourName: data.bookingDetails.name,
          tourDescription: data.bookingDetails.description ?? '',
          tourDate: data.bookingDetails.date.split(' at ')[0] || data.bookingDetails.date,
          tourDateAndTime: data.bookingDetails.date,
          tourPickupLocation:
            data.bookingDetails.pickupLocation +
            (data.bookingDetails.pickupTime ? `, ${data.bookingDetails.pickupTime}` : ''),
          tourNotes: data.bookingDetails.scheduleNotes ?? '',

          // Common fields
          subject: 'Your LA VIP Tour is Confirmed!',
          bookingReference: data.bookingReference,
          numberOfAttendees: data.bookingDetails.totalGuests?.toString() || '0',
          paymentSummary: `Total Paid: $${data.bookingDetails.totalAmount} USD`,
          bookingDetailsUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account/tours/${data.bookingId}`,
        }
      : {
          // Event-specific template data (existing logic)
          customerName: data.customerName,
          customerPhoneNumber: data.customerPhoneNumber,
          eventName: data.bookingDetails.name,
          eventDescription: data.bookingDetails.description ?? '',
          eventLocation: data.bookingDetails.eventLocation ?? '',
          eventDate: data.bookingDetails.date.split(' at ')[0] || data.bookingDetails.date,
          eventDateAndPickupTime: data.bookingDetails.pickupTime ?? '',
          eventPickupLocation: data.bookingDetails.pickupLocation || 'To be confirmed',
          scheduleNotes: data.bookingDetails.scheduleNotes ?? '',

          subject: 'Your Event is Booked!',
          bookingReference: data.bookingReference,
          numberOfAttendees: data.bookingDetails.totalGuests?.toString() || '0',
          paymentSummary: `Total Paid: $${data.bookingDetails.totalAmount} USD`,
          bookingDetailsUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account/events/${data.bookingId}`,
        }

  return await sendDynamicEmail({
    to: data.customerEmail,
    from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
    templateId:
      data.bookingType === 'tour'
        ? EMAIL_TEMPLATES.TOUR_BOOKING_CONFIRMATION
        : EMAIL_TEMPLATES.BOOKING_CONFIRMATION,
    templateData,
    emailType:
      data.bookingType === 'tour' ? 'tour_booking_confirmation' : 'event_booking_confirmation',
    userId: data.userId,
    bookingReference: data.bookingReference,

    metadata: {
      bookingType: data.bookingType,
      bookingDetails: data.bookingDetails,
    },
  })
}

/**
 * Send unified booking cancellation email (supports both tour and event bookings)
 */
export async function sendCancellationEmail(params: {
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingType: 'tour' | 'event'
  bookingName: string
  bookingDate: string
  refundMessage?: string
  userId?: string | number
}): Promise<{ success: boolean; error?: string }> {
  const templateData =
    params.bookingType === 'event'
      ? {
          customerName: params.customerName,
          customerPhoneNumber: params.customerPhoneNumber,
          bookingReference: params.bookingReference,
          bookingName: params.bookingName,
          bookingDate: formatDateTime(params.bookingDate, true, false, true),
          subject: 'Your Event is Cancelled',
        }
      : {
          customerName: params.customerName,
          customerPhoneNumber: params.customerPhoneNumber,
          bookingReference: params.bookingReference,
          bookingName: params.bookingName,
          bookingDate: formatDateTime(params.bookingDate, false, false, false),
          subject: 'Your LA VIP Tour is Cancelled',
        }

  return await sendDynamicEmail({
    to: params.customerEmail,
    from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
    templateId:
      params.bookingType === 'event'
        ? EMAIL_TEMPLATES.EVENT_BOOKING_CANCELLATION
        : EMAIL_TEMPLATES.TOUR_BOOKING_CANCELLATION,
    templateData,
    emailType:
      params.bookingType === 'event' ? 'event_booking_cancellation' : 'tour_booking_cancellation',
    userId: params.userId,
    bookingReference: params.bookingReference,
    metadata: {
      bookingType: params.bookingType,
      bookingName: params.bookingName,
      bookingDate: params.bookingDate,
    },
  })
}

/**
 * Send refund confirmation email
 */
export async function sendRefundEmail(params: {
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingType: 'tour' | 'event'
  bookingName: string
  refundAmount: string
  refundId: string
  userId?: string | number
}): Promise<{ success: boolean; error?: string }> {
  const templateData = {
    customerName: params.customerName,
    customerPhoneNumber: params.customerPhoneNumber,
    bookingReference: params.bookingReference,
    bookingName: params.bookingName,
    refundAmount: params.refundAmount,
    refundId: params.refundId,
    currentYear: new Date().getFullYear(),
    subject:
      params.bookingType === 'event'
        ? 'Your Event Refund Has Been Processed'
        : 'Your LA VIP Tour Refund Has Been Processed',
  }

  return await sendDynamicEmail({
    to: params.customerEmail,
    from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
    templateId:
      params.bookingType === 'event' ? EMAIL_TEMPLATES.EVENT_REFUND : EMAIL_TEMPLATES.TOUR_REFUND,
    templateData,
    emailType: params.bookingType === 'event' ? 'event_refund' : 'tour_refund',
    userId: params.userId,
    bookingReference: params.bookingReference,
  })
}

// // Separate function for event refunds
// export async function sendEventRefundEmail(params: {
//   customerName: string
//   customerEmail: string
//   bookingReference: string
//   eventName: string
//   refundAmount: string
//   refundId: string
//   userId?: string | number
// }): Promise<{ success: boolean; error?: string }> {
//   const templateData = {
//     customerName: params.customerName,
//     bookingReference: params.bookingReference,
//     bookingName: params.eventName,
//     refundAmount: params.refundAmount,
//     refundId: params.refundId,
//     currentYear: new Date().getFullYear(),
//   }

//   return await sendDynamicEmail({
//     to: params.customerEmail,
//     from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
//     templateId: EMAIL_TEMPLATES.EVENT_REFUND,
//     templateData,
//     emailType: 'event_refund',
//     userId: params.userId,
//     bookingReference: params.bookingReference,
//   })
// }

// // Separate function for tour refunds
// export async function sendTourRefundEmail(params: {
//   customerName: string
//   customerEmail: string
//   bookingReference: string
//   tourName: string
//   refundAmount: string
//   refundId: string
//   userId?: string | number
// }): Promise<{ success: boolean; error?: string }> {
//   const templateData = {
//     customerName: params.customerName,
//     bookingReference: params.bookingReference,
//     bookingName: params.tourName,
//     refundAmount: params.refundAmount,
//     refundId: params.refundId,
//     currentYear: new Date().getFullYear(),
//   }

//   return await sendDynamicEmail({
//     to: params.customerEmail,
//     from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
//     templateId: EMAIL_TEMPLATES.TOUR_REFUND,
//     templateData,
//     emailType: 'tour_refund',
//     userId: params.userId,
//     bookingReference: params.bookingReference,
//   })
// }

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(params: {
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  userId?: string | number
}): Promise<{ success: boolean; error?: string }> {
  const templateData = {
    // Customer information
    customerName: params.customerName,
    customerPhoneNumber: params.customerPhoneNumber,
    subject: 'Welcome to LA VIP Tours And Charters!',
  }

  return await sendDynamicEmail({
    to: params.customerEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    templateId: EMAIL_TEMPLATES.USER_REGISTRATION,
    templateData,
    emailType: 'user_registration',
    userId: params.userId,
    metadata: {
      emailType: 'welcome',
    },
  })
}

/**
 * Send booking update email
 */
export async function sendBookingUpdateEmail(params: {
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingType: 'tour' | 'event'
  changeType: 'details_updated' | 'details_updated_with_upcharge' | 'details_updated_with_refund'
  bookingDetails: {
    name: string
    date: string
    totalAmount: string
    pickupLocation?: string
    pickupTime?: string
    totalGuests?: number
    description?: string
    eventLocation?: string
    scheduleNotes?: string
  }
  upchargeAmount?: number
  refundAmount?: number
  userId?: string | number
  emailTypeOverride?: EmailType
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the existing booking confirmation template but with different messaging
    const templateId =
      params.bookingType === 'tour'
        ? EMAIL_TEMPLATES.TOUR_BOOKING_CONFIRMATION
        : EMAIL_TEMPLATES.BOOKING_CONFIRMATION

    // Customize messaging based on change type
    let updateMessage = 'Your booking has been updated successfully.'
    let paymentMessage = ''

    if (params.changeType === 'details_updated_with_upcharge' && params.upchargeAmount) {
      updateMessage = 'Your booking has been updated and additional payment has been processed.'
      paymentMessage = `Additional payment of $${params.upchargeAmount.toFixed(2)} was charged for the booking changes.`
    } else if (params.changeType === 'details_updated_with_refund' && params.refundAmount) {
      updateMessage = 'Your booking has been updated and a refund has been initiated.'
      paymentMessage = `A refund of $${params.refundAmount.toFixed(2)} has been initiated and will appear in your account within 5-10 business days.`
    }

    const templateData =
      params.bookingType === 'tour'
        ? {
            // Customer information
            customerName: params.customerName,
            customerPhoneNumber: params.customerPhoneNumber,

            // Tour-specific booking details
            tourName: params.bookingDetails.name,
            tourDescription: params.bookingDetails.description ?? '',
            tourDate: params.bookingDetails.date.split(' at ')[0] || params.bookingDetails.date,
            tourDateAndTime: params.bookingDetails.date,
            tourPickupLocation:
              (params.bookingDetails.pickupLocation || '') +
              (params.bookingDetails.pickupTime ? `, ${params.bookingDetails.pickupTime}` : ''),
            tourNotes: params.bookingDetails.scheduleNotes ?? '',

            // Common fields
            bookingReference: params.bookingReference,
            numberOfAttendees: params.bookingDetails.totalGuests?.toString() || '0',
            paymentSummary: `Total Paid: $${params.bookingDetails.totalAmount} USD`,
            bookingDetailsUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account/tours/${params.bookingReference}`,

            // Update-specific messaging
            isUpdate: true,
            updateMessage,
            paymentMessage,
            subject: 'Your LA VIP Tour is Updated!',
            headerTitle: 'Booking Updated',
            confirmationMessage: updateMessage,
          }
        : {
            // Event-specific template data
            customerName: params.customerName,
            customerPhoneNumber: params.customerPhoneNumber,
            eventName: params.bookingDetails.name,
            eventDescription: params.bookingDetails.description ?? '',
            eventLocation: params.bookingDetails.eventLocation ?? '',
            eventDate: params.bookingDetails.date.split(' at ')[0] || params.bookingDetails.date,
            eventDateAndPickupTime: params.bookingDetails.pickupTime ?? '',
            eventPickupLocation: params.bookingDetails.pickupLocation || 'To be confirmed',
            scheduleNotes: params.bookingDetails.scheduleNotes ?? '',
            bookingReference: params.bookingReference,
            numberOfAttendees: params.bookingDetails.totalGuests?.toString() || '0',
            paymentSummary: `Total Paid: $${params.bookingDetails.totalAmount} USD`,
            bookingDetailsUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/my-account/events/${params.bookingReference}`,

            // Update-specific messaging
            isUpdate: true,
            updateMessage,
            paymentMessage,
            subject: 'Your Event is Updated!',
            headerTitle: 'Booking Updated',
            confirmationMessage: updateMessage,
          }

    await sendDynamicEmail({
      to: params.customerEmail,
      from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
      templateId,
      templateData,
      emailType:
        params.emailTypeOverride ||
        (params.bookingType === 'tour'
          ? 'tour_booking_confirmation'
          : 'event_booking_confirmation'),
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: {
        changeType: params.changeType,
        upchargeAmount: params.upchargeAmount,
        refundAmount: params.refundAmount,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send booking update email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  customerName: string
  customerEmail: string
  resetPasswordUrl: string
  expirationTime?: string
  userId?: string | number
}): Promise<{ success: boolean; error?: string }> {
  const templateData = {
    // Customer information
    customerName: params.customerName,
    emailType: 'password_reset',
    resetPasswordUrl: params.resetPasswordUrl,
    expirationTime: params.expirationTime || '24 hours',
    subject: 'Reset Your Password - LA VIP Tours And Charters',
  }

  return await sendDynamicEmail({
    to: params.customerEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'info@laviptours.com',
    templateId: EMAIL_TEMPLATES.PASSWORD_RESET,
    templateData,
    emailType: 'password_reset',
    userId: params.userId,
    metadata: {
      emailType: 'password_reset',
      resetPasswordUrl: params.resetPasswordUrl,
    },
  })
}

/**
 * Send pending payment reminder email for event or tour bookings
 */
export async function sendPendingPaymentEmail(params: {
  customerName: string
  customerEmail: string
  customerPhoneNumber?: string
  bookingReference: string
  bookingType: 'event' | 'tour'
  bookingDetails: {
    name: string
    description?: string
    date: string
    pickupLocation?: string
    pickupTime?: string
    totalGuests?: number
    totalAmount: number
    eventLocation?: string
    scheduleNotes?: string
  }
  paymentUrl: string
  userId?: string | number
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🚀 sendPendingPaymentEmail called with params:', {
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhoneNumber: params.customerPhoneNumber,
      bookingReference: params.bookingReference,
      bookingType: params.bookingType,
      bookingDetails: params.bookingDetails,
      paymentUrl: params.paymentUrl,
      userId: params.userId,
    })
    const templateId =
      params.bookingType === 'event'
        ? EMAIL_TEMPLATES.EVENT_PENDING_PAYMENT
        : EMAIL_TEMPLATES.TOUR_PENDING_PAYMENT

    const templateData =
      params.bookingType === 'event'
        ? {
            // Customer information
            customerName: params.customerName,
            customerPhoneNumber: params.customerPhoneNumber || '',

            // Event-specific booking details
            eventName: params.bookingDetails.name,
            eventDescription: params.bookingDetails.description ?? '',
            eventDate: params.bookingDetails.date.split(' at ')[0] || params.bookingDetails.date,
            eventDateAndTime: params.bookingDetails.date,
            eventLocation: params.bookingDetails.eventLocation ?? '',
            eventPickupLocation:
              (params.bookingDetails.pickupLocation || '') +
              (params.bookingDetails.pickupTime ? `, ${params.bookingDetails.pickupTime}` : ''),
            eventNotes: params.bookingDetails.scheduleNotes ?? '',

            // Common fields
            bookingReference: params.bookingReference,
            numberOfAttendees: params.bookingDetails.totalGuests?.toString() || '0',
            totalAmount: params.bookingDetails.totalAmount.toString(),
            paymentSummary: `Total Amount Due: $${params.bookingDetails.totalAmount} USD`,

            // Payment action
            paymentUrl: params.paymentUrl,
            completePaymentUrl: params.paymentUrl,

            // Email specific messaging
            subject: `Complete Your Payment - ${params.bookingDetails.name} Booking`,
            emailTitle: 'Complete Your Payment',
            mainMessage:
              'Your booking is confirmed! Please complete your payment to secure your reservation.',
            actionButtonText: 'Complete Payment Now',
            urgencyMessage: 'Complete your payment to ensure your booking is fully secured.',
          }
        : {
            // Customer information
            customerName: params.customerName,
            customerPhoneNumber: params.customerPhoneNumber || '',

            // Tour-specific booking details
            tourName: params.bookingDetails.name,
            tourDescription: params.bookingDetails.description ?? '',
            tourDate: params.bookingDetails.date.split(' at ')[0] || params.bookingDetails.date,
            tourDateAndTime: params.bookingDetails.date,
            tourPickupLocation:
              (params.bookingDetails.pickupLocation || '') +
              (params.bookingDetails.pickupTime ? `, ${params.bookingDetails.pickupTime}` : ''),
            tourNotes: params.bookingDetails.scheduleNotes ?? '',

            // Common fields
            bookingReference: params.bookingReference,
            numberOfAttendees: params.bookingDetails.totalGuests?.toString() || '0',
            totalAmount: params.bookingDetails.totalAmount.toString(),
            paymentSummary: `Total Amount Due: $${params.bookingDetails.totalAmount} USD`,

            // Payment action
            paymentUrl: params.paymentUrl,
            completePaymentUrl: params.paymentUrl,

            // Email specific messaging
            subject: `Complete Your Payment - ${params.bookingDetails.name} Booking`,
            emailTitle: 'Complete Your Payment',
            mainMessage:
              'Your booking is confirmed! Please complete your payment to secure your reservation.',
            actionButtonText: 'Complete Payment Now',
            urgencyMessage: 'Complete your payment to ensure your booking is fully secured.',
          }

    console.log('📧 Final template data being sent:', templateData)

    return await sendDynamicEmail({
      to: params.customerEmail,
      from: process.env.SENDGRID_BOOKING_FROM_EMAIL,
      templateId: templateId,
      templateData,
      emailType: params.bookingType === 'event' ? 'event_pending_payment' : 'tour_pending_payment',
      userId: params.userId,
      bookingReference: params.bookingReference,
      metadata: {
        emailType:
          params.bookingType === 'event' ? 'event_pending_payment' : 'tour_pending_payment',
        bookingReference: params.bookingReference,
        bookingType: params.bookingType,
        paymentUrl: params.paymentUrl,
        totalAmount: params.bookingDetails.totalAmount,
      },
    })
  } catch (error) {
    console.error('Failed to send pending payment email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
