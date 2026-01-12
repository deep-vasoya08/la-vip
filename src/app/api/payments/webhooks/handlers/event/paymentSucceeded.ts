import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBookingConfirmationEmail } from '@/lib/emailService'
import { formatEventBookingForEmail } from '@/utilities/bookingEmailUtils'
import { scheduleFollowupForBooking } from '@/utilities/shopperApprovedUtils'
import { handleEventUpchargePaymentSucceeded } from './upchargePaymentSucceeded'

// Handle successful event payment
export async function handleEventPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const payload = await getPayload({
    config,
  })
  try {
    const { bookingId, paymentType } = paymentIntent.metadata

    // Check if this is an upcharge payment
    if (paymentType === 'upcharge') {
      await handleEventUpchargePaymentSucceeded(paymentIntent)
      return
    }

    // Handle regular event booking payment
    // Find the payment record
    const payments = await payload.find({
      collection: 'event_booking_payments',
      where: {
        'stripeDetails.stripePaymentIntentId': {
          equals: paymentIntent.id,
        },
      },
    })

    if (payments?.docs.length > 0 && payments?.docs[0]) {
      const paymentId = payments?.docs[0].id

      // Get receipt URL from the latest charge
      let receiptUrl = null
      if (paymentIntent.latest_charge) {
        if (typeof paymentIntent.latest_charge === 'string') {
          // If latest_charge is a string ID, we need to retrieve the charge object
          try {
            const stripe = (await import('@/lib/stripe')).default
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge)
            receiptUrl = charge.receipt_url
          } catch (error) {
            console.error('Error retrieving charge for receipt URL:', error)
          }
        } else if (typeof paymentIntent.latest_charge === 'object') {
          // If latest_charge is already an object, get receipt_url directly
          receiptUrl = paymentIntent.latest_charge.receipt_url
        }
      }

      // Update payment record
      await payload.update({
        collection: 'event_booking_payments',
        id: paymentId,
        data: {
          paymentStatus: 'completed',
          paymentDate: new Date().toISOString(),
          transactionId: paymentIntent.id,
          stripeDetails: {
            receiptUrl: receiptUrl,
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: paymentIntent.customer as string,
            paymentMethodType: paymentIntent.payment_method_types?.[0] || 'card',
          },
        },
      })

      // Update booking status to confirmed
      const updatedBooking = await payload.update({
        collection: 'event_bookings',
        id: Number(bookingId),
        data: {
          status: 'confirmed',
        },
        depth: 2,
      })

      console.log('\n' + '='.repeat(60))
      console.log('💳 EVENT PAYMENT COMPLETED!')
      console.log('='.repeat(60))
      console.log(`📋 Booking ID: ${bookingId}`)
      console.log(`💰 Amount: $${(paymentIntent.amount / 100).toFixed(2)}`)
      console.log(`🔑 Payment Intent: ${paymentIntent.id}`)
      console.log(`✅ Status: CONFIRMED`)

      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      console.log('\n🔗 QUICK ACCESS LINKS:')
      console.log(`📊 Admin Booking: ${baseUrl}/admin/collections/event_bookings/${bookingId}`)
      console.log(`👤 Customer View: ${baseUrl}/my-account/events/${bookingId}`)
      console.log(`💳 Payment Details: ${baseUrl}/admin/collections/event_booking_payments`)
      console.log(`🔐 Login Page (if needed): ${baseUrl}/auth/login`)

      if (receiptUrl) {
        console.log(`🧾 Receipt URL: ${receiptUrl}`)
      }

      console.log('\n📧 SENDING CONFIRMATION EMAIL...')

      // Send professional booking confirmation email after payment success
      try {
        const emailData = await formatEventBookingForEmail(updatedBooking)
        console.log('===== EMAIL DATA =====', emailData)
        const emailResult = await sendBookingConfirmationEmail({
          ...emailData,
          bookingType: 'event',
        })

        if (emailResult.success) {
          console.log(`✅ Event booking confirmation email sent to ${emailData.customerEmail}`)
        } else {
          console.error('❌ Failed to send event booking confirmation email:', emailResult.error)
        }

        // Submit booking to Shopper Approved for review email collection
        // console.log('===== SUBMITTING TO SHOPPER APPROVED =====')
        // try {
        //   const reviewResult = await sendEventReviewRequest(
        //     bookingId?.toString() || '',
        //     emailData.customerName,
        //     emailData.customerEmail,
        //     emailData.bookingDetails.name,
        //     emailData.bookingDetails.date,
        //     emailData.bookingDetails.totalAmount,
        //   )

        //   if (reviewResult.success) {
        //     console.log(
        //       `✅ Event booking submitted to Shopper Approved for ${emailData.customerEmail}`,
        //     )
        //     console.log('📧 Customer will receive review request email in 3-5 days')
        //   } else {
        //     console.error('❌ Failed to submit to Shopper Approved:', reviewResult.error)
        //   }
        // } catch (shopperError) {
        //   console.error('❌ Error submitting to Shopper Approved:', shopperError)
        // }
      } catch (emailError) {
        console.error('❌ Error sending event booking confirmation email:', emailError)
      }

      // Submit to Shopper Approved immediately with followup set to 48h after service date
      try {
        const sa = await scheduleFollowupForBooking({ kind: 'event', booking: updatedBooking })
        if (!sa.success) {
          console.error('❌ Shopper Approved submission failed:', sa.error)
        } else {
          console.log('✅ Shopper Approved review scheduled. review_id:', sa.review_id)
          // Persist review_id on booking
          if (sa.review_id) {
            try {
              await payload.update({
                collection: 'event_bookings',
                id: Number(bookingId),
                data: {
                  reviewFollowup: {
                    reviewId: String(sa.review_id),
                  },
                },
                depth: 2,
              })
            } catch (persistErr) {
              console.error('Failed to store review_id on event booking:', persistErr)
            }
          }
        }
      } catch (shopperErr) {
        console.error('❌ Error creating Shopper Approved follow-up:', shopperErr)
      }

      console.log('✅ EVENT PAYMENT PROCESSING COMPLETE!')
      console.log('='.repeat(60) + '\n')
    }
  } catch (error) {
    console.error('Error handling event payment success:', error)
  }
}
