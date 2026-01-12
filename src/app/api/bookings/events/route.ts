import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/options'

import { BOOKING_REFERENCE_STRING } from '@/utilities/constant'
import { createOrUpdateBrevoContact, formatPhoneToE164 } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract booking data from request
    const {
      eventId,
      bookedBy,
      scheduleId,
      adultCount,
      childCount,
      pickupLocationId,
      pickupTimeId,
    } = body

    console.log(
      'Event Booking data:',
      body,
      eventId,
      adultCount,
      childCount,
      pickupLocationId,
      pickupTimeId,
    )
    // Validate required fields
    if (!eventId || !adultCount || !pickupLocationId || !pickupTimeId) {
      console.log('Event Booking validation failed:', { body, error: 'Missing required fields' })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config })

    // Get authenticated user from NextAuth session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to make a booking' },
        { status: 401 },
      )
    }

    // Get the authenticated user's ID and role
    console.log('session data ', session?.user)
    const authenticatedUserId = session?.user?.id
    const isAdmin = session?.user?.role === 'admin'

    // Check if this is an admin booking on behalf of another user
    const isAdminBookingForUser = isAdmin && bookedBy !== undefined

    // Determine which user ID to use for the booking
    // If admin is booking for someone else, use the provided userId in the request
    // Otherwise use the authenticated user's ID
    const userIdForBooking =
      isAdminBookingForUser && body.userId ? body.userId : authenticatedUserId

    console.log(
      'userIdForBooking authenticatedUserId',
      userIdForBooking,
      authenticatedUserId,
      body.userId,
    )
    // Fetch event details to get necessary information
    try {
      // Get event details to extract venue name and other data
      const event = await payload.findByID({
        collection: 'events',
        id: Number(eventId),
      })

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      // Find the selected schedule
      const selectedSchedule = event.schedules?.find((schedule) => schedule.id === scheduleId)

      if (!selectedSchedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
      }

      // Find the selected pickup location and time
      const selectedPickup = selectedSchedule.pickups?.find(
        (pickup) => pickup.id === pickupLocationId,
      )

      if (!selectedPickup) {
        return NextResponse.json({ error: 'Pickup location not found' }, { status: 404 })
      }

      // Get hotel information - handle both object and ID reference
      let hotelId: number | null = null
      let hotel: any = null
      // let hotelName = ''

      if (selectedPickup.hotel) {
        if (typeof selectedPickup.hotel === 'object') {
          hotelId = selectedPickup.hotel.id as number
          hotel = selectedPickup.hotel
          // hotelName = selectedPickup.hotel.name as string
        } else {
          // If it's just an ID (number), fetch the hotel details
          hotelId = selectedPickup.hotel as number
          hotel = await payload.findByID({
            collection: 'hotels',
            id: hotelId,
          })
        }
      }

      // Validate hotel partnership is still active for the event schedule date
      if (hotel && hotel.partnerValidTill) {
        const partnerValidTill = new Date(hotel.partnerValidTill)
        const scheduleDate = new Date(selectedSchedule.event_date_time)

        if (partnerValidTill <= scheduleDate) {
          return NextResponse.json(
            {
              error: 'Hotel partnership expired',
              message:
                'This pickup location is no longer available due to expired hotel partnership for the event date.',
            },
            { status: 400 },
          )
        }
      }

      // Find the pickup time details by ID
      const selectedPickupTimeObj = selectedPickup.pickup_times?.find(
        (pt) => pt.id === pickupTimeId,
      )

      if (!selectedPickupTimeObj) {
        return NextResponse.json({ error: 'Pickup time not found' }, { status: 404 })
      }

      // Get pricing information
      const adultPrice = selectedPickup.adult_price || 0
      const childrenPrice = selectedPickup.children_price || 0

      // Calculate totals
      const adultTotal = adultCount * adultPrice
      const childTotal = (childCount || 0) * childrenPrice
      const totalAmount = adultTotal + childTotal

      // Generate booking reference
      const bookingReference = BOOKING_REFERENCE_STRING('event')

      // Create pickup details object
      const pickupDetails = {
        locationId: pickupLocationId,
        hotelId,
        selectedPickupTimeId: selectedPickupTimeObj.id,
      }

      // Log the data being sent for debugging
      console.log('Creating booking with data:', {
        bookingReference,
        event: Number(eventId),
        scheduleId,
        user: Number(userIdForBooking),
        bookedBy: Number(authenticatedUserId), // Admin's ID when admin books for user
        pickupDetails: {
          locationId: pickupLocationId,
          selectedPickupTimeId: selectedPickupTimeObj.id,
        },
      })

      const createdBooking = await payload.create({
        collection: 'event_bookings',
        data: {
          // Basic booking information
          bookingReference,
          event: Number(eventId), // For Payload, relationship ID should be passed directly
          scheduleId,
          adultCount,
          childCount: childCount || 0,

          // User information - must be in the correct format for Payload CMS relationship
          user: typeof userIdForBooking === 'string' ? Number(userIdForBooking) : userIdForBooking, // For Payload, relationship ID should be passed directly

          // BookedBy - who made the booking (admin or self-booking)
          bookedBy:
            typeof authenticatedUserId === 'string'
              ? Number(authenticatedUserId)
              : authenticatedUserId,

          // Pickup details
          pickupDetails: {
            locationId: pickupLocationId,
            hotelId: pickupDetails.hotelId,
            selectedTimeId: pickupDetails.selectedPickupTimeId,
          },

          // Pricing information
          pricing: {
            adultPrice,
            childrenPrice,
            adultTotal,
            childTotal,
            totalAmount,
            currency: 'USD',
          },

          // Status information
          status: 'pending',
        },
      })

      // Log the booking creation
      console.log('===== BOOKING CREATED =====')
      console.log(`Booking reference: ${bookingReference}`)
      console.log(
        `Total amount: $${totalAmount} (${adultCount} riders, ${childCount || 0} children)`,
      )
      console.log(`User ID: ${authenticatedUserId || 'Guest'}`)
      console.log('===== END BOOKING =====')

      // Sync user to Brevo based on event category
      try {
        // Get user information
        const user = await payload.findByID({
          collection: 'users',
          id: Number(userIdForBooking),
        })

        if (user && user.email) {
          // Get event category to determine Brevo list ID
          let brevoListId: number | null = null

          if (event.category) {
            const categoryId =
              typeof event.category === 'object' ? event.category.id : event.category
            const category = await payload.findByID({
              collection: 'categories',
              id: categoryId,
            })

            if (category && category.name) {
              const categoryName = category.name.toLowerCase().trim()

              // Determine list ID based on category name
              if (categoryName.includes('entertainment')) {
                brevoListId = 6 // Entertainment Event Purchaser
              } else if (categoryName.includes('sporting') || categoryName.includes('sport')) {
                brevoListId = 5 // Sporting Event Purchaser
              }
            }
          }

          if (brevoListId) {
            // Parse name into first and last name
            const nameParts = user.name?.trim().split(/\s+/) || []
            const firstName = nameParts[0] || ''
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

            // Get category name
            const categoryName =
              event.category && typeof event.category === 'object'
                ? event.category.name || 'Unknown'
                : 'Unknown'

            // Create comprehensive tags for this event purchase
            const eventNameReadable = event.name || 'Unknown Event' // Actual event name
            const categoryTag = categoryName // Category as-is (e.g., "Sporting Event")
            const purchaseTag = `Purchased: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` // e.g., "Purchased: Dec 9, 2025"

            // Combine tags into a single string (you can use comma, semicolon, or pipe separator)
            const tagsString = `${eventNameReadable}, ${categoryTag}, ${purchaseTag}`

            // Build attributes object with comprehensive event information
            const attributes: Record<string, string> = {
              FIRSTNAME: firstName,
              LASTNAME: lastName,
              LAST_EVENT_PURCHASED: event.name || 'Unknown Event',
              EVENT_NAME: event.name || 'Unknown Event', // Dedicated event name field
              EVENT_CATEGORY: categoryName, // Event category for segmentation
              EVENT_DATE: selectedSchedule.event_date_time
                ? new Date(selectedSchedule.event_date_time).toISOString()
                : '',
              LAST_BOOKING_DATE: new Date().toISOString(), // When the booking was made
              TAGS: tagsString, // Tags as attribute
            }

            // Add phone number if available and valid
            if (user.phoneNumber) {
              const formattedPhone = formatPhoneToE164(user.phoneNumber)
              if (formattedPhone) {
                attributes.SMS = formattedPhone
              }
            }

            const brevoResult = await createOrUpdateBrevoContact({
              email: user.email,
              attributes,
              listIds: [brevoListId],
              updateEnabled: true,
            })

            // Single comprehensive log
            console.log('[Event Booking Brevo Sync]', {
              status: brevoResult.success ? 'success' : 'failed',
              email: user.email,
              eventName: event.name,
              category: categoryName,
              eventDate: selectedSchedule.event_date_time,
              listId: brevoListId,
              tagsAttribute: tagsString,
              contactId: brevoResult.data?.id || null,
              error: brevoResult.error || null,
            })
          }
        }
      } catch (brevoError) {
        // Single log for exceptions
        console.log('[Event Booking Brevo Sync]', {
          status: 'error',
          email: 'unknown',
          error: brevoError instanceof Error ? brevoError.message : 'Unknown error',
        })
      }

      // Note: Booking confirmation email will be sent after payment is completed via webhook

      // Return success response with the booking data
      return NextResponse.json(
        {
          success: true,
          booking: createdBooking,
          message: `Event booking created! Reference: ${bookingReference}. Please complete payment to confirm your booking.`,
        },
        { status: 201 },
      )
    } catch (createError) {
      console.error('Error creating booking in database:', createError)

      // Extract and display more specific error information
      let errorMessage = 'There was an error saving your booking. Please try again.'
      let errorDetails = null

      if (createError && typeof createError === 'object') {
        // Try to extract Payload CMS validation errors
        if ('errors' in createError) {
          const payloadError = createError as { errors?: Record<string, unknown> }
          errorDetails = payloadError.errors
          errorMessage = 'Validation error in booking data'
        } else if ('message' in createError) {
          const msgError = createError as { message: string }
          errorMessage = msgError.message
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create booking',
          message: errorMessage,
          details: errorDetails,
        },
        { status: 500 },
      )
    }
  } catch (error: unknown) {
    console.error('Error creating booking:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
