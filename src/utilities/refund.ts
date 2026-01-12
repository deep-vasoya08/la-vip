/**
 * Utility functions for handling payment refunds
 */
import stripe from '@/lib/stripe'
import { formatAmountForStripe } from '@/lib/stripe-helpers'
import { getPayload } from 'payload'
import config from '../payload.config'

/**
 * Get the refund status label for display purposes
 *
 * @param status - The refund status value from the database
 * @returns A user-friendly label for the refund status
 */
export function getRefundStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    not_refunded: 'Not Refunded',
    pending: 'Refund Pending',
    refunded: 'Refunded',
    failed: 'Refund Failed',
  }

  return statusMap[status] || 'Unknown'
}

/**
 * Calculate the refundable amount based on booking policies
 * Based on business rules: Full refund if more than 12 hours before event, 50% if within 12 hours
 *
 * @param paymentAmount - The original payment amount
 * @param eventDate - The date of the event
 * @returns The calculated refundable amount and percentage
 */
export function calculateRefundableAmount(
  paymentAmount: number,
  eventDate: string,
): { amount: number; percentage: number } {
  console.log('calculateRefundableAmount eventDate', eventDate)
  // Convert both dates to UTC to ensure consistent timezone comparison
  const now = new Date()

  // Convert the eventDate string to a Date object
  const eventDateObj = new Date(eventDate)

  // Create Date objects with UTC time values
  const nowUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    ),
  )

  const eventDateUtc = new Date(
    Date.UTC(
      eventDateObj.getUTCFullYear(),
      eventDateObj.getUTCMonth(),
      eventDateObj.getUTCDate(),
      eventDateObj.getUTCHours(),
      eventDateObj.getUTCMinutes(),
      eventDateObj.getUTCSeconds(),
    ),
  )

  // Calculate hours until event using UTC timestamps
  const hoursUntilEvent = (eventDateUtc.getTime() - nowUtc.getTime()) / (1000 * 60 * 60)

  // Business rule: If event is more than 12 hours away, full refund (100%)
  if (hoursUntilEvent > 12) {
    return {
      amount: paymentAmount,
      percentage: 1,
    }
  }

  // Business rule: If event is 12 hours or less away but hasn't started yet, partial refund (50%)
  if (hoursUntilEvent > 0) {
    return {
      amount: paymentAmount * 0.5,
      percentage: 0.5,
    }
  }

  // If the event has already started/passed, no refund
  return {
    amount: 0,
    percentage: 0,
  }
}

/**
 * Interface for the refund process params
 */
interface RefundParams {
  paymentIntentId: string
  paymentId: string | number
  paymentAmount: number
  bookingId: string
  eventDate: string
  reason: string
  bookingType: 'event' | 'tour'
  isDowngrade?: boolean // For downgrades, bypass time-based policies
  downgradeDifference?: number // Specific refund amount for downgrades
}

/**
 * Interface for the refund result
 */
export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  percentage: number
  message: string
}

/**
 * Process a refund for a booking
 *
 * @param params - Parameters needed for processing the refund
 * @returns The result of the refund process
 */
export async function processRefund(params: RefundParams): Promise<RefundResult> {
  try {
    const {
      paymentIntentId,
      paymentId,
      paymentAmount,
      bookingId,
      eventDate,
      reason,
      isDowngrade,
      downgradeDifference,
      bookingType,
    } = params

    console.log('Processing single payment refund:', { paymentId, paymentAmount, reason })

    // Get current payment details first
    const payload = await getPayload({ config })
    const collection = bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments'
    const currentPayment = await payload.findByID({
      collection,
      id: paymentId,
    })

    if (!currentPayment) {
      throw new Error('Payment not found')
    }

    // Get existing refunded amount
    const existingRefundedAmount = currentPayment.refundedAmount || 0
    console.log('Current payment status:', {
      existingRefundedAmount,
      paymentStatus: currentPayment.paymentStatus,
      refundStatus: currentPayment.refundStatus,
    })

    let refundAmount: number
    let refundPercentage: number

    if (isDowngrade && downgradeDifference !== undefined) {
      // For downgrades, use the specific downgrade amount (bypass time-based policies)
      refundAmount = Math.abs(downgradeDifference) // Ensure positive value
      refundPercentage = refundAmount / paymentAmount // Calculate percentage for tracking
    } else {
      // For cancellations, use time-based refund policies
      const result = calculateRefundableAmount(paymentAmount, eventDate)
      refundAmount = result.amount
      refundPercentage = result.percentage
    }

    // If no refund is due, throw an error
    if (refundAmount <= 0) {
      throw new Error('This booking is not eligible for a refund')
    }

    // Convert to cents for Stripe
    const refundAmountInCents = formatAmountForStripe(refundAmount)

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountInCents,
      metadata: {
        bookingId,
        paymentId: String(paymentId),
        refundPercentage: `${refundPercentage * 100}%`,
        originalAmount: paymentAmount,
        refundAmount,
        existingRefundedAmount,
        totalRefundedAmount: existingRefundedAmount + refundAmount,
        reason,
        refundType: isDowngrade ? 'downgrade' : 'cancellation',
        ...(isDowngrade && { downgradeDifference }),
      },
    })

    // Calculate new total refunded amount
    const newTotalRefunded = existingRefundedAmount + refundAmount
    console.log('Updating refund amounts:', {
      existing: existingRefundedAmount,
      new: refundAmount,
      total: newTotalRefunded,
    })

    // Prepare notes
    const newNote = isDowngrade
      ? `Downgrade refund initiated: ${refund.id} for $${refundAmount} (price difference). Reason: ${reason}`
      : `Refund initiated: ${refund.id} for $${refundAmount} (${refundPercentage * 100}% of original payment). Reason: ${reason}`

    // Append to existing notes if any
    const updatedNotes = currentPayment.notes ? `${currentPayment.notes}\n${newNote}` : newNote

    // Update payment record in the database
    await payload.update({
      collection,
      id: paymentId,
      data: {
        refundStatus: 'pending', // Will be updated to 'refunded' when webhook confirms
        refundedAmount: newTotalRefunded,
        stripeRefundId: refund.id,
        notes: updatedNotes,
      },
    })

    // Return success information
    return {
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      percentage: refundPercentage * 100,
      message: isDowngrade
        ? 'Downgrade refund initiated'
        : refundPercentage === 1
          ? 'Full refund initiated'
          : 'Partial refund initiated',
    }
  } catch (error) {
    console.error('Refund processing error:', error)
    throw error
  }
}

