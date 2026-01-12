import { getPayload } from 'payload'
import config from '@/payload.config'
import { TourBooking } from '@/payload-types'
import { getAllBookingPayments } from './paymentUtils'
import { isTourDateAvailable } from './tourScheduleUtils'

const payload = await getPayload({ config })

/**
 * Interface for booking edit data
 */
export interface EditBookingData {
  tourId: string
  scheduleId: string // Generated schedule ID for form logic (YYYY-MM-DD format)
  adultCount: number
  childCount: number
  pickupLocationId: string
  tourDateTime: string
  hotelId?: number
}

/**
 * Interface for price calculation result
 */
export interface PriceCalculationResult {
  originalAmount: number
  newAmount: number
  difference: number
  type: 'upcharge' | 'downgrade' | 'no_change'
  newPricing: {
    adultPrice: number
    childrenPrice: number
    adultTotal: number
    childTotal: number
    totalAmount: number
    currency: string
  }
}

/**
 * Calculate price difference for booking edit
 */
export async function calculatePriceDifference(
  booking: TourBooking,
  editData: EditBookingData,
): Promise<PriceCalculationResult | { error: string; statusCode: number }> {
  try {
    // Get the new tour details
    const tour = await payload.findByID({
      collection: 'tours',
      id: editData.tourId,
      depth: 2,
    })

    if (!tour) {
      return { error: 'Tour not found', statusCode: 404 }
    }

    // With new schema, validate the date and find pickup location directly from tour

    // Validate that the requested date is available
    if (editData.tourDateTime) {
      const bookingDate = new Date(editData.tourDateTime)
      const tourConfig = {
        tour_start_time: tour.tour_start_time || '',
        recurrence_rule: tour.recurrence_rule || '',
        booking_window_months: tour.booking_window_months || 0,
        schedule_notes: tour.schedule_notes || undefined,
      }

      if (!isTourDateAvailable(bookingDate, tourConfig)) {
        return { error: 'Selected date is not available for booking', statusCode: 400 }
      }
    }

    // Find the selected pickup location from tour's pickups (new schema)
    const selectedPickup = tour.pickups?.find((pickup: any) => {
      const hotelId = typeof pickup.hotel === 'object' ? pickup.hotel.id : pickup.hotel
      return hotelId === Number(editData.pickupLocationId)
    })

    if (!selectedPickup) {
      return { error: 'Pickup location not found', statusCode: 404 }
    }

    // Calculate new pricing
    const adultPrice = selectedPickup.adult_price || 0
    const childrenPrice = selectedPickup.children_price || 0
    const adultTotal = editData.adultCount * adultPrice
    const childTotal = editData.childCount * childrenPrice
    const newTotalAmount = adultTotal + childTotal

    // Calculate price difference
    const originalAmount = booking.pricing.totalAmount
    const difference = newTotalAmount - originalAmount

    let type: 'upcharge' | 'downgrade' | 'no_change'
    if (difference > 0) {
      type = 'upcharge'
    } else if (difference < 0) {
      type = 'downgrade'
    } else {
      type = 'no_change'
    }

    return {
      originalAmount,
      newAmount: newTotalAmount,
      difference,
      type,
      newPricing: {
        adultPrice,
        childrenPrice,
        adultTotal,
        childTotal,
        totalAmount: newTotalAmount,
        currency: 'USD',
      },
    }
  } catch (error) {
    console.error('Price calculation error:', error)
    return { error: 'Price calculation failed', statusCode: 500 }
  }
}

/**
 * Validate pickup time selection
 */
