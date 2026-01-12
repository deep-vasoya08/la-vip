import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendBookingUpdateEmail } from '@/lib/emailService'
import { formatEventBookingForEmail } from '@/utilities/bookingEmailUtils'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()
    const { bookingIds } = body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json({ error: 'Booking IDs are required' }, { status: 400 })
    }

    const results = []
    const errors = []

    // Process each booking
    for (const bookingId of bookingIds) {
      try {
        // Fetch the booking with full details
        const booking = await payload.findByID({
          collection: 'event_bookings',
          id: bookingId,
          depth: 3,
        })

        // Format booking data for email
        const emailData = await formatEventBookingForEmail(booking)

        // Send the update email (resend using update template)
        const emailResult = await sendBookingUpdateEmail({
          customerName: emailData.customerName,
          customerEmail: emailData.customerEmail,
          customerPhoneNumber: emailData.customerPhoneNumber,
          bookingReference: emailData.bookingReference,
          changeType: 'details_updated',
          bookingType: 'event',
          bookingDetails: emailData.bookingDetails,
          userId: emailData.userId,
          emailTypeOverride: 'resend_email',
        })

        if (emailResult.success) {
          results.push({
            bookingId,
            bookingReference: emailData.bookingReference,
            email: emailData.customerEmail,
            success: true,
          })
        } else {
          errors.push({
            bookingId,
            bookingReference: emailData.bookingReference,
            email: emailData.customerEmail,
            error: emailResult.error || 'Failed to send email',
          })
        }
      } catch (error: any) {
        errors.push({
          bookingId,
          error: error.message || 'Failed to process booking',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: bookingIds.length,
        successful: results.length,
        failed: errors.length,
      },
    })
  } catch (error: any) {
    console.error('Error resending booking emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend booking emails' },
      { status: 500 },
    )
  }
}
