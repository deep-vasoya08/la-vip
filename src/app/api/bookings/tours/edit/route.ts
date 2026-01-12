import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUser, validateBookingAccess } from '@/utilities/auth'
import { sendBookingUpdateEmail } from '@/lib/emailService'
import {
  calculatePriceDifference,
  EditBookingData,
  updateBookingDetails,
  validatePickupTime,
} from '@/utilities/tourBookingEditUtils'
import { formatTourBookingForEmail } from '@/utilities/bookingEmailUtils'
import { TourBooking } from '@/payload-types'
import { updateShopperApprovedReview } from '@/lib/shopperApproved'
import { computeFollowupDateYMD } from '@/utilities/shopperApprovedUtils'
import { getTourSelectedScheduleTime } from '@/utilities/tourBookingUtils'

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
      'tour',
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.statusCode },
      )
    }

    // Validate pickup time
    const pickupTimeValidation = await validatePickupTime(editData)
    if (!pickupTimeValidation.isValid) {
      return NextResponse.json(
        { error: pickupTimeValidation.error },
        { status: pickupTimeValidation.statusCode },
      )
    }

    // Calculate new pricing
    const priceResult = await calculatePriceDifference(
      validationResult.booking as TourBooking,
      editData,
    )

    if ('error' in priceResult) {
      return NextResponse.json({ error: priceResult.error }, { status: priceResult.statusCode })
    }

    // Update the booking
    const updateResult = await updateBookingDetails(
      bookingId,
      editData,
      priceResult.newPricing,
      validationResult.booking as TourBooking,
    )

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 })
    }

    // Send booking update email
    try {
      const emailData = await formatTourBookingForEmail(updateResult.booking!)
      await sendBookingUpdateEmail({
        ...emailData,
        bookingType: 'tour',
        changeType: 'details_updated',
      })
    } catch (emailError) {
      console.error('Failed to send booking update email:', emailError)
      // Don't fail the request if email fails
    }

    // Schedule Shopper Approved follow-up update old booking using put
    try {
      const tourDate = updateResult.booking ? getTourSelectedScheduleTime(updateResult.booking) : ''
      const result = await updateShopperApprovedReview({
        reviewIdOrOrderId: String(updateResult.booking?.reviewFollowup?.reviewId),
        followup: computeFollowupDateYMD(tourDate ?? ''),
        cancel: false,
      })
      if (!result.success) {
        console.error('Failed to schedule Shopper Approved follow-up:', result.error)
      }
    } catch (error) {
      console.error('Failed to schedule Shopper Approved follow-up:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: updateResult.booking,
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Error updating booking' }, { status: 500 })
  }
}