export async function validatePickupTime(
  editData: EditBookingData,
): Promise<{ isValid: boolean; error?: string; statusCode?: number }> {
  try {
    const tour = await payload.findByID({
      collection: 'tours',
      id: editData.tourId,
      depth: 2,
    })

    if (!tour) {
      return { isValid: false, error: 'Tour not found', statusCode: 404 }
    }

    // With new schema, validate the date and find pickup location directly from tour

    // Validate that the requested date is available
    if (editData.tourDateTime) {
      const bookingDate = new Date(editData.tourDateTime)
      const tourConfig = {
        tour_start_time: tour.tour_start_time || '',
        recurrence_rule: tour.recurrence_rule || '',
        booking_window_months: tour.booking_window_months || 0,
        schedule_notes: tour.schedule_notes || undefined,
      }

      if (!isTourDateAvailable(bookingDate, tourConfig)) {
        return {
          isValid: false,
          error: 'Selected date is not available for booking',
          statusCode: 400,
        }
      }
    }

    // Find the selected pickup location from tour's pickups (new schema)
    const selectedPickup = tour.pickups?.find((pickup: any) => {
      const hotelId = typeof pickup.hotel === 'object' ? pickup.hotel.id : pickup.hotel
      return hotelId === Number(editData.pickupLocationId)
    })

    if (!selectedPickup) {
      return { isValid: false, error: 'Pickup location not found', statusCode: 404 }
    }

    // With new schema, pickup time is automatically calculated, no need to validate specific time
    return { isValid: true }
  } catch (error) {
    console.error('Pickup time validation error:', error)
    return { isValid: false, error: 'Validation failed', statusCode: 500 }
  }
}

/**
 * Update booking with new details
 */
export async function updateBookingDetails(
  bookingId: string,
  editData: EditBookingData,
  newPricing: PriceCalculationResult['newPricing'],
  originalBooking: TourBooking,
): Promise<{ success: boolean; booking?: TourBooking; error?: string }> {
  try {
    // Get tour details to calculate pickup times
    const tour = await payload.findByID({
      collection: 'tours',
      id: Number(editData.tourId),
      depth: 2,
    })

    if (!tour) {
      throw new Error('Tour not found')
    }

    // Find the selected pickup from tour configuration
    const selectedPickup = tour.pickups?.find((pickup: any) => {
      const pickupHotelId = typeof pickup.hotel === 'object' ? pickup.hotel.id : pickup.hotel
      return pickupHotelId == editData.pickupLocationId
    })

    if (!selectedPickup) {
      throw new Error(`Pickup location not found for hotel ID: ${editData.pickupLocationId}`)
    }

    // Calculate pickup time based on tour date and pickup offset
    const tourDate = new Date(editData.tourDateTime)
    const pickupTime = new Date(selectedPickup.pickup_time)
    const pickupDateTime = new Date(tourDate)
    pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0)

    // Get hotel ID
    const hotelId =
      typeof selectedPickup.hotel === 'object' ? selectedPickup.hotel.id : selectedPickup.hotel

    // Validate that we have a valid hotel ID
    if (!hotelId || isNaN(Number(hotelId))) {
      throw new Error(`Invalid hotel ID: ${hotelId}`)
    }

    const updatedBooking = await payload.update({
      collection: 'tour_bookings',
      id: bookingId,
      data: {
        tour: Number(editData.tourId),
        scheduledDate: new Date(editData.tourDateTime).toISOString(),
        adultCount: editData.adultCount,
        childCount: editData.childCount,
        pickupDetails: {
          locationId: editData.pickupLocationId,
          hotelId: Number(hotelId),
          pickupDateTime: pickupDateTime.toISOString(),
          tourDateTime: new Date(editData.tourDateTime).toISOString(),
        },
        pricing: newPricing,
        notes: originalBooking.notes
          ? `${originalBooking.notes}\n\nBooking updated on ${new Date().toISOString()}`
          : `Booking updated on ${new Date().toISOString()}`,
      },
      depth: 2,
    })

    return { success: true, booking: updatedBooking as TourBooking }
  } catch (error) {
    console.error('Booking update error:', error)
    return { success: false, error: 'Failed to update booking' }
  }
}

/**
 * Get original payment for refund processing
 */
export async function getOriginalPayment(bookingId: string) {
  try {
    const payments = await payload.find({
      collection: 'tour_booking_payments',
      where: {
        booking: {
          in: [Number(bookingId)],
        },
        paymentStatus: {
          equals: 'completed',
        },
      },
      limit: 1,
      sort: '-createdAt',
    })

    if (!payments.docs || payments.docs.length === 0) {
      return { error: 'No completed payment found for this booking', statusCode: 400 }
    }

    const originalPayment = payments.docs[0]
    const paymentIntentId = originalPayment?.stripeDetails?.stripePaymentIntentId

    if (!paymentIntentId) {
      return { error: 'No payment intent ID found for this booking', statusCode: 400 }
    }

    return { payment: originalPayment, paymentIntentId }
  } catch (error) {
    console.error('Original payment fetch error:', error)
    return { error: 'Failed to fetch original payment', statusCode: 500 }
  }
}

