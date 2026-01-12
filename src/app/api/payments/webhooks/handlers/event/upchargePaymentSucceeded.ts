import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBookingUpdateEmail } from '@/lib/emailService'
import { formatEventBookingForEmail } from '@/utilities/bookingEmailUtils'
import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'

const payload = await getPayload({ config })

// Handle successful upcharge payment for event booking edits
export async function handleEventUpchargePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { bookingId, paymentType, editData } = paymentIntent.metadata

    // Only process upcharge payments
    if (paymentType !== 'upcharge') {
      return
    }

    // Find the upcharge payment record
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

      // Update upcharge payment record
      await payload.update({
        collection: 'event_booking_payments',
        id: paymentId,
        data: {
          paymentReference: PAYMENT_REFERENCE_STRING('event-upcharge'),
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

      // Parse edit data from metadata
      const parsedEditData = editData ? JSON.parse(editData) : null

      if (parsedEditData && bookingId) {
        // Update the booking with new details
        await updateBookingAfterUpcharge(bookingId, parsedEditData, paymentIntent.amount / 100)
      }

      // Get updated booking for email
      const updatedBooking = await payload.findByID({
        collection: 'event_bookings',
        id: Number(bookingId),
        depth: 2,
      })

      console.log('===== EVENT UPCHARGE PAYMENT COMPLETED =====')
      console.log(`Booking ID: ${bookingId}`)
      console.log(`Payment Intent: ${paymentIntent.id}`)
      console.log(`Upcharge Amount: $${(paymentIntent.amount / 100).toFixed(2)}`)
      console.log('===== SENDING UPDATE EMAIL =====')

      // Send booking update email
      try {
        const emailData = await formatEventBookingForEmail(updatedBooking)
        const emailResult = await sendBookingUpdateEmail({
          ...emailData,
          bookingType: 'event',
          changeType: 'details_updated_with_upcharge',
          upchargeAmount: paymentIntent.amount / 100,
        })

        if (emailResult.success) {
          console.log(`✅ Event booking update email sent to ${emailData.customerEmail}`)
        } else {
          console.error('❌ Failed to send event booking update email:', emailResult.error)
        }
      } catch (emailError) {
        console.error('❌ Error sending event booking update email:', emailError)
      }

      console.log('===== EVENT UPCHARGE PAYMENT PROCESSING COMPLETE =====')
    }
  } catch (error) {
    console.error('Error handling event upcharge payment success:', error)
  }
}

async function updateBookingAfterUpcharge(
  bookingId: string,
  editData: any,
  upchargeAmount: number,
) {
  try {
    // Get the current booking
    const booking = await payload.findByID({
      collection: 'event_bookings',
      id: Number(bookingId),
      depth: 2,
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Get the new event details to calculate pricing
    const event = await payload.findByID({
      collection: 'events',
      id: editData.eventId,
      depth: 2,
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Find the selected schedule
    const selectedSchedule = event.schedules?.find(
      (schedule: any) => schedule.id === editData.scheduleId,
    )

    if (!selectedSchedule) {
      throw new Error('Schedule not found')
    }

    // Find the selected pickup location
    const selectedPickup = selectedSchedule.pickups?.find(
      (pickup: any) => pickup.id === editData.pickupLocationId,
    )

    if (!selectedPickup) {
      throw new Error('Pickup location not found')
    }

    // Calculate new pricing
    const adultPrice = selectedPickup.adult_price || 0
    const childrenPrice = selectedPickup.children_price || 0
    const adultTotal = editData.adultCount * adultPrice
    const childTotal = editData.childCount * childrenPrice
    const newTotalAmount = adultTotal + childTotal

    // Find the selected pickup time
    const selectedPickupTime = selectedPickup.pickup_times?.find(
      (time: any) => time.id === editData.pickupTimeId,
    )

    if (!selectedPickupTime) {
      throw new Error('Pickup time not found')
    }

    // Get hotel ID if provided
    const hotelId = editData.hotelId || null

    // Update the booking
    await payload.update({
      collection: 'event_bookings',
      id: Number(bookingId),
      data: {
        event: Number(editData.eventId),
        scheduleId: editData.scheduleId,
        adultCount: editData.adultCount,
        childCount: editData.childCount,
        pickupDetails: {
          locationId: editData.pickupLocationId,
          hotelId,
          selectedTimeId: editData.pickupTimeId,
        },
        pricing: {
          adultPrice,
          childrenPrice,
          adultTotal,
          childTotal,
          totalAmount: newTotalAmount,
          currency: 'USD',
        },
        notes: booking.notes
          ? `${booking.notes}\n\nBooking updated on ${new Date().toISOString()} with upcharge of $${upchargeAmount}`
          : `Booking updated on ${new Date().toISOString()} with upcharge of $${upchargeAmount}`,
      },
    })

    console.log(`✅ Booking ${bookingId} updated successfully after upcharge payment`)
  } catch (error) {
    console.error(`❌ Error updating booking ${bookingId} after upcharge:`, error)
    throw error
  }
}
