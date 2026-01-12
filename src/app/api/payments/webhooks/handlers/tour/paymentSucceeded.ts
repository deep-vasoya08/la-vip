import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBookingConfirmationEmail } from '@/lib/emailService'
import { scheduleFollowupForBooking } from '@/utilities/shopperApprovedUtils'
import { handleTourUpchargePaymentSucceeded } from './upchargePaymentSucceeded'
import { formatTourBookingForEmail } from '@/utilities/bookingEmailUtils'

// Handle successful tour payment
export async function handleTourPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const payload = await getPayload({
    config,
  })
  try {
    const { bookingId, paymentType } = paymentIntent.metadata

    // Check if this is an upcharge payment
    if (paymentType === 'upcharge') {
      await handleTourUpchargePaymentSucceeded(paymentIntent)
      return
    }

    // Handle regular tour booking payment
    // Find the payment record
    const payments = await payload.find({
      collection: 'tour_booking_payments',
      where: {
        'stripeDetails.stripePaymentIntentId': {
          equals: paymentIntent.id,
        },
      },
    })

    if (payments?.docs.length > 0 && payments?.docs[0]) {
      const paymentId = payments?.docs[0].id

      // Update payment record
      await payload.update({
        collection: 'tour_booking_payments',
        id: paymentId,
        data: {
          paymentStatus: 'completed',
          paymentDate: new Date().toISOString(),
          transactionId: paymentIntent.id,
          stripeDetails: {
            receiptUrl:
              typeof paymentIntent.latest_charge === 'object'
                ? paymentIntent?.latest_charge?.receipt_url
                : null,
          },
        },
      })

      // Update booking status
      const updatedBooking = await payload.update({
        collection: 'tour_bookings',
        id: Number(bookingId),
        data: {
          status: 'confirmed',
        },
        depth: 2,
      })

      console.log('===== TOUR PAYMENT COMPLETED =====')
      console.log(`Booking ID: ${bookingId}`)
      console.log(`Payment Intent: ${paymentIntent.id}`)
      console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)}`)
      console.log('===== SENDING CONFIRMATION EMAIL =====')

      // Send professional booking confirmation email after payment success
      try {
        const emailData = await formatTourBookingForEmail(updatedBooking)
        console.log('===== EMAIL DATA =====', emailData)
        const emailResult = await sendBookingConfirmationEmail({
          ...emailData,
          bookingType: 'tour',
        })

        if (emailResult.success) {
          console.log(`✅ Tour booking confirmation email sent to ${emailData.customerEmail}`)
        } else {
          console.error('❌ Failed to send tour booking confirmation email:', emailResult.error)
        }

        // Submit booking to Shopper Approved for review email collection
        // console.log('===== SUBMITTING TO SHOPPER APPROVED =====')
        // try {
        //   const reviewResult = await sendTourReviewRequest(
        //     bookingId?.toString() || '',
        //     emailData.customerName,
        //     emailData.customerEmail,
        //     emailData.bookingDetails.name,
        //     emailData.bookingDetails.date,
        //     emailData.bookingDetails.totalAmount,
        //   )

        //   if (reviewResult.success) {
        //     console.log(
        //       `✅ Tour booking submitted to Shopper Approved for ${emailData.customerEmail}`,
        //     )
        //     console.log('📧 Customer will receive review request email in 3-5 days')
        //   } else {
        //     console.error('❌ Failed to submit to Shopper Approved:', reviewResult.error)
        //   }
        // } catch (shopperError) {
        //   console.error('❌ Error submitting to Shopper Approved:', shopperError)
        // }
      } catch (emailError) {
        console.error('❌ Error sending tour booking confirmation email:', emailError)
      }

      // Submit to Shopper Approved immediately with followup set to 48h after tour date
      try {
        const sa = await scheduleFollowupForBooking({ kind: 'tour', booking: updatedBooking })
        if (!sa.success) {
          console.error('❌ Shopper Approved submission failed:', sa.error)
        } else {
          console.log('✅ Shopper Approved review scheduled. review_id:', sa.review_id)
          // Persist review_id on booking
          if (sa.review_id) {
            try {
              await payload.update({
                collection: 'tour_bookings',
                id: Number(bookingId),
                data: {
                  reviewFollowup: {
                    reviewId: String(sa.review_id),
                  },
                },
              })
            } catch (persistErr) {
              console.error('Failed to store review_id on tour booking:', persistErr)
            }
          }
        }
      } catch (shopperErr) {
        console.error('❌ Error creating Shopper Approved follow-up:', shopperErr)
      }

      console.log('===== TOUR PAYMENT PROCESSING COMPLETE =====')
    }
  } catch (error) {
    console.error('Error handling tour payment success:', error)
  }
}