/**
 * Interface for multi-payment refund params
 */
interface MultiPaymentRefundParams {
  paymentsToRefund: Array<{
    payment: any
    paymentIntentId: string
    refundAmount: number
  }>
  bookingId: string
  eventDate: string
  reason: string
  bookingType: 'event' | 'tour'
  isDowngrade?: boolean
}

/**
 * Process refunds across multiple payments
 */
export async function processMultiPaymentRefund(
  params: MultiPaymentRefundParams,
): Promise<RefundResult> {
  const { paymentsToRefund, bookingId, reason, bookingType, isDowngrade } = params

  try {
    const payload = await getPayload({ config })
    const collection = bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments'
    const refundResults = []
    let totalRefundAmount = 0

    // Process each payment refund
    for (const paymentToRefund of paymentsToRefund) {
      const { payment, paymentIntentId, refundAmount } = paymentToRefund

      // Skip if refund amount is 0
      if (refundAmount <= 0) continue

      // Get current payment details
      const currentPayment = await payload.findByID({
        collection,
        id: payment.id,
      })

      if (!currentPayment) {
        console.error(`Payment ${payment.id} not found, skipping`)
        continue
      }

      // Get existing refunded amount
      const existingRefundedAmount = currentPayment.refundedAmount || 0
      const newTotalRefunded = existingRefundedAmount + refundAmount

      console.log(`Processing refund for payment ${payment.id}:`, {
        existingRefundedAmount,
        newRefundAmount: refundAmount,
        newTotalRefunded,
      })

      // Convert to cents for Stripe
      const refundAmountInCents = formatAmountForStripe(refundAmount)

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmountInCents,
        metadata: {
          bookingId,
          paymentId: String(payment.id),
          refundAmount,
          existingRefundedAmount,
          totalRefundedAmount: newTotalRefunded,
          reason,
          refundType: isDowngrade ? 'downgrade' : 'cancellation',
          multiPaymentRefund: 'true',
        },
      })

      // Prepare notes
      const newNote = isDowngrade
        ? `Downgrade refund initiated: ${refund.id} for $${refundAmount} (partial refund). Reason: ${reason}`
        : `Refund initiated: ${refund.id} for $${refundAmount}. Reason: ${reason}`

      // Append to existing notes if any
      const updatedNotes = currentPayment.notes ? `${currentPayment.notes}\n${newNote}` : newNote

      // Update payment record in the database
      await payload.update({
        collection,
        id: payment.id,
        data: {
          refundStatus: 'pending',
          refundedAmount: newTotalRefunded,
          stripeRefundId: refund.id,
          notes: updatedNotes,
        },
      })

      refundResults.push({
        refundId: refund.id,
        amount: refundAmount,
        paymentId: payment.id,
      })

      totalRefundAmount += refundAmount
    }
    console.log(
      `Multi-payment ${isDowngrade ? 'downgrade' : 'cancellation'} refund initiated`,
      refundResults,
    )
    return {
      success: true,
      refundId: refundResults.map((r) => r.refundId).join(', '),
      amount: totalRefundAmount,
      percentage: 100, // This will be calculated properly if needed
      message: `Refund initiated`,
    }
  } catch (error) {
    console.error('Multi-payment refund processing error:', error)
    throw error
  }
}

/**
 * Update refund status from webhook event
 *
 * @param refundId - The Stripe refund ID
 * @param status - The new refund status (pending, failed, not_refunded, or refunded)
 * @param bookingType - The booking type (event or tour)
 * @param receiptUrl - Optional receipt URL from the refund charge
 * @returns Success status of the update operation
 */
export async function updateRefundStatus(
  refundId: string,
  status: 'pending' | 'failed' | 'not_refunded' | 'refunded',
  bookingType: 'event' | 'tour',
  receiptUrl?: string,
): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    // Find the payment with this refund ID
    const payment = await payload.find({
      collection: bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments',
      where: {
        stripeRefundId: {
          equals: refundId,
        },
      },
    })

    if (!payment.docs[0]) {
      console.error(`No payment found with refund ID ${refundId}`)
      return false
    }

    // Prepare update data
    const updateData: any = {
      refundStatus: status,
    }

    // Add receipt URL to stripeDetails if provided
    if (receiptUrl) {
      updateData.stripeDetails = {
        ...payment.docs[0].stripeDetails,
        refundReceiptUrl: receiptUrl,
      }
    }

    // Update the payment with the new refund status and receipt URL
    await payload.update({
      collection: bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments',
      id: payment.docs[0].id,
      data: updateData,
    })

    return true
  } catch (error) {
    console.error('Error updating refund status:', error)
    return false
  }
}