/**
 * Get the latest refundable payment for a booking
 * This function checks refund status to prevent duplicate refunds
 */
export async function getLatestRefundablePayment(bookingId: string) {
  try {
    const payments = await payload.find({
      collection: 'tour_booking_payments',
      where: {
        booking: {
          in: [Number(bookingId)],
        },
        paymentStatus: {
          equals: 'completed',
        },
        refundStatus: {
          not_equals: 'refunded',
        },
      },
      limit: 1,
      sort: '-createdAt',
    })

    if (!payments.docs || payments.docs.length === 0) {
      return {
        error:
          'No refundable payment found for this booking (payment may have already been refunded)',
        statusCode: 400,
      }
    }

    const latestPayment = payments.docs[0]
    const paymentIntentId = latestPayment?.stripeDetails?.stripePaymentIntentId

    if (!paymentIntentId) {
      return { error: 'No payment intent ID found for this booking', statusCode: 400 }
    }

    // Check if refund is already in progress
    if (latestPayment.refundStatus === 'pending') {
      return {
        error: 'Refund is already in progress for this payment',
        statusCode: 409,
      }
    }

    return {
      payment: latestPayment,
      paymentIntentId,
      isRefundable:
        latestPayment.refundStatus === 'not_refunded' || latestPayment.refundStatus === 'failed',
    }
  } catch (error) {
    console.error('Latest refundable payment fetch error:', error)
    return { error: 'Failed to fetch refundable payment', statusCode: 500 }
  }
}

/**
 * Update payment refund status
 */
export async function updatePaymentRefundStatus(
  paymentId: string,
  refundStatus: 'pending' | 'refunded' | 'failed',
  refundData?: {
    refundedAmount?: number
    stripeRefundId?: string
    refundReceiptUrl?: string
  },
) {
  try {
    // First get the current payment to check existing refund amount
    const currentPayment = await payload.findByID({
      collection: 'tour_booking_payments',
      id: paymentId,
    })

    if (!currentPayment) {
      return { success: false, error: 'Payment not found' }
    }

    const updateData: any = { refundStatus }

    if (refundData) {
      // Add new refund amount to existing refunded amount
      if (refundData.refundedAmount) {
        const existingRefundedAmount = currentPayment.refundedAmount || 0
        const newTotalRefunded = existingRefundedAmount + refundData.refundedAmount
        updateData.refundedAmount = newTotalRefunded
      }

      // Update other refund data
      if (refundData.stripeRefundId) {
        updateData.stripeRefundId = refundData.stripeRefundId
      }
      if (refundData.refundReceiptUrl) {
        updateData.refundReceiptUrl = refundData.refundReceiptUrl
      }

      // Append to notes if exists
      const newNote = `Refund processed: ${refundData.stripeRefundId} for ${refundData.refundedAmount} USD`
      if (currentPayment.notes) {
        updateData.notes = currentPayment.notes + '\n' + newNote
      } else {
        updateData.notes = newNote
      }
    }

    const updatedPayment = await payload.update({
      collection: 'tour_booking_payments',
      id: paymentId,
      data: updateData,
    })

    return { success: true, payment: updatedPayment }
  } catch (error) {
    console.error('Payment refund status update error:', error)
    return { success: false, error: 'Failed to update payment refund status' }
  }
}

/**
 * Calculate total amount paid and available for refund
 */
