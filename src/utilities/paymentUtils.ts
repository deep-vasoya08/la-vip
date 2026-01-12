import stripe from '@/lib/stripe'
import { formatAmountForStripe } from '@/lib/stripe-helpers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { User } from '@/payload-types'
import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'

const payload = await getPayload({ config })

/**
 * Create or get Stripe customer for a user
 */
export async function createOrGetStripeCustomer(user: User): Promise<string> {
  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    })

    customerId = customer.id

    // Update user with stripe customer ID
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        stripeCustomerId: customerId,
      },
    })
  }

  return customerId
}

/**
 * Create payment intent for upcharge
 */
export async function createUpchargePaymentIntent(
  amount: number,
  customerId: string,
  bookingType: 'event' | 'tour',
  metadata: Record<string, any>,
): Promise<{ paymentIntent: any; paymentReference: string }> {
  // Format amount for Stripe (convert to cents)
  const amountInCents = formatAmountForStripe(amount)

  // Create payment intent for the upcharge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  // Generate a unique payment reference
  const paymentReference = PAYMENT_REFERENCE_STRING(
    bookingType === 'tour' ? 'tour-upcharge' : 'event-upcharge',
  )

  return { paymentIntent, paymentReference }
}

/**
 * Create payment record in database
 */
export async function createPaymentRecord(
  collection: 'event_booking_payments' | 'tour_booking_payments',
  data: {
    paymentReference: string
    bookingId: string
    userId: number
    amount: number
    paymentIntentId: string
    customerId: string
    notes?: string
    paymentType?: 'regular' | 'upcharge'
  },
) {
  return await payload.create({
    collection,
    data: {
      paymentReference: data.paymentReference,
      booking: [Number(data.bookingId)],
      user: data.userId,
      amount: data.amount,
      currency: 'USD',
      paymentStatus: 'pending',
      paymentMethod: 'card',
      stripeDetails: {
        stripePaymentIntentId: data.paymentIntentId,
        stripeCustomerId: data.customerId,
        metadata: {
          paymentType: data.paymentType || 'regular',
        },
      },
      notes: data.notes || `Payment for booking ${data.bookingId}`,
    },
  })
}

/**
 * Handle the complete upcharge payment flow
 */
export async function processUpchargePayment(
  bookingId: string,
  userId: number,
  amount: number,
  user: User,
  bookingType: 'event' | 'tour',
  metadata: Record<string, any>,
) {
  try {
    // Get or create Stripe customer
    const customerId = await createOrGetStripeCustomer(user)

    // Create payment intent
    const { paymentIntent, paymentReference } = await createUpchargePaymentIntent(
      amount,
      customerId,
      bookingType,
      {
        ...metadata,
        paymentType: 'upcharge',
      },
    )

    // Create payment record
    const collection = bookingType === 'event' ? 'event_booking_payments' : 'tour_booking_payments'
    const paymentRecord = await createPaymentRecord(collection, {
      paymentReference,
      bookingId,
      userId,
      amount,
      paymentIntentId: paymentIntent.id,
      customerId,
      paymentType: 'upcharge',
      notes: `Upcharge payment for ${bookingType} booking edit - Additional amount: $${amount}`,
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: paymentRecord.id,
      amount,
    }
  } catch (error) {
    console.error('Upcharge payment processing error:', error)
    throw new Error('Failed to process upcharge payment')
  }
}

/**
 * Format amount for display
 */
export function formatAmountForDisplay(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate percentage difference between two amounts
 */
export function calculatePercentageDifference(
  originalAmount: number,
  newAmount: number,
): { difference: number; percentage: number; type: 'increase' | 'decrease' | 'no_change' } {
  const difference = newAmount - originalAmount
  const percentage = originalAmount > 0 ? (difference / originalAmount) * 100 : 0

  let type: 'increase' | 'decrease' | 'no_change'
  if (difference > 0) {
    type = 'increase'
  } else if (difference < 0) {
    type = 'decrease'
  } else {
    type = 'no_change'
  }

  return { difference, percentage, type }
}

/**
 * Get ALL payments for a booking (not just the latest)
 */
export async function getAllBookingPayments(
  bookingId: string,
  bookingType: 'event' | 'tour' = 'event',
) {
  try {
    const collection = bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments'
    const payments = await payload.find({
      collection,
      where: {
        booking: {
          in: [Number(bookingId)],
        },
        paymentStatus: {
          equals: 'completed',
        },
      },
      limit: 100, // Get all payments
      sort: '-createdAt', // Most recent first
    })

    if (!payments.docs || payments.docs.length === 0) {
      return { error: 'No completed payments found for this booking', statusCode: 400 }
    }

    return { payments: payments.docs }
  } catch (error) {
    console.error('All payments fetch error:', error)
    return { error: 'Failed to fetch booking payments', statusCode: 500 }
  }
}
