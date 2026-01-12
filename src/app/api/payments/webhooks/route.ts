import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import {
  handleEventPaymentSucceeded,
  handleEventPaymentFailed,
  handleTourPaymentSucceeded,
  handleTourPaymentFailed,
} from './handlers'
import { handleEventRefund } from './handlers/event/chargeRefunded'
import { handleTourRefund } from './handlers/tour/chargeRefunded'

// Initialize the Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// This is your Stripe webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing Stripe signature or webhook secret' },
        { status: 400 },
      )
    }

    console.log('webhook body', body)

    // Verify the event came from Stripe
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    // Type guard to check if the object has metadata with bookingId and bookingType
    const hasBookingMetadata = (
      obj: unknown,
    ): obj is { metadata: { bookingId: string; bookingType?: string } } => {
      return (
        obj !== null &&
        typeof obj === 'object' &&
        'metadata' in obj &&
        obj.metadata !== null &&
        typeof obj.metadata === 'object' &&
        'bookingId' in obj.metadata
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        if (hasBookingMetadata(event.data.object)) {
          const bookingType = event.data.object.metadata.bookingType || 'event'
          if (bookingType === 'tour') {
            await handleTourPaymentSucceeded(event.data.object)
          } else {
            await handleEventPaymentSucceeded(event.data.object)
          }
        }
        break
      case 'payment_intent.payment_failed':
        if (hasBookingMetadata(event.data.object)) {
          const bookingType = event.data.object.metadata.bookingType || 'event'
          if (bookingType === 'tour') {
            await handleTourPaymentFailed(event.data.object)
          } else {
            await handleEventPaymentFailed(event.data.object)
          }
        }
        break
      case 'charge.refunded':
        console.log('Refund webhook received, processing refund...')
        // Determine booking type from metadata
        const bookingType = event.data.object.metadata?.bookingType || 'event'
        if (bookingType === 'tour') {
          await handleTourRefund(event.data.object)
        } else {
          await handleEventRefund(event.data.object)
        }
        break
      case 'charge.refund.updated':
        console.log('Refund status updated, processing update...')
        try {
          // Determine booking type from metadata
          const refundBookingType = event.data.object.metadata?.bookingType || 'event'
          if (refundBookingType === 'tour') {
            await handleTourRefund(event.data.object)
          } else {
            await handleEventRefund(event.data.object)
          }
          console.log('Refund update processed successfully')
        } catch (error) {
          console.error('Error processing refund update:', error)
        }
        break
      case 'charge.updated':
        if (hasBookingMetadata(event.data.object)) {
          const bookingType = event.data.object.metadata.bookingType || 'event'
          console.log(`Charge updated for ${bookingType} booking:`, event.data.object.id)

          // Update payment record with receipt URL if available
          if (event.data.object.receipt_url) {
            await updatePaymentReceiptUrl(event.data.object, bookingType)
          }
        }
        break
      // Handle payment_intent.canceled which can happen with refunds
      case 'payment_intent.canceled':
        // Type guard to check if the object has metadata with refundId
        const hasRefundId = (obj: unknown): obj is { metadata: { refundId: string } } => {
          return (
            obj !== null &&
            typeof obj === 'object' &&
            'metadata' in obj &&
            obj.metadata !== null &&
            typeof obj.metadata === 'object' &&
            'refundId' in obj.metadata
          )
        }

        if (hasRefundId(event.data.object)) {
          console.log(
            'This cancellation is related to a refund:',
            event.data.object.metadata.refundId,
          )
        }
        break
      default:
        console.log(
          `Unhandled event type: ${event.type}`,
          JSON.stringify(event.data.object).substring(0, 200) + '...',
        )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Helper function to update payment record with receipt URL
async function updatePaymentReceiptUrl(charge: Stripe.Charge, bookingType: string) {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@/payload.config')).default
    const payload = await getPayload({ config })

    const collection = bookingType === 'tour' ? 'tour_booking_payments' : 'event_booking_payments'
    const bookingId = charge.metadata.bookingId

    if (!bookingId) return

    // Find payment record by booking ID
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
      sort: '-createdAt',
      limit: 1,
    })

    if (payments?.docs.length > 0) {
      const paymentRecord = payments.docs[0]

      if (paymentRecord) {
        // Update with receipt URL
        await payload.update({
          collection,
          id: paymentRecord.id,
          data: {
            stripeDetails: {
              ...paymentRecord.stripeDetails,
              receiptUrl: charge.receipt_url,
            },
          },
        })

        console.log(`✅ Receipt URL updated for ${bookingType} payment:`, charge.receipt_url)
      }
    }
  } catch (error) {
    console.error('Error updating receipt URL:', error)
  }
}
