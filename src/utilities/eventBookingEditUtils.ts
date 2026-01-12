import { getPayload } from 'payload'
import config from '@/payload.config'
import { EventBooking, User } from '@/payload-types'
import { getAllBookingPayments } from './paymentUtils'

const payload = await getPayload({ config })

/**
 * Interface for booking edit data
 */
export interface EditBookingData {
  eventId: string
  scheduleId: string
  adultCount: number
  childCount: number
  pickupLocationId: string
  pickupTimeId: string
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
 * Interface for booking validation result
 */
export interface BookingValidationResult {
  isValid: boolean
  booking?: EventBooking
  user?: User
  error?: string
  statusCode?: number
}

/**
 * Calculate price difference for booking edit
 */
export async function calculatePriceDifference(
  booking: EventBooking,
  editData: EditBookingData,
): Promise<PriceCalculationResult | { error: string; statusCode: number }> {
  try {
    // Get the new event details
    const event = await payload.findByID({
      collection: 'events',
      id: editData.eventId,
      depth: 2,
    })

    if (!event) {
      return { error: 'Event not found', statusCode: 404 }
    }

    // Find the selected schedule
    const selectedSchedule = event.schedules?.find(
      (schedule: any) => schedule.id === editData.scheduleId,
    )

    if (!selectedSchedule) {
      return { error: 'Schedule not found', statusCode: 404 }
    }

    // Find the selected pickup location
    const selectedPickup = selectedSchedule.pickups?.find(
      (pickup: any) => pickup.id === editData.pickupLocationId,
    )

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
    const event = await payload.findByID({
      collection: 'events',
      id: editData.eventId,
      depth: 2,
    })

    if (!event) {
      return { isValid: false, error: 'Event not found', statusCode: 404 }
    }

    const selectedSchedule = event.schedules?.find(
      (schedule: any) => schedule.id === editData.scheduleId,
    )

    if (!selectedSchedule) {
      return { isValid: false, error: 'Schedule not found', statusCode: 404 }
    }

    const selectedPickup = selectedSchedule.pickups?.find(
      (pickup: any) => pickup.id === editData.pickupLocationId,
    )

    if (!selectedPickup) {
      return { isValid: false, error: 'Pickup location not found', statusCode: 404 }
    }

    const selectedPickupTime = selectedPickup.pickup_times?.find(
      (time: any) => time.id === editData.pickupTimeId,
    )

    if (!selectedPickupTime) {
      return { isValid: false, error: 'Pickup time not found', statusCode: 404 }
    }

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
  originalBooking: EventBooking,
): Promise<{ success: boolean; booking?: EventBooking; error?: string }> {
  try {
    const updatedBooking = await payload.update({
      collection: 'event_bookings',
      id: bookingId,
      data: {
        event: Number(editData.eventId),
        scheduleId: editData.scheduleId,
        adultCount: editData.adultCount,
        childCount: editData.childCount,
        pickupDetails: {
          locationId: editData.pickupLocationId,
          hotelId: editData.hotelId || null,
          selectedTimeId: editData.pickupTimeId,
        },
        pricing: newPricing,
        notes: originalBooking.notes
          ? `${originalBooking.notes}\n\nBooking updated on ${new Date().toISOString()}`
          : `Booking updated on ${new Date().toISOString()}`,
      },
      depth: 2,
    })

    return { success: true, booking: updatedBooking }
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
      collection: 'event_booking_payments',
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
      collection: 'event_booking_payments',
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
    console.log('Updating payment refund status:', { paymentId, refundStatus, refundData })

    // First get the current payment to check existing refund amount
    const currentPayment = await payload.findByID({
      collection: 'event_booking_payments',
      id: paymentId,
    })

    if (!currentPayment) {
      console.log('Payment not found:', paymentId)
      return { success: false, error: 'Payment not found' }
    }

    const updateData: any = { refundStatus }

    if (refundData) {
      // Add new refund amount to existing refunded amount
      if (refundData.refundedAmount) {
        const existingRefundedAmount = currentPayment.refundedAmount || 0
        const newTotalRefunded = existingRefundedAmount + refundData.refundedAmount
        console.log('Updating refund amount:', {
          existing: existingRefundedAmount,
          new: refundData.refundedAmount,
          total: newTotalRefunded,
        })
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

    console.log('Updating payment with data:', updateData)

    const updatedPayment = await payload.update({
      collection: 'event_booking_payments',
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
  bookingType: 'event' | 'tour' = 'event',
) {
  try {
    console.log(`=== Calculating refundable amount for booking ${bookingId} ===`)
    const paymentsResult = await getAllBookingPayments(bookingId, bookingType)
    if ('error' in paymentsResult) {
      console.log('Error getting payments:', paymentsResult.error)
      return paymentsResult
    }

    const { payments } = paymentsResult
    console.log(`Found ${payments.length} total payments`)

    let totalPaid = 0
    let totalAlreadyRefunded = 0
    const refundablePayments = []

    for (const payment of payments) {
      console.log(`Processing payment:`, {
        id: payment.id,
        amount: payment.amount,
        status: payment.paymentStatus,
        refundStatus: payment.refundStatus,
        refundedAmount: payment.refundedAmount,
      })

      totalPaid += payment.amount || 0

      // Track already refunded amounts
      const refundedAmount = payment.refundedAmount || 0
      totalAlreadyRefunded += refundedAmount

      // Check if payment has remaining refundable amount
      const remainingAmount = (payment.amount || 0) - refundedAmount
      console.log(`Payment ${payment.id} remaining amount: $${remainingAmount}`)

      // Collect payments that can still be refunded (have remaining amount and not pending)
      if (remainingAmount > 0 && payment.refundStatus !== 'pending') {
        console.log(`Adding refundable payment: $${remainingAmount} from payment ${payment.id}`)
        // Clone the payment and adjust the amount to only the refundable portion
        const refundablePayment = { ...payment, amount: remainingAmount }
        refundablePayments.push(refundablePayment)
      }
    }

    const availableForRefund = totalPaid - totalAlreadyRefunded
    console.log('Refund calculation summary:', {
      totalPaid,
      totalAlreadyRefunded,
      availableForRefund,
      refundablePaymentsCount: refundablePayments.length,
      refundablePayments: refundablePayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        originalAmount: payments.find((op) => op.id === p.id)?.amount,
      })),
    })

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
  bookingType: 'event' | 'tour' = 'event',
) {
  try {
    console.log(`=== Getting payments to refund for booking ${bookingId} ===`)
    console.log(`Requested refund amount: $${refundAmount}`)

    const refundableResult = await calculateRefundableAmount(bookingId, bookingType)
    if ('error' in refundableResult) {
      console.log('Error calculating refundable amount:', refundableResult.error)
      return refundableResult
    }

    // Type check to ensure we have the correct response structure
    if (!('availableForRefund' in refundableResult)) {
      console.log('Invalid response structure from calculateRefundableAmount')
      return {
        error: 'Invalid response from payment calculation',
        statusCode: 500,
      }
    }

    const { availableForRefund, refundablePayments } = refundableResult
    console.log('Available for refund:', {
      amount: availableForRefund,
      paymentsCount: refundablePayments.length,
    })

    // Check if we have enough funds to refund
    if (refundAmount > availableForRefund) {
      console.log(
        `Refund amount ($${refundAmount}) exceeds available amount ($${availableForRefund})`,
      )
      return {
        error: `Refund amount ($${refundAmount}) exceeds available refund amount ($${availableForRefund})`,
        statusCode: 400,
      }
    }

    // Calculate which payments to refund and how much from each
    let remainingRefund = refundAmount
    const paymentsToRefund = []

    // Start with most recent payments first
    console.log('Processing payments for refund allocation...')
    for (const payment of refundablePayments) {
      if (remainingRefund <= 0) break

      const paymentIntentId = payment?.stripeDetails?.stripePaymentIntentId
      if (!paymentIntentId) {
        console.log(`Skipping payment ${payment.id} - No payment intent ID`)
        continue
      }

      const refundFromThisPayment = Math.min(remainingRefund, payment.amount)
      console.log('Allocating refund from payment:', {
        paymentId: payment.id,
        paymentAmount: payment.amount,
        refundAmount: refundFromThisPayment,
        remainingAfter: remainingRefund - refundFromThisPayment,
      })

      paymentsToRefund.push({
        payment,
        paymentIntentId,
        refundAmount: refundFromThisPayment,
      })

      remainingRefund -= refundFromThisPayment
    }

    if (remainingRefund > 0) {
      console.log(`Unable to allocate full refund. Missing amount: $${remainingRefund}`)
      return {
        error: `Unable to process full refund. Missing $${remainingRefund} in refundable payments`,
        statusCode: 400,
      }
    }

    console.log('Successfully allocated refund:', {
      numberOfPayments: paymentsToRefund.length,
      totalRefundAmount: refundAmount,
      availableForRefund,
    })

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
 * Get original event date for refund calculation
 */
export async function getOriginalEventDate(
  booking: EventBooking,
): Promise<{ eventDate?: string; error?: string; statusCode?: number }> {
  try {
    const originalEventId = typeof booking.event === 'object' ? booking.event.id : booking.event

    const originalEvent = await payload.findByID({
      collection: 'events',
      id: originalEventId,
      depth: 2,
    })

    if (!originalEvent) {
      return { error: 'Original event not found', statusCode: 404 }
    }

    const originalSchedule = originalEvent.schedules?.find(
      (schedule: any) => schedule.id === booking.scheduleId,
    )

    if (!originalSchedule) {
      return { error: 'Original schedule not found', statusCode: 404 }
    }

    return { eventDate: originalSchedule.event_date_time }
  } catch (error) {
    console.error('Original event date fetch error:', error)
    return { error: 'Failed to fetch original event date', statusCode: 500 }
  }
}
