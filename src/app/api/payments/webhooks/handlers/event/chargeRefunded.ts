import Stripe from 'stripe'
import { getPayload, User } from 'payload'
import config from '@/payload.config'
import { updateRefundStatus } from '@/utilities/refund'
import { sendRefundEmail } from '@/lib/emailService'

type RefundEventInput = Stripe.Charge | Stripe.Refund

interface EventBookingWithUser {
  id: string | number
  status: string
  bookingReference: string
  user: User | string | number
  event?:
    | {
        id: string | number
        name?: string
      }
    | string
    | number
}

/**
 * Handle Stripe refund-related webhook events for event bookings
 * Updates payment records and booking status in the database
 * Sends confirmation email to customer
 *
 * @param eventData - Either a Stripe.Charge (from charge.refunded) or Stripe.Refund (from charge.refund.updated)
 */
export async function handleEventRefund(eventData: RefundEventInput) {
  const payload = await getPayload({
    config,
  })

  try {
    // Determine whether we're handling a Charge or a Refund object
    const isCharge = (obj: RefundEventInput): obj is Stripe.Charge => {
      return (obj as Stripe.Charge).refunds !== undefined
    }

    // Extract data based on event type
    let refund: Stripe.Refund | null = null
    let paymentIntentId: string | null = null

    if (isCharge(eventData)) {
      // This is a charge.refunded event
      console.log('Processing event refund webhook from charge:', eventData.id)
      paymentIntentId = eventData.payment_intent as string
      refund = eventData.refunds?.data?.[0] || null
    } else {
      // This is a charge.refund.updated event
      console.log('Processing event refund webhook from refund update:', eventData.id)
      paymentIntentId = eventData.payment_intent as string
      refund = eventData
    }

    if (!paymentIntentId) {
      console.log('No payment intent ID found')
      return
    }

    // Find payment by payment intent
    const payments = await payload.find({
      collection: 'event_booking_payments',
      where: {
        'stripeDetails.stripePaymentIntentId': {
          equals: paymentIntentId,
        },
      },
      depth: 3,
    })

    if (payments.docs.length === 0) {
      console.log(`No event payment found for payment intent: ${paymentIntentId}`)
      return
    }

    const payment = payments.docs[0]
    // Handle both cases where booking can be a number (ID) or an object (with id property)
    const booking = Array.isArray(payment?.booking) ? payment?.booking[0] : payment?.booking
    const bookingId = typeof booking === 'object' ? booking?.id : booking

    // Ensure we have refund data
    if (!refund) {
      console.log('No refund data available')
      return
    }

    console.log(`Processing event refund: ${refund.id} for payment: ${payment?.id}`)

    // Get receipt URL from refund charge
    let refundReceiptUrl = null
    if (isCharge(eventData) && eventData.receipt_url) {
      refundReceiptUrl = eventData.receipt_url
    }

    // Use our utility function to update the refund status
    const updated = await updateRefundStatus(
      refund.id,
      'refunded',
      'event',
      refundReceiptUrl || undefined,
    )

    if (!updated) {
      console.log(`Failed to update refund status for refund ID: ${refund.id}`)

      // Fallback: Update payment record directly with receipt URL
      const updateData: any = {
        refundStatus: 'refunded',
        stripeRefundId: refund.id,
        notes: `${payment?.notes || ''}\nRefund processed: ${refund.id} for ${
          refund.amount / 100
        } ${refund.currency.toUpperCase()}`,
      }

      // Add receipt URL to stripeDetails if available
      if (refundReceiptUrl) {
        updateData.stripeDetails = {
          ...payment?.stripeDetails,
          receiptUrl: refundReceiptUrl,
        }
      }

      await payload.update({
        collection: 'event_booking_payments',
        id: Number(payment?.id),
        data: updateData,
      })
    } else {
      // If utility function succeeded, still update receipt URL separately
      if (refundReceiptUrl) {
        await payload.update({
          collection: 'event_booking_payments',
          id: Number(payment?.id),
          data: {
            stripeDetails: {
              ...payment?.stripeDetails,
              receiptUrl: refundReceiptUrl,
            },
          },
        })
      }
    }

    // Make sure booking status is cancelled
    if (bookingId) {
      const booking = (await payload.findByID({
        collection: 'event_bookings',
        id: bookingId,
        depth: 2,
      })) as EventBookingWithUser

      // if (booking && booking.status !== 'cancelled') {
      //   await payload.update({
      //     collection: 'event_bookings',
      //     id: bookingId,
      //     data: {
      //       status: 'cancelled',
      //     },
      //   })
      // }

      // Send professional refund confirmation email
      if (booking?.user) {
        let userEmail: string | undefined
        let userName: string | undefined
        let userId: string | number | undefined

        if (typeof booking.user === 'object') {
          userEmail = booking.user.email
          userName = booking.user.name || booking.user.email
          userId = booking.user.id
        } else {
          // If user is just an ID, fetch the full user details
          try {
            const user = await payload.findByID({
              collection: 'users' as const,
              id: typeof booking.user === 'string' ? parseInt(booking.user) : booking.user,
            })
            userEmail = user.email
            userName = user.name || user.email
            userId = user.id
          } catch (error) {
            console.error('Error fetching user details:', error)
          }
        }

        if (userEmail) {
          try {
            // Get event name
            let bookingName = 'VIP Experience'
            if (typeof booking.event === 'object' && booking.event?.name) {
              bookingName = booking.event.name
            }

            let userPhoneNumber = ''
            if (typeof booking.user === 'object' && booking.user?.phoneNumber) {
              userPhoneNumber = booking.user.phoneNumber
            }

            const emailResult = await sendRefundEmail({
              customerName: userName || userEmail,
              customerEmail: userEmail,
              customerPhoneNumber: userPhoneNumber,
              bookingReference: booking.bookingReference,
              bookingType: 'event',
              bookingName: bookingName,
              refundAmount: `$${(refund.amount / 100).toFixed(2)}`,
              refundId: refund.id,
              userId: userId,
            })

            if (emailResult.success) {
              console.log('Event refund confirmation email sent successfully')
            } else {
              console.error('Failed to send event refund confirmation email')
            }

            // Console logging with refund details
            console.log('\n' + '='.repeat(60))
            console.log('💸 EVENT REFUND PROCESSED!')
            console.log('='.repeat(60))
            console.log(`📋 Booking ID: ${bookingId}`)
            console.log(`💰 Refund Amount: $${(refund.amount / 100).toFixed(2)}`)
            console.log(`🔑 Refund ID: ${refund.id}`)
            console.log(`✅ Status: REFUNDED`)

            const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
            console.log('\n🔗 QUICK ACCESS LINKS:')
            console.log(
              `📊 Admin Booking: ${baseUrl}/admin/collections/event_bookings/${bookingId}`,
            )
            console.log(`💳 Payment Details: ${baseUrl}/admin/collections/event_booking_payments`)
            console.log(`🔐 Login Page (if needed): ${baseUrl}/auth/login`)

            if (refundReceiptUrl) {
              console.log(`🧾 Refund Receipt URL: ${refundReceiptUrl}`)
            }
            console.log('='.repeat(60) + '\n')
          } catch (error) {
            console.error('Error sending event refund confirmation email:', error)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing event refund webhook:', error)
    throw error
  }
}
