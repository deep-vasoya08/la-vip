import { NextRequest, NextResponse } from 'next/server'
import {
  calculatePriceDifference,
  updateBookingDetails,
  updatePaymentRefundStatus,
  getPaymentsToRefund,
  type EditBookingData,
} from '@/utilities/eventBookingEditUtils'
import { getAuthenticatedUser, validateBookingAccess } from '@/utilities/auth'
import { processRefund, processMultiPaymentRefund, RefundResult } from '@/utilities/refund'
import { sendBookingUpdateEmail } from '@/lib/emailService'
import { formatEventBookingForEmail } from '@/utilities/bookingEmailUtils'
import { getEventSelectedScheduleTime } from '@/utilities/eventBookingUtils'
import { EventBooking } from '@/payload-types'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
    }

    const { bookingId, editData }: { bookingId: string; editData: EditBookingData } =
      await req.json()

    if (!bookingId || !editData) {
      return NextResponse.json({ error: 'Booking ID and edit data are required' }, { status: 400 })
    }

    // Validate booking access
    const validationResult = await validateBookingAccess(
      bookingId,
      authResult.user.id,
      authResult.user.role,
      'event',
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.statusCode },
      )
    }

    const { booking } = validationResult

    // Calculate new pricing for booking update
    const priceResult = await calculatePriceDifference(booking as EventBooking, editData)
    if ('error' in priceResult) {
      return NextResponse.json({ error: priceResult.error }, { status: priceResult.statusCode })
    }

    // Get the original event date for refund policy using optimized utility
    const eventDate = getEventSelectedScheduleTime(booking as EventBooking, false) // Get raw date string

    let refundResult: RefundResult | null = null

    // Only process refund if there's a downgrade (negative difference)
    if (priceResult.difference < 0) {
      const refundAmount = Math.abs(priceResult.difference)

      // Get all payments that need to be refunded
      const paymentsToRefundResult = await getPaymentsToRefund(bookingId, refundAmount, 'event')
      if ('error' in paymentsToRefundResult) {
        return NextResponse.json(
          {
            error: paymentsToRefundResult.error,
          },
          {
            status: paymentsToRefundResult.statusCode,
          },
        )
      }

      // Type check to ensure we have the correct response structure
      if (!('paymentsToRefund' in paymentsToRefundResult)) {
        return NextResponse.json(
          { error: 'Invalid response from payment calculation' },
          { status: 500 },
        )
      }

      const { paymentsToRefund } = paymentsToRefundResult

      // Check if we have any payments to refund
      if (!paymentsToRefund || paymentsToRefund.length === 0) {
        return NextResponse.json(
          { error: 'No refundable payments found for this booking' },
          { status: 400 },
        )
      }

      try {
        if (paymentsToRefund.length === 1) {
          // Single payment refund
          const paymentToRefund = paymentsToRefund[0]
          if (!paymentToRefund) {
            return NextResponse.json({ error: 'Invalid payment data' }, { status: 500 })
          }
          refundResult = await processRefund({
            paymentIntentId: paymentToRefund.paymentIntentId,
            paymentId: paymentToRefund.payment.id,
            paymentAmount: paymentToRefund.payment.amount,
            bookingId: bookingId.toString(),
            eventDate,
            reason: 'Booking modification - price decrease',
            bookingType: 'event',
            isDowngrade: true,
            downgradeDifference: priceResult.difference,
          })
        } else {
          // Multi-payment refund
          refundResult = await processMultiPaymentRefund({
            paymentsToRefund,
            bookingId: bookingId.toString(),
            eventDate,
            reason: 'Booking modification - price decrease',
            bookingType: 'event',
            isDowngrade: true,
          })
        }
      } catch (refundError) {
        console.error('Refund processing error:', refundError)

        // Mark all payments as failed if processing failed
        for (const paymentToRefund of paymentsToRefund) {
          await updatePaymentRefundStatus(paymentToRefund.payment.id.toString(), 'failed')
        }

        // Check if it's a "not eligible for refund" error
        const errorMessage =
          refundError instanceof Error ? refundError.message : 'Refund processing failed'
        if (errorMessage.includes('not eligible for a refund')) {
          return NextResponse.json(
            {
              error:
                'This booking is not eligible for a refund based on our refund policy. The event may have already started or passed.',
            },
            { status: 400 },
          )
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
    }

    // Update the booking with new details after successful refund initiation
    const updateResult = await updateBookingDetails(
      bookingId,
      editData,
      priceResult.newPricing,
      booking as EventBooking,
    )

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    // Send booking update email using optimized utilities
    try {
      // Use the formatted event details utility for better data structure
      const emailData = await formatEventBookingForEmail(updateResult.booking!)

      await sendBookingUpdateEmail({
        ...emailData,
        bookingType: 'event',
        changeType: 'details_updated_with_refund',
        refundAmount: refundResult?.amount || 0,
      })
    } catch (emailError) {
      console.error('Failed to send booking update email:', emailError)
      // Don't fail the request if email fails
    }

    // Return success response with proper null checks
    return NextResponse.json({
      success: true,
      message: refundResult
        ? 'Booking updated and refund initiated successfully'
        : 'Booking updated successfully (no refund required)',
      ...(refundResult && {
        refundId: refundResult.refundId,
        refundAmount: refundResult.amount,
        refundPercentage: refundResult.percentage,
      }),
    })
  } catch (error) {
    console.error('Error processing booking edit with refund:', error)
    return NextResponse.json({ error: 'Error processing booking edit' }, { status: 500 })
  }
}
