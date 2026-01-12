import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Handle failed event payment
export async function handleEventPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payload = await getPayload({
    config,
  })
  try {
    const payments = await payload.find({
      collection: 'event_booking_payments',
      where: {
        'stripeDetails.stripePaymentIntentId': {
          equals: paymentIntent.id,
        },
      },
    })

    if (payments.docs.length > 0 && payments.docs[0]) {
      const paymentId = payments.docs[0].id

      // Update payment record
      await payload.update({
        collection: 'event_booking_payments',
        id: paymentId,
        data: {
          paymentStatus: 'failed',
          notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        },
      })
    }
  } catch (error) {
    console.error('Error handling event payment failure:', error)
  }
}
