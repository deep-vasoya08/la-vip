import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/options'
import { generateTourDates, isTourDateAvailable } from '@/utilities/tourScheduleUtils'

import { BOOKING_REFERENCE_STRING } from '@/utilities/constant'
import { createOrUpdateBrevoContact, formatPhoneToE164 } from '@/lib/brevo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract booking data from request - updated for new schema
    const {
      tourId,
      bookedBy,
      scheduleId, // This will be the generated date ID (YYYY-MM-DD format) - kept for compatibility
      adultCount,
      childCount,
      pickupLocationId, // This will be the hotel ID
      tourDateTime, // The actual ISO date-time string for the booking
    } = body

    console.log(
      'Tour Booking data:',
      body,
      tourId,
      adultCount,
      childCount,
      pickupLocationId,
      tourDateTime,
    )

    // Validate required fields
    if (!tourId || !adultCount || !pickupLocationId || !tourDateTime) {
      console.log('Tour Booking validation failed:', { body, error: 'Missing required fields' })
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

    // Fetch tour details to get necessary information
    try {
      // Get tour details to extract venue name and other data
      const tour = await payload.findByID({
        collection: 'tours',
        id: Number(tourId),
      })

      if (!tour) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
      }

      // Validate that the tour has RRULE configuration
      if (!tour.recurrence_rule || !tour.tour_start_time || !tour.booking_window_months) {
        return NextResponse.json(
          { error: 'Tour is not properly configured for booking' },
          { status: 400 },
        )
      }

      // Validate that the requested date is available based on RRULE
      const bookingDate = new Date(tourDateTime)
      const tourConfig = {
        tour_start_time: tour.tour_start_time || '',
        recurrence_rule: tour.recurrence_rule || '',
        booking_window_months: tour.booking_window_months || 0,
        schedule_notes: tour.schedule_notes || undefined,
      }

      if (!isTourDateAvailable(bookingDate, tourConfig)) {
        return NextResponse.json(
          { error: 'Selected date is not available for booking' },
          { status: 400 },
        )
      }

      // Find the selected pickup location from tour's pickups (new schema)
      const selectedPickup = tour.pickups?.find((pickup) => {
        const hotelId = typeof pickup.hotel === 'object' ? pickup.hotel.id : pickup.hotel
        return hotelId === Number(pickupLocationId)
      })

      if (!selectedPickup) {
        return NextResponse.json({ error: 'Pickup location not found' }, { status: 404 })
      }

      // Get hotel information - handle both object and ID reference
      let hotelId: number | null = null

      if (selectedPickup.hotel) {
        if (typeof selectedPickup.hotel === 'object') {
          hotelId = selectedPickup.hotel.id as number
        } else {
          // If it's just an ID (number)
          hotelId = selectedPickup.hotel as number
        }
      }

      // Calculate pickup time based on tour date and pickup offset
      const tourDate = new Date(tourDateTime)
      const pickupTime = new Date(selectedPickup.pickup_time)
      const pickupDateTime = new Date(tourDate)
      pickupDateTime.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0)

      // Get pricing information
      const adultPrice = selectedPickup.adult_price || 0
      const childrenPrice = selectedPickup.children_price || 0

      // Calculate totals
      const adultTotal = adultCount * adultPrice
      const childTotal = (childCount || 0) * childrenPrice
      const totalAmount = adultTotal + childTotal

      // Generate booking reference
      const bookingReference = BOOKING_REFERENCE_STRING('tour')

      // Create pickup details object for new schema
      const pickupDetails = {
        locationId: pickupLocationId,
        hotelId,
        pickupDateTime: pickupDateTime.toISOString(),
        tourDateTime: tourDateTime,
      }

      // Log the data being sent for debugging
      console.log('Creating tour booking with data:', {
        bookingReference,
        tour: Number(tourId),
        scheduledDate: tourDateTime,
        user: Number(userIdForBooking),
        bookedBy: Number(authenticatedUserId), // Admin's ID when admin books for user
        pickupDetails,
        tourDateTime,
      })

      const createdBooking = await payload.create({
        collection: 'tour_bookings',
        data: {
          // Basic booking information
          bookingReference,
          tour: Number(tourId), // For Payload, relationship ID should be passed directly
          scheduledDate: new Date(tourDateTime).toISOString(), // Convert to Date object for Payload
          adultCount,
          childCount: childCount || 0,

          // User information - must be in the correct format for Payload CMS relationship
          user: typeof userIdForBooking === 'string' ? Number(userIdForBooking) : userIdForBooking,

          // BookedBy - who made the booking (admin or self-booking)
          bookedBy:
            typeof authenticatedUserId === 'string'
              ? Number(authenticatedUserId)
              : authenticatedUserId,

          // Pickup details - updated for new schema
          pickupDetails: {
            locationId: pickupLocationId,
            hotelId: hotelId || 0,
            pickupDateTime: pickupDateTime.toISOString(), // Pass Date object directly
            tourDateTime: new Date(tourDateTime).toISOString(), // Convert to Date object
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
      console.log('===== TOUR BOOKING CREATED =====')
      console.log(`Booking reference: ${bookingReference}`)
      console.log(
        `Total amount: $${totalAmount} (${adultCount} riders, ${childCount || 0} children)`,
      )
      console.log(`User ID: ${authenticatedUserId || 'Guest'}`)
      console.log('===== END TOUR BOOKING =====')

      // Sync user to Brevo - Deluxe Grand Tour list (ID 18)
      try {
        const user = await payload.findByID({
          collection: 'users',
          id: Number(userIdForBooking),
        })

        if (user && user.email) {
          // Parse name into first and last name
          const nameParts = user.name?.trim().split(/\s+/) || []
          const firstName = nameParts[0] || ''
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

          // Create comprehensive tags for this tour purchase
          const tourNameReadable = tour.name || 'Unknown Tour' // Actual tour name
          const purchaseTag = `Purchased: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}` // e.g., "Purchased: Dec 9, 2025"
          const tourTypeTag = 'Tour' // Distinguish from events
          
          // Combine tags into a single string (you can use comma, semicolon, or pipe separator)
          const tagsString = `${tourNameReadable}, ${purchaseTag}, ${tourTypeTag}`

          // Build attributes object with comprehensive tour information
          const attributes: Record<string, string> = {
            FIRSTNAME: firstName,
            LASTNAME: lastName,
            LAST_TOUR_PURCHASED: tour.name || 'Unknown Tour',
            TOUR_NAME: tour.name || 'Unknown Tour', // Dedicated tour name field
            TOUR_DATE: tourDateTime ? new Date(tourDateTime).toISOString() : '',
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
            listIds: [18], // Deluxe Grand Tour
            updateEnabled: true,
          })

          // Single comprehensive log
          console.log('[Tour Booking Brevo Sync]', {
            status: brevoResult.success ? 'success' : 'failed',
            email: user.email,
            tourName: tour.name || 'Unknown',
            tourDate: tourDateTime,
            listId: 18,
            tagsAttribute: tagsString,
            contactId: brevoResult.data?.id || null,
            error: brevoResult.error || null,
          })
        }
      } catch (brevoError) {
        console.log('[Tour Booking Brevo Sync]', {
          status: 'error',
          email: 'unknown',
          error: brevoError instanceof Error ? brevoError.message : 'Unknown error',
        })
      }

      // Note: Booking confirmation email will be sent after payment is completed via webhook

      return NextResponse.json({
        success: true,
        booking: createdBooking,
        message: `Tour booking created! Reference: ${bookingReference}. Please complete payment to confirm your booking.`,
      })
    } catch (error) {
      console.error('Error creating tour booking:', error)
      return NextResponse.json(
        { error: 'Failed to create tour booking. Please try again.' },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error in tour booking route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
