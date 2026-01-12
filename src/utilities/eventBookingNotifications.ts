import { getPayload } from 'payload'
import config from '@/payload.config'
import { EventBooking, User } from '@/payload-types'
import { sendPendingPaymentEmail } from '@/lib/emailService'
import {
  getEventSelectedPickupLocationName,
  getEventSelectedPickupTime,
  getEventSelectedScheduleTime,
} from '@/utilities/eventBookingUtils'
import { createAutoLoginToken } from '@/utilities/encryption'
import { formatDateTime } from '@/utilities/formatDateTime'
import { validateUserId, validateBookingId, sanitizeForLog } from '@/utilities/securityUtils'

/**
 * Send booking notification email to user when admin creates a booking
 * Uses pending payment email since admin-created bookings start with 'pending' status
 */
export async function sendBookingNotificationEmail(booking: EventBooking) {
  try {
    // Initialize payload instance
    const payload = await getPayload({ config })

    // Get user details
    const userId = typeof booking.user === 'object' ? booking.user?.id : booking.user
    if (!userId) {
      throw new Error('No user associated with booking')
    }

    const user = (await payload.findByID({
      collection: 'users',
      id: userId,
    })) as User

    if (!user) {
      throw new Error('User not found')
    }

    // Get event details with full depth to ensure all nested data is available
    const event =
      typeof booking.event === 'object'
        ? booking.event
        : await payload.findByID({
            collection: 'events',
            id: booking.event,
            depth: 5, // Increased depth to get all nested relationships
          })

    if (!event) {
      throw new Error('Event not found')
    }

    // Get venue details if not already populated
    let venue = null
    if (event.venue) {
      if (typeof event.venue === 'object') {
        venue = event.venue
      } else {
        try {
          venue = await payload.findByID({
            collection: 'venues',
            id: event.venue,
            depth: 2,
          })
        } catch (error) {
          console.warn('Could not fetch venue details:', error)
        }
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    // Validate IDs before creating token to prevent type coercion vulnerabilities
    const validatedUserId = validateUserId(user.id)
    const validatedBookingId = validateBookingId(booking.id)

    if (!validatedUserId || !validatedBookingId) {
      console.error('Invalid user or booking ID - cannot create auto-login token', {
        userId: user.id,
        bookingId: booking.id,
      })
      throw new Error('Invalid user or booking ID')
    }

    // Create encrypted auto-login token with validated IDs
    const encryptedToken = createAutoLoginToken(
      String(validatedUserId),
      user.email,
      String(validatedBookingId),
      'event',
      60, // Token expires in 60 minutes
    )

    const paymentUrl = `${baseUrl}/api/auto-login?token=${encodeURIComponent(encryptedToken)}`

    // Log sanitized booking data (without sensitive tokens)
    console.log(
      '🔍 Event booking notification:',
      sanitizeForLog({
        bookingId: booking.id,
        userId: user.id,
        scheduleId: booking.scheduleId,
        bookingReference: booking.bookingReference,
      }),
    )

    // Extract comprehensive booking data with complete schedule information
    const eventName = typeof event === 'object' ? event.name : 'Event Details'
    const eventDescription = typeof event === 'object' ? event.description || '' : ''

    // Get selected schedule details with full information
    const selectedSchedule = event.schedules?.find((s) => s.id === booking.scheduleId)
    const eventDateTime = selectedSchedule
      ? formatDateTime(selectedSchedule.event_date_time)
      : getEventSelectedScheduleTime(booking) || 'Date to be confirmed'

    // Get venue information for event location
    const eventLocation = venue
      ? `${venue.name}${venue.address ? ', ' + venue.address : ''}${venue.city ? ', ' + venue.city : ''}`
      : ''

    // Get pickup details with complete information
    const selectedPickup = selectedSchedule?.pickups?.find(
      (p) => p.id === booking.pickupDetails?.locationId,
    )
    const pickupLocationName =
      selectedPickup?.hotel && typeof selectedPickup.hotel === 'object'
        ? `${selectedPickup.hotel.name}${selectedPickup.hotel.location ? ' - ' + selectedPickup.hotel.location : ''}`
        : getEventSelectedPickupLocationName(booking) || 'Pickup location TBD'

    // Get pickup time details
    const selectedPickupTime = selectedPickup?.pickup_times?.find(
      (t) => t.id === booking.pickupDetails?.selectedTimeId,
    )
    const pickupTime = selectedPickupTime
      ? formatDateTime(selectedPickupTime.time)
      : getEventSelectedPickupTime(booking) || ''

    // Get all available pickup times for this schedule (for email context)
    const allPickupTimes =
      selectedSchedule?.pickups?.flatMap(
        (pickup) => pickup.pickup_times?.map((time) => formatDateTime(time.time)) || [],
      ) || []

    // Get schedule notes
    const scheduleNotes = selectedSchedule?.schedule_notes || ''

    const totalGuests = (booking.adultCount || 0) + (booking.childCount || 0)
    const totalAmount = booking.pricing?.totalAmount || 0

    console.log('📋 Booking details being prepared:', {
      eventName,
      eventDescription,
      eventDateTime,
      pickupLocationName,
      pickupTime,
      totalGuests,
      totalAmount,
      scheduleNotes,
      eventLocation,
      bookingReference: booking.bookingReference,
      userInfo: {
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
      },
    })

    // Prepare comprehensive booking details for the pending payment email
    const bookingDetails = {
      name: eventName,
      description: eventDescription,
      date: eventDateTime,
      pickupLocation: pickupLocationName, // Use combined pickup info
      pickupTime: pickupTime,
      totalGuests: totalGuests,
      totalAmount: totalAmount,
      eventLocation: eventLocation,
      scheduleNotes: scheduleNotes,
      // Additional comprehensive details
      venue: venue
        ? {
            name: venue.name,
            address: venue.address,
            city: venue.city,
            fullAddress: `${venue.name}${venue.address ? ', ' + venue.address : ''}${venue.city ? ', ' + venue.city : ''}`,
          }
        : null,
      schedule: selectedSchedule
        ? {
            id: selectedSchedule.id,
            dateTime: eventDateTime,
            status: selectedSchedule.schedule_status,
            notes: selectedSchedule.schedule_notes,
            rawDateTime: selectedSchedule.event_date_time,
          }
        : null,
      pickup: selectedPickup
        ? {
            locationName: pickupLocationName,
            time: pickupTime,
            adultPrice: selectedPickup.adult_price,
            childrenPrice: selectedPickup.children_price,
            hotel:
              selectedPickup.hotel && typeof selectedPickup.hotel === 'object'
                ? {
                    name: selectedPickup.hotel.name,
                    location: selectedPickup.hotel.location,
                    rating: selectedPickup.hotel.rating,
                  }
                : null,
          }
        : null,
      allPickupTimes: allPickupTimes.length > 0 ? allPickupTimes : null,
      participants: {
        adults: booking.adultCount || 0,
        children: booking.childCount || 0,
        total: totalGuests,
      },
      pricing: booking.pricing
        ? {
            adultPrice: booking.pricing.adultPrice,
            childrenPrice: booking.pricing.childrenPrice,
            adultTotal: booking.pricing.adultTotal,
            childTotal: booking.pricing.childTotal,
            totalAmount: booking.pricing.totalAmount,
            currency: booking.pricing.currency || 'USD',
          }
        : null,
    }

    console.log('📧 Final booking details for email service:', bookingDetails)

    // Use the new pending payment email function for admin-created bookings
    const emailResult = await sendPendingPaymentEmail({
      customerName: user.name || user.email,
      customerEmail: user.email,
      customerPhoneNumber: user.phoneNumber || '',
      bookingReference: booking.bookingReference || '',
      bookingType: 'event',
      bookingDetails: bookingDetails,
      paymentUrl: paymentUrl,
      userId: user.id,
    })

    if (emailResult.success) {
      console.log('✅ Booking notification email sent successfully!')
      console.log(`📧 Email sent to: ${user.email}`)
      console.log(`🔗 Auto-login payment link: ${paymentUrl}`)
      console.log(`💳 Direct booking page: ${baseUrl}/my-account/events/${booking.id}`)
      console.log(`🔐 Manual login (if needed): ${baseUrl}/auth/login`)
    } else {
      console.error('❌ Failed to send booking notification email:', emailResult.error)
    }

    return emailResult
  } catch (error) {
    console.error('Failed to send booking notification email:', error)
    throw error
  }
}

// /**
//  * Send payment reminder email for pending bookings
//  */
// export async function sendPaymentReminderEmail(booking: EventBooking) {
//   try {
//     // Initialize payload instance
//     const payload = await getPayload({ config })

//     const userId = typeof booking.user === 'object' ? booking.user?.id : booking.user
//     if (!userId) {
//       throw new Error('No user associated with booking')
//     }

//     const user = (await payload.findByID({
//       collection: 'users',
//       id: userId,
//     })) as User

//     if (!user) {
//       throw new Error('User not found')
//     }

//     // Get event details with full depth to ensure all nested data is available
//     const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event
//     const event = await payload.findByID({
//       collection: 'events',
//       id: eventId,
//       depth: 5, // Increased depth to get all nested relationships
//     })

//     if (!event) {
//       throw new Error('Event not found')
//     }

//     // Get venue details if not already populated
//     let venue = null
//     if (event.venue) {
//       if (typeof event.venue === 'object') {
//         venue = event.venue
//       } else {
//         try {
//           venue = await payload.findByID({
//             collection: 'venues',
//             id: event.venue,
//             depth: 2,
//           })
//         } catch (error) {
//           console.warn('Could not fetch venue details:', error)
//         }
//       }
//     }

//     const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

//     // Create encrypted auto-login token
//     const encryptedToken = createAutoLoginToken(
//       String(user.id),
//       user.email,
//       String(booking.id),
//       'event',
//       60, // Token expires in 60 minutes
//     )

//     const paymentUrl = `${baseUrl}/api/auto-login?token=${encodeURIComponent(encryptedToken)}`

//     // Extract comprehensive booking data with complete schedule information (same as notification email)
//     const eventName = typeof event === 'object' ? event.name : 'Event Details'
//     const eventDescription = typeof event === 'object' ? event.description || '' : ''

//     // Get selected schedule details with full information
//     const selectedSchedule = event.schedules?.find((s) => s.id === booking.scheduleId)
//     const eventDateTime = selectedSchedule
//       ? formatDateTime(selectedSchedule.event_date_time)
//       : getEventSelectedScheduleTime(booking) || 'Date to be confirmed'

//     // Get venue information for event location
//     const eventLocation = venue
//       ? `${venue.name}${venue.address ? ', ' + venue.address : ''}${venue.city ? ', ' + venue.city : ''}`
//       : ''

//     // Get pickup details with complete information
//     const selectedPickup = selectedSchedule?.pickups?.find(
//       (p) => p.id === booking.pickupDetails?.locationId,
//     )
//     const pickupLocationName =
//       selectedPickup?.hotel && typeof selectedPickup.hotel === 'object'
//         ? `${selectedPickup.hotel.name}${selectedPickup.hotel.location ? ' - ' + selectedPickup.hotel.location : ''}`
//         : getEventSelectedPickupLocationName(booking) || 'Pickup location TBD'

//     // Get pickup time details
//     const selectedPickupTime = selectedPickup?.pickup_times?.find(
//       (t) => t.id === booking.pickupDetails?.selectedTimeId,
//     )
//     const pickupTime = selectedPickupTime
//       ? formatDateTime(selectedPickupTime.time)
//       : getEventSelectedPickupTime(booking) || ''

//     // Get all available pickup times for this schedule (for email context)
//     const allPickupTimes =
//       selectedSchedule?.pickups?.flatMap(
//         (pickup) => pickup.pickup_times?.map((time) => formatDateTime(time.time)) || [],
//       ) || []

//     // Get schedule notes
//     const scheduleNotes = selectedSchedule?.schedule_notes || ''

//     const totalGuests = (booking.adultCount || 0) + (booking.childCount || 0)
//     const totalAmount = booking.pricing?.totalAmount || 0

//     // Log the enhanced extracted data for debugging
//     console.log('🔍 Enhanced payment reminder data extraction:', {
//       eventName,
//       eventDateTime,
//       eventLocation,
//       pickupLocationName,
//       pickupTime,
//       allPickupTimes,
//       scheduleNotes,
//       selectedSchedule: selectedSchedule
//         ? {
//             id: selectedSchedule.id,
//             dateTime: selectedSchedule.event_date_time,
//             status: selectedSchedule.schedule_status,
//             notes: selectedSchedule.schedule_notes,
//             pickupCount: selectedSchedule.pickups?.length || 0,
//           }
//         : 'Not found',
//       venue: venue
//         ? {
//             name: venue.name,
//             address: venue.address,
//             city: venue.city,
//           }
//         : 'Not available',
//     })

//     console.log('📋 Payment reminder details being prepared:', {
//       eventName,
//       eventDescription,
//       eventDateTime,
//       pickupLocationName,
//       pickupTime,
//       totalGuests,
//       totalAmount,
//       scheduleNotes,
//       eventLocation,
//       bookingReference: booking.bookingReference,
//       userInfo: {
//         name: user.name,
//         email: user.email,
//         phone: user.phoneNumber,
//       },
//     })

//     // Prepare comprehensive booking details for the payment reminder email (same structure as notification email)
//     const fullPickupInfo = pickupLocationName + (pickupTime ? `, ${pickupTime}` : '')
//     const bookingDetails = {
//       name: eventName,
//       description: eventDescription,
//       date: eventDateTime,
//       pickupLocation: fullPickupInfo, // Use combined pickup info
//       pickupTime: pickupTime,
//       totalGuests: totalGuests,
//       totalAmount: totalAmount,
//       eventLocation: eventLocation,
//       scheduleNotes: scheduleNotes,
//       // Additional comprehensive details (same as notification email)
//       venue: venue
//         ? {
//             name: venue.name,
//             address: venue.address,
//             city: venue.city,
//             fullAddress: `${venue.name}${venue.address ? ', ' + venue.address : ''}${venue.city ? ', ' + venue.city : ''}`,
//           }
//         : null,
//       schedule: selectedSchedule
//         ? {
//             id: selectedSchedule.id,
//             dateTime: eventDateTime,
//             status: selectedSchedule.schedule_status,
//             notes: selectedSchedule.schedule_notes,
//             rawDateTime: selectedSchedule.event_date_time,
//           }
//         : null,
//       pickup: selectedPickup
//         ? {
//             locationName: pickupLocationName,
//             time: pickupTime,
//             adultPrice: selectedPickup.adult_price,
//             childrenPrice: selectedPickup.children_price,
//             hotel:
//               selectedPickup.hotel && typeof selectedPickup.hotel === 'object'
//                 ? {
//                     name: selectedPickup.hotel.name,
//                     location: selectedPickup.hotel.location,
//                     rating: selectedPickup.hotel.rating,
//                   }
//                 : null,
//           }
//         : null,
//       allPickupTimes: allPickupTimes.length > 0 ? allPickupTimes : null,
//       participants: {
//         adults: booking.adultCount || 0,
//         children: booking.childCount || 0,
//         total: totalGuests,
//       },
//       pricing: booking.pricing
//         ? {
//             adultPrice: booking.pricing.adultPrice,
//             childrenPrice: booking.pricing.childrenPrice,
//             adultTotal: booking.pricing.adultTotal,
//             childTotal: booking.pricing.childTotal,
//             totalAmount: booking.pricing.totalAmount,
//             currency: booking.pricing.currency || 'USD',
//           }
//         : null,
//     }

//     // Use the new dedicated pending payment email function
//     const emailResult = await sendPendingPaymentEmail({
//       customerName: user.name || user.email,
//       customerEmail: user.email,
//       customerPhoneNumber: user.phoneNumber || '',
//       bookingReference: booking.bookingReference || '',
//       bookingType: 'event',
//       bookingDetails: bookingDetails,
//       paymentUrl: paymentUrl,
//       userId: user.id,
//     })

//     if (emailResult.success) {
//       console.log('✅ Pending payment email sent successfully!')
//       console.log(`📧 Email sent to: ${user.email}`)
//       console.log(`🔗 Auto-login payment link: ${paymentUrl}`)
//       console.log(`💳 Direct booking page: ${baseUrl}/my-account/events/${booking.id}`)
//       console.log(`🔐 Manual login (if needed): ${baseUrl}/auth/login`)
//     } else {
//       console.error('❌ Failed to send pending payment email:', emailResult.error)
//     }

//     return emailResult
//   } catch (error) {
//     console.error('Failed to send payment reminder email:', error)
//     throw error
//   }
// }
