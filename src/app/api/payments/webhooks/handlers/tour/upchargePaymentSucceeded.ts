import Stripe from 'stripe'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendBookingUpdateEmail } from '@/lib/emailService'

import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'
import { formatTourBookingForEmail } from '@/utilities/bookingEmailUtils'

const payload = await getPayload({ config })

// Handle successful upcharge payment for tour booking edits
export async function handleTourUpchargePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { bookingId, paymentType, editData } = paymentIntent.metadata

    // Only process upcharge payments
    if (paymentType !== 'upcharge') {
      return
    }

    // Find the upcharge payment record
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

      // Update upcharge payment record
      await payload.update({
        collection: 'tour_booking_payments',
        id: paymentId,
        data: {
          paymentReference: PAYMENT_REFERENCE_STRING('tour-upcharge'),
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
        collection: 'tour_bookings',
        id: Number(bookingId),
        depth: 2,
      })

      console.log('===== TOUR UPCHARGE PAYMENT COMPLETED =====')
      console.log(`Booking ID: ${bookingId}`)
      console.log(`Payment Intent: ${paymentIntent.id}`)
      console.log(`Upcharge Amount: $${(paymentIntent.amount / 100).toFixed(2)}`)
      console.log('===== SENDING UPDATE EMAIL =====')

      // Send booking update email
      try {
        const emailData = await formatTourBookingForEmail(updatedBooking)
        const emailResult = await sendBookingUpdateEmail({
          ...emailData,
          bookingType: 'tour',
          changeType: 'details_updated_with_upcharge',
          upchargeAmount: paymentIntent.amount / 100,
        })

        if (emailResult.success) {
          console.log(`✅ Tour booking update email sent to ${emailData.customerEmail}`)
        } else {
          console.error('❌ Failed to send tour booking update email:', emailResult.error)
        }
      } catch (emailError) {
        console.error('❌ Error sending tour booking update email:', emailError)
      }

      console.log('===== TOUR UPCHARGE PAYMENT PROCESSING COMPLETE =====')
    }
  } catch (error) {
    console.error('Error handling tour upcharge payment success:', error)
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
      collection: 'tour_bookings',
      id: Number(bookingId),
      depth: 2,
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Get the new tour details to calculate pricing
    const tour = await payload.findByID({
      collection: 'tours',
      id: editData.tourId,
      depth: 2,
    })

    if (!tour) {
      throw new Error('Tour not found')
    }

    // With new schema, find the pickup directly from tour.pickups
    const selectedPickup = tour.pickups?.find((pickup: any) => {
      const pickupHotelId = typeof pickup.hotel === 'object' ? pickup.hotel.id : pickup.hotel
      return pickupHotelId == editData.pickupLocationId
    })

    if (!selectedPickup) {
      throw new Error('Pickup location not found')
    }

    // Calculate new pricing
    const adultPrice = selectedPickup.adult_price || 0
    const childrenPrice = selectedPickup.children_price || 0
    const adultTotal = editData.adultCount * adultPrice
    const childTotal = editData.childCount * childrenPrice
    const newTotalAmount = adultTotal + childTotal

    // Calculate pickup time based on tour date and pickup offset
    const tourDate = new Date(editData.tourDateTime)
    const pickupTime = new Date(selectedPickup.pickup_time)
    const pickupDateTime = new Date(tourDate)
    pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0)

    // Get hotel ID
    const hotelId =
      typeof selectedPickup.hotel === 'object' ? selectedPickup.hotel.id : selectedPickup.hotel

    // Update the booking
    await payload.update({
      collection: 'tour_bookings',
      id: Number(bookingId),
      data: {
        tour: Number(editData.tourId),
        scheduledDate: new Date(editData.tourDateTime).toISOString(),
        adultCount: editData.adultCount,
        childCount: editData.childCount,
        pickupDetails: {
          locationId: editData.pickupLocationId,
          hotelId,
          pickupDateTime: pickupDateTime.toISOString(),
          tourDateTime: new Date(editData.tourDateTime).toISOString(),
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