export async function calculateRefundableAmount(
  bookingId: string,
  bookingType: 'tour' | 'tour' = 'tour',
) {
  try {
    const paymentsResult = await getAllBookingPayments(bookingId, bookingType)
    if ('error' in paymentsResult) {
      return paymentsResult
    }

    const { payments } = paymentsResult

    let totalPaid = 0
    let totalAlreadyRefunded = 0
    const refundablePayments = []

    for (const payment of payments) {
      totalPaid += payment.amount || 0

      // Track already refunded amounts
      const refundedAmount = payment.refundedAmount || 0
      totalAlreadyRefunded += refundedAmount

      // Check if payment has remaining refundable amount
      const remainingAmount = (payment.amount || 0) - refundedAmount

      // Collect payments that can still be refunded (have remaining amount and not pending)
      if (remainingAmount > 0 && payment.refundStatus !== 'pending') {
        // Clone the payment and adjust the amount to only the refundable portion
        const refundablePayment = { ...payment, amount: remainingAmount }
        refundablePayments.push(refundablePayment)
      }
    }

    const availableForRefund = totalPaid - totalAlreadyRefunded

    return {
      totalPaid,
      totalAlreadyRefunded,
      availableForRefund,
      refundablePayments,
      allPayments: payments,
    }
  } catch (error) {
    console.error('Refundable amount calculation error:', error)
    return { error: 'Failed to calculate refundable amount', statusCode: 500 }
  }
}

/**
 * Get payments to refund for a specific amount
 * This function determines which payments to refund and how much from each
 */
export async function getPaymentsToRefund(
  bookingId: string,
  refundAmount: number,
  bookingType: 'tour' | 'tour' = 'tour',
) {
  try {
    const refundableResult = await calculateRefundableAmount(bookingId, bookingType)
    if ('error' in refundableResult) {
      return refundableResult
    }

    // Type check to ensure we have the correct response structure
    if (!('availableForRefund' in refundableResult)) {
      return {
        error: 'Invalid response from payment calculation',
        statusCode: 500,
      }
    }

    const { availableForRefund, refundablePayments } = refundableResult

    // Check if we have enough funds to refund
    if (refundAmount > availableForRefund) {
      return {
        error: `Refund amount ($${refundAmount}) exceeds available refund amount ($${availableForRefund})`,
        statusCode: 400,
      }
    }

    // Calculate which payments to refund and how much from each
    let remainingRefund = refundAmount
    const paymentsToRefund = []

    // Start with most recent payments first
    for (const payment of refundablePayments) {
      if (remainingRefund <= 0) break

      const paymentIntentId = payment?.stripeDetails?.stripePaymentIntentId
      if (!paymentIntentId) {
        continue
      }

      const refundFromThisPayment = Math.min(remainingRefund, payment.amount)

      paymentsToRefund.push({
        payment,
        paymentIntentId,
        refundAmount: refundFromThisPayment,
      })

      remainingRefund -= refundFromThisPayment
    }

    if (remainingRefund > 0) {
      return {
        error: `Unable to process full refund. Missing $${remainingRefund} in refundable payments`,
        statusCode: 400,
      }
    }

    return {
      paymentsToRefund,
      totalRefundAmount: refundAmount,
      availableForRefund,
    }
  } catch (error) {
    console.error('Get payments to refund error:', error)
    return { error: 'Failed to determine payments to refund', statusCode: 500 }
  }
}

/**
 * Get original tour date for refund calculation
 */
export async function getOriginalTourDate(
  booking: TourBooking,
): Promise<{ tourDate?: string; error?: string; statusCode?: number }> {
  try {
    const originalTourId = typeof booking.tour === 'object' ? booking.tour.id : booking.tour

    const originalTour = await payload.findByID({
      collection: 'tours',
      id: originalTourId,
      depth: 2,
    })

    if (!originalTour) {
      return { error: 'Original tour not found', statusCode: 404 }
    }

    // With new schema, get tour date from booking details
    if (
      booking.pickupDetails &&
      typeof booking.pickupDetails === 'object' &&
      'tourDateTime' in booking.pickupDetails
    ) {
      const tourDateTime = (booking.pickupDetails as any).tourDateTime
      if (typeof tourDateTime === 'string') {
        return { tourDate: tourDateTime }
      }
    }

    return { error: 'Tour date not found in booking details', statusCode: 404 }
  } catch (error) {
    console.error('Original tour date fetch error:', error)
    return { error: 'Failed to fetch original tour date', statusCode: 500 }
  }
}
