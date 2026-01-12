// for tour cancel API
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/options'
import { sendCancellationEmail } from '@/lib/emailService'
import {
  processRefund,
  processMultiPaymentRefund,
  calculateRefundableAmount as calculateCancellationAmount,
} from '@/utilities/refund'
import { calculateRefundableAmount, getPaymentsToRefund } from '@/utilities/tourBookingEditUtils'
import { getTourSelectedScheduleTime } from '@/utilities/tourBookingUtils'

// Initialize Payload
const payload = await getPayload({ config })

export async function POST(request: NextRequest) {
  console.log('=== Starting tour booking cancellation process ===')
  try {
    // Get authenticated user from NextAuth session
    console.log('Getting user session...')
    const session = await getServerSession(authOptions)

    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { bookingId } = body
    console.log('Request body:', { bookingId, fullBody: body })

    // Validate required field
    if (!bookingId) {
      console.log('Validation failed: Missing booking ID')
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.log('Authentication failed: No user session')
      return NextResponse.json(
        { error: 'You must be logged in to cancel a booking' },
        { status: 401 },
      )
    }

    // Get user from session
    const user = session.user
    console.log('User authenticated:', { userId: user.id, userRole: user.role })

    // Find the booking
    console.log('Fetching booking details...')
    const booking = await payload.findByID({
      collection: 'tour_bookings',
      id: Number(bookingId),
      depth: 2, // Include related data
    })

    if (!booking) {
      console.log('Booking not found:', bookingId)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    console.log('Booking found:', {
      bookingReference: booking.bookingReference,
      status: booking.status,
    })

    // Check if user owns this booking or is admin
    const bookingUserId = booking.user
      ? typeof booking.user === 'object'
        ? booking.user.id
        : booking.user
      : null
    const isOwner = bookingUserId && String(bookingUserId) === String(user.id)
    const isAdmin = user.role === 'admin'
    console.log('Authorization check:', { isOwner, isAdmin, bookingUserId })

    if (!isOwner && !isAdmin) {
      console.log('Authorization failed: User not authorized')
      return NextResponse.json(
        { error: 'You are not authorized to cancel this booking' },
        { status: 403 },
      )
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      console.log('Booking already cancelled')
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Get ALL payment information and calculate total pending amount
    console.log('Calculating refundable amount...')
    const refundableResult = await calculateRefundableAmount(bookingId, 'tour')
    console.log('Refundable amount calculation result:', refundableResult)

    if ('error' in refundableResult) {
      console.log('Refundable amount calculation failed:', refundableResult)
      return NextResponse.json(
        { error: refundableResult.error },
        { status: refundableResult.statusCode },
      )
    }

    // Type check to ensure we have the correct response structure
    if (!('availableForRefund' in refundableResult)) {
      console.log('Invalid refundable amount response structure')
      return NextResponse.json(
        { error: 'Invalid response from payment calculation' },
        { status: 500 },
      )
    }

    const { availableForRefund: totalPendingAmount } = refundableResult
    console.log('Total pending amount:', totalPendingAmount)

    if (totalPendingAmount <= 0) {
      console.log('No refundable amount available')
      return NextResponse.json(
        { error: 'No refundable amount available for this booking' },
        { status: 400 },
      )
    }

    // Retrieve tour details to calculate refund amount
    console.log('Fetching tour details...')
    let tour
    if (booking.tour) {
      const tourId = typeof booking.tour === 'object' ? booking.tour.id : booking.tour
      tour = await payload.findByID({
        collection: 'tours',
        id: tourId,
      })
    }

    if (!tour) {
      console.log('Tour not found')
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }
    console.log('Tour found:', { tourId: tour.id, tourName: tour.name })

    // Get tour date for cancellation policy
    const tourDate = getTourSelectedScheduleTime(booking, false)
    console.log('Tour date:', tourDate)

    // Check if we have a valid tour date
    if (!tourDate || tourDate === 'Not specified') {
      console.log('Cannot determine tour date for cancellation policy')
      return NextResponse.json(
        {
          error:
            'Cannot determine tour date for this booking. Please contact support for assistance.',
        },
        { status: 400 },
      )
    }

    // Validate that the tour date is a valid date string
    const tourDateObj = new Date(tourDate)
    if (isNaN(tourDateObj.getTime())) {
      console.log('Invalid tour date format:', tourDate)
      return NextResponse.json(
        { error: 'Invalid tour date format. Please contact support for assistance.' },
        { status: 400 },
      )
    }

    // Calculate refund amount based on cancellation policy
    console.log('Calculating refund amount based on cancellation policy...')
    const cancellationResult = calculateCancellationAmount(totalPendingAmount, tourDate)
    const refundAmount = cancellationResult.amount
    const refundPercentage = cancellationResult.percentage
    console.log('Refund calculation:', { refundAmount, refundPercentage })

    if (refundAmount <= 0) {
      console.log('Booking not eligible for refund based on cancellation policy')
      return NextResponse.json(
        { error: 'This booking is not eligible for a refund based on our cancellation policy' },
        { status: 400 },
      )
    }

    // Get payments to refund for the calculated amount
    console.log('Getting payments to refund...')
    const paymentsToRefundResult = await getPaymentsToRefund(bookingId, refundAmount, 'tour')
    console.log('Payments to refund result:', paymentsToRefundResult)

    if ('error' in paymentsToRefundResult) {
      console.log('Failed to get payments to refund:', paymentsToRefundResult)
      return NextResponse.json(
        { error: paymentsToRefundResult.error },
        { status: paymentsToRefundResult.statusCode },
      )
    }

    // Type check to ensure we have the correct response structure
    if (!('paymentsToRefund' in paymentsToRefundResult)) {
      console.log('Invalid payments to refund response structure')
      return NextResponse.json(
        { error: 'Invalid response from payment calculation' },
        { status: 500 },
      )
    }

    const { paymentsToRefund } = paymentsToRefundResult

    // Check if we have any payments to refund
    if (!paymentsToRefund || paymentsToRefund.length === 0) {
      console.log('No refundable payments found')
      return NextResponse.json(
        { error: 'No refundable payments found for this booking' },
        { status: 400 },
      )
    }
    console.log('Number of payments to refund:', paymentsToRefund.length)

    // Process the refund using the appropriate method
    let refundResult
    try {
      console.log('Processing refund...')
      if (paymentsToRefund.length === 1) {
        // Single payment refund
        console.log('Processing single payment refund')
        const paymentToRefund = paymentsToRefund[0]
        if (!paymentToRefund) {
          console.log('Invalid payment data for single refund')
          return NextResponse.json({ error: 'Invalid payment data' }, { status: 500 })
        }
        refundResult = await processRefund({
          paymentIntentId: paymentToRefund.paymentIntentId,
          paymentId: paymentToRefund.payment.id,
          paymentAmount: paymentToRefund.payment.amount,
          bookingId,
          eventDate: tourDate,
          reason: 'Tour Booking Cancelled',
          bookingType: 'tour',
          isDowngrade: true, // Use downgrade mechanism to bypass policy recalculation
          downgradeDifference: -refundAmount, // Negative to indicate refund amount
        })
      } else {
        // Multi-payment refund
        console.log('Processing multi-payment refund')
        refundResult = await processMultiPaymentRefund({
          paymentsToRefund,
          bookingId,
          eventDate: tourDate,
          reason: 'Tour Booking Cancelled',
          bookingType: 'tour',
          isDowngrade: false, // This is a cancellation, not a downgrade
        })
      }
      console.log('Refund processed successfully:', refundResult)
    } catch (refundError) {
      console.error('Refund processing error:', refundError)

      // Check if it's a "not eligible for refund" error
      const errorMessage =
        refundError instanceof Error ? refundError.message : 'Refund processing failed'
      if (errorMessage.includes('not eligible for a refund')) {
        return NextResponse.json(
          {
            error:
              'This booking is not eligible for a refund based on our cancellation policy. The tour may have already started or passed.',
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Update booking status to cancelled
    await payload.update({
      collection: 'tour_bookings',
      id: Number(bookingId),
      data: {
        status: 'cancelled',
      },
    })

    console.log('===== TOUR BOOKING CANCELLED =====')
    console.log(`Booking reference: ${booking.bookingReference}`)
    console.log(`User ID: ${user.id}`)
    console.log(`User email: ${user.email || 'Not provided'}`)
    console.log('===== END CANCELLATION =====')

    //  get user phone number from using user id fine on users table and get phone number field
    const userData = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
    })
    const userPhoneNumber = userData?.phoneNumber || ''

    // Send unified cancellation confirmation email
    if (user.email && tour) {
      console.log('Sending cancellation confirmation email...')
      try {
        const emailResult = await sendCancellationEmail({
          customerName: user.name || user.email,
          customerEmail: user.email,
          customerPhoneNumber: userPhoneNumber,
          bookingReference: booking.bookingReference,
          bookingType: 'tour',
          bookingName: tour.name || 'VIP Tour Experience',
          bookingDate: tourDate, // Use the already validated tourDate
          refundMessage: refundResult.message,
          userId: user.id,
        })

        if (emailResult.success) {
          console.log(`Tour cancellation email sent successfully to ${user.email}`)
        } else {
          console.error('Failed to send tour cancellation email:', emailResult.error)
        }
      } catch (emailError) {
        console.error('Error sending tour cancellation email:', emailError)
        // Don't fail the cancellation if email fails
      }
    }

    console.log('Tour booking cancellation completed successfully')
    return NextResponse.json({
      success: true,
      message: refundResult.message,
    })
  } catch (error) {
    console.error('Unhandled error in tour booking cancellation:', error)
    return NextResponse.json(
      { error: 'An error occurred while cancelling the booking. Please try again.' },
      { status: 500 },
    )
  }
}
