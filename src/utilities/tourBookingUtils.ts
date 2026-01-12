import { Tours } from './../collections/Tours/index'
import { Hotel, Tour, TourBooking } from '@/payload-types'
import { formatDateTime } from './formatDateTime'
import { generateTourDates } from './tourScheduleUtils'

// Helper function to generate schedule ID from date (YYYY-MM-DD format)
const generateScheduleIdFromDate = (dateTime: string): string => {
  try {
    const date = new Date(dateTime)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch (error) {
    console.error('Error generating schedule ID from date:', error)
    return 'unknown-date'
  }
}

/**
 * Calculate hour adjustment based on daylight saving time (DST)
 * During Standard Time (PST): +1 hour
 * During Daylight Saving Time (PDT): no adjustment
 *
 * DST in US (Pacific Time):
 * - Starts: Second Sunday in March at 2:00 AM
 * - Ends: First Sunday in November at 2:00 AM
 *
 * This function works for ANY year (2025, 2026, 2027, etc.) as it dynamically
 * calculates the DST transition dates based on the year from the input date.
 *
 * Note: Based on US DST rules since 2007 (Energy Policy Act of 2005).
 * If DST rules change in the future, this function will need to be updated.
 *
 * @param date The date to check
 * @returns Hour adjustment (1 for Standard Time, 0 for DST)
 */
const getSeasonalHourAdjustment = (): number => {
  const now = new Date()
  const year = now.getFullYear()

  // Find second Sunday in March (DST starts)
  const marchFirst = new Date(year, 2, 1) // March 1st
  const marchFirstDay = marchFirst.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilFirstSunday = marchFirstDay === 0 ? 0 : 7 - marchFirstDay
  const secondSundayMarch = new Date(year, 2, 1 + daysUntilFirstSunday + 7)
  secondSundayMarch.setHours(2, 0, 0, 0) // DST starts at 2:00 AM

  // Find first Sunday in November (DST ends)
  const novemberFirst = new Date(year, 10, 1) // November 1st
  const novemberFirstDay = novemberFirst.getDay()
  const daysUntilFirstSundayNov = novemberFirstDay === 0 ? 0 : 7 - novemberFirstDay
  const firstSundayNovember = new Date(year, 10, 1 + daysUntilFirstSundayNov)
  firstSundayNovember.setHours(2, 0, 0, 0) // DST ends at 2:00 AM

  // Check if the date is in DST period (between March and November DST dates)
  const isDST = now >= secondSundayMarch && now < firstSundayNovember

  // If in DST, no adjustment needed (0), otherwise add 1 hour for Standard Time
  return isDST ? 0 : 1
}

// /**
//  * Types for tour booking data
//  */

// interface PickupTime {
//   id: string
//   time: string
//   time_tz: string
// }

// interface Pickup {
//   id: string
//   hotel: Hotel
//   adult_price: number
//   children_price: number
//   pickup_times: PickupTime[]
// }

// interface Schedule {
//   id: string
//   tour_date_time: string
//   schedule_notes: string | null
//   pickups: Pickup[]
// }

// interface PickupDetails {
//   locationId: string
//   hotelId: number | null
//   pickupTimeId: string | null
// }

// interface Pricing {
//   adultPrice: number
//   childrenPrice: number
//   adultTotal: number
//   childTotal: number
//   totalAmount: number
//   currency: string | null
// }

/**
 * Get the selected pickup time for a tour booking
 * @param booking The booking object
 * @returns Formatted datetime string or 'N/A' if not found
 */
export const getTourSelectedPickupTime = (
  booking: TourBooking,
  isFormatted: boolean = true,
): string => {
  console.log('getTourSelectedPickupTime - booking details:', {
    id: booking.id,
    pickupDetails: booking.pickupDetails,
    tour: typeof booking.tour === 'object' ? booking.tour.name : booking.tour,
  })

  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) {
    console.log('No tour found in booking')
    return 'N/A'
  }

  // With new schema, pickup time is saved directly in booking details
  // if (
  //   booking.pickupDetails &&
  //   typeof booking.pickupDetails === 'object' &&
  //   'pickupDateTime' in booking.pickupDetails
  // ) {
  //   const pickupDateTime = (booking.pickupDetails as any).pickupDateTime
  //   console.log('Found pickupDateTime in booking:', pickupDateTime)
  //   if (typeof pickupDateTime === 'string' && pickupDateTime !== 'Not specified') {
  //     try {
  //       return isFormatted ? formatDateTime(pickupDateTime) : pickupDateTime
  //     } catch (error) {
  //       console.error('Error formatting pickupDateTime:', error)
  //     }
  //   }
  // }

  // Fallback 1: Calculate from tourDateTime and tour pickup configuration
  if (
    booking.pickupDetails &&
    typeof booking.pickupDetails === 'object' &&
    'tourDateTime' in booking.pickupDetails &&
    'hotelId' in booking.pickupDetails
  ) {
    const tourDateTime = (booking.pickupDetails as any).tourDateTime
    const hotelId = (booking.pickupDetails as any).hotelId

    console.log('Attempting fallback calculation with:', { tourDateTime, hotelId })

    if (typeof tourDateTime === 'string' && hotelId) {
      // Find the pickup configuration for this hotel
      const pickup = tour.pickups?.find((p) => {
        const pickupHotelId = typeof p.hotel === 'object' ? p.hotel.id : p.hotel
        return pickupHotelId === hotelId
      })

      if (pickup) {
        try {
          const tourDate = new Date(tourDateTime)
          const pickupTime = new Date(pickup.pickup_time)

          if (!isNaN(tourDate.getTime()) && !isNaN(pickupTime.getTime())) {
            const pickupDateTime = new Date(tourDate)
            const hourAdjustment = getSeasonalHourAdjustment()
            // Use UTC methods to avoid DST issues
            pickupDateTime.setUTCHours(
              pickupTime.getUTCHours() + hourAdjustment,
              pickupTime.getUTCMinutes(),
              0,
              0,
            )
            console.log('Calculated pickup time:', pickupDateTime.toISOString())
            return isFormatted
              ? formatDateTime(pickupDateTime.toISOString())
              : pickupDateTime.toISOString()
          }
        } catch (error) {
          console.error('Error calculating pickup time:', error)
        }
      } else {
        console.log('No pickup configuration found for hotel ID:', hotelId)
      }
    }
  }

  // Fallback 2: For old schema bookings, try to extract from legacy pickup details
  if (booking.pickupDetails && typeof booking.pickupDetails === 'object') {
    // Check if this is an old-style booking with different pickup details structure
    const legacyPickupTime =
      (booking.pickupDetails as any).pickupTimeId ||
      (booking.pickupDetails as any).selectedPickupTimeId
    if (legacyPickupTime) {
      console.log('Found legacy pickup time reference:', legacyPickupTime)
      // For legacy bookings, we might need to show a generic message
      return 'Time to be confirmed'
    }
  }

  console.log('No pickup time could be determined')
  return 'Time to be confirmed'
}

/**
 * Get all tour schedule dates/times for a booking (legacy function - now returns single booking date)
 * @param booking The booking object
 * @returns Array with single formatted datetime string or 'Not specified' if not found
 */
export const getTourScheduleTimes = (booking: TourBooking): string[] | string => {
  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) return 'Not specified'

  // With new schema, return the specific booking date
  if (
    booking.pickupDetails &&
    typeof booking.pickupDetails === 'object' &&
    'tourDateTime' in booking.pickupDetails
  ) {
    const tourDateTime = (booking.pickupDetails as any).tourDateTime
    return typeof tourDateTime === 'string' ? [formatDateTime(tourDateTime)] : 'Not specified'
  }

  return 'Not specified'
}

/**
 * Get selected tour schedule date/time for a booking
 * @param booking The booking object
 * @param isformattedDate Whether to return formatted date or raw date string
 * @returns Formatted datetime string or raw date string, or 'Not specified' if not found
 */
export const getTourSelectedScheduleTime = (
  booking: TourBooking,
  isformattedDate: boolean = true,
): string => {
  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) return 'Not specified'

  // First try: get the tour date from booking pickupDetails
  if (
    booking.pickupDetails &&
    typeof booking.pickupDetails === 'object' &&
    'tourDateTime' in booking.pickupDetails
  ) {
    const tourDateTime = (booking.pickupDetails as any).tourDateTime
    if (typeof tourDateTime === 'string' && tourDateTime !== 'Not specified') {
      return isformattedDate ? formatDateTime(tourDateTime) : tourDateTime
    }
  }

  // Second try: use the new scheduledDate field
  if (booking.scheduledDate) {
    const scheduledDate =
      typeof booking.scheduledDate === 'string'
        ? booking.scheduledDate
        : String(booking.scheduledDate)
    if (scheduledDate !== 'Not specified') {
      return isformattedDate ? formatDateTime(scheduledDate) : scheduledDate
    }
  }

  return 'Not specified'
}

/**
 * Get pickup location name
 * @param booking The booking object
 * @returns Hotel name or 'Not specified' if not found
 */
export const getTourSelectedPickupLocationName = (booking: TourBooking): string => {
  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) return 'Not specified'

  // Try to get hotel ID from different sources
  let hotelId = null
  if (booking.pickupDetails?.hotelId) {
    hotelId = booking.pickupDetails.hotelId
  } else if (booking.pickupDetails?.locationId) {
    // Fallback: try to parse hotel ID from locationId
    hotelId = parseInt(booking.pickupDetails.locationId)
  }

  if (!hotelId) return 'Not specified'

  // With new schema, find pickup location by hotel ID
  const pickup = tour.pickups?.find((p) => {
    const pickupHotelId = typeof p.hotel === 'object' ? p.hotel.id : p.hotel
    return pickupHotelId == hotelId // Use == for flexible comparison
  })

  return typeof pickup?.hotel === 'object'
    ? pickup.hotel.name + (pickup.hotel.location ? ' - ' + pickup.hotel.location : '')
    : 'Not specified'
}

/**
 * Get tour schedule schedule notes
 * @param booking The booking object
 * @returns Schedule notes or 'Not specified' if not found
 */
export const getTourSelectedScheduleScheduleNotes = (booking: TourBooking): string => {
  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) return 'Not specified'

  // With new schema, schedule notes are at tour level
  return tour.schedule_notes ?? 'Not specified'
}
/**
 * Get tour details including name, schedule, and pickup information
 * @param booking The booking object
 * @returns Object containing tour details with all IDs and nested structure
 */
export const getFormattedTourDetails = (booking: TourBooking) => {
  const tour = typeof booking.tour === 'object' ? booking.tour : null
  if (!tour) return null

  // With new schema, find pickup location by hotel ID
  const pickup = tour.pickups?.find((p: any) => {
    const hotelId = typeof p.hotel === 'object' ? p.hotel.id : p.hotel
    return hotelId === booking.pickupDetails.hotelId
  })

  // Get tour date time from booking details
  const tourDateTime =
    booking.pickupDetails &&
    typeof booking.pickupDetails === 'object' &&
    'tourDateTime' in booking.pickupDetails
      ? (booking.pickupDetails as any).tourDateTime
      : null

  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    user:
      booking.user && typeof booking.user === 'object'
        ? {
            id: booking.user.id,
            name: booking.user.name,
            email: booking.user.email,
            phoneNumber: booking.user.phoneNumber,
            role: booking.user.role,
          }
        : null,
    bookedBy:
      booking.bookedBy && typeof booking.bookedBy === 'object'
        ? {
            id: booking.bookedBy.id,
            name: booking.bookedBy.name,
            email: booking.bookedBy.email,
          }
        : null,
    status: booking.status,
    adultCount: booking.adultCount,
    childCount: booking.childCount,
    pricing: booking.pricing,
    tour: {
      id: tour.id,
      name: tour.name,
      description: tour.description,
      shortDescription: tour.shortDescription,
      tourAvatarImage:
        tour.tourAvatarImage && typeof tour.tourAvatarImage === 'object'
          ? {
              id: tour.tourAvatarImage.id,
              url: tour.tourAvatarImage.url,
            }
          : null,
      schedule:
        tourDateTime && typeof tourDateTime === 'string'
          ? {
              id: generateScheduleIdFromDate(tourDateTime), // Generate schedule ID from the date
              dateTime: formatDateTime(tourDateTime),
              rawDateTime: tourDateTime,
              notes: tour.schedule_notes,
            }
          : null,
    },
    pickupDetails: {
      locationId: booking.pickupDetails.locationId,
      hotelId: booking.pickupDetails.hotelId,
      hotel:
        pickup?.hotel && typeof pickup.hotel === 'object'
          ? {
              id: pickup.hotel.id,
              name: pickup.hotel.name,
              location: pickup.hotel.location,
              rating: pickup.hotel.rating,
            }
          : null,
      pickupTime: pickup
        ? {
            time: formatDateTime(pickup.pickup_time),
            rawTime: pickup.pickup_time,
          }
        : null,
    },
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    notes: booking.notes,
  }
}

// Format tour data for the booking form using new RRULE-based schema
export const formatTourDataForBookingForm = (tours: Tour[]) => {
  return tours.map((tour) => {
    // Generate schedules dynamically from RRULE
    let generatedSchedules: any[] = []

    if (
      tour.isBookable &&
      tour.recurrence_rule &&
      tour.tour_start_time &&
      tour.booking_window_months &&
      tour.recurrence_rule.trim() !== '' &&
      tour.tour_start_time.trim() !== ''
    ) {
      try {
        const config = {
          tour_start_time: tour.tour_start_time,
          tour_start_date: tour.tour_start_date || undefined,
          recurrence_rule: tour.recurrence_rule,
          booking_window_months: tour.booking_window_months,
          schedule_notes: tour.schedule_notes || undefined,
        }

        const generatedDates = generateTourDates(config)

        generatedSchedules = generatedDates.map((date: any) => ({
          id: date.id,
          tour_date_time: date.tour_date_time,
          schedule_notes: tour.schedule_notes || '',
          schedule_status: 'available',
          pickups:
            tour.pickups?.map((pickup: any) => {
              const hotelId = typeof pickup.hotel === 'number' ? pickup.hotel : pickup.hotel.id
              return {
                id: hotelId.toString(), // Use hotel ID as pickup ID for consistency
                hotel: {
                  id: hotelId,
                  name: typeof pickup.hotel === 'number' ? '' : pickup.hotel.name,
                  location: typeof pickup.hotel === 'number' ? '' : pickup.hotel.location,
                },
                pickup_times: [
                  {
                    id: `${date.id}-${hotelId}-time`,
                    time: (() => {
                      // Calculate pickup time based on tour date and pickup offset using UTC methods
                      const tourDate = new Date(date.tour_date_time)
                      const pickupTime = new Date(pickup.pickup_time)
                      const pickupDateTime = new Date(tourDate)
                      const hourAdjustment = getSeasonalHourAdjustment()
                      // Use UTC methods to avoid DST issues
                      pickupDateTime.setUTCHours(
                        pickupTime.getUTCHours() + hourAdjustment,
                        pickupTime.getUTCMinutes(),
                        0,
                        0,
                      )
                      return pickupDateTime.toISOString()
                    })(),
                    time_tz: 'America/Los_Angeles', // Default timezone
                  },
                ],
                adult_price: pickup.adult_price,
                children_price: pickup.children_price || 0,
              }
            }) || [],
        }))
      } catch (error) {
        console.error(`Error generating schedules for tour ${tour.id}:`, error)
      }
    }

    return {
      id: String(tour.id),
      name: tour.name,
      schedules: generatedSchedules,
    }
  })
}

/**
 * Check if an event schedule is in the past
 * @param booking The booking object
 * @returns true if the event schedule is in the past, false otherwise
 */
export const isTourScheduleInPast = (booking: TourBooking): boolean => {
  const scheduleTime = getTourSelectedScheduleTime(booking, false)

  // Handle case where tour date is not available
  if (!scheduleTime || scheduleTime === 'Not specified') {
    return false // If we can't determine the date, assume it's not in the past
  }

  try {
    const tourDateTime = new Date(scheduleTime)

    // Check if the date is valid
    if (isNaN(tourDateTime.getTime())) {
      console.error('Invalid tour date time:', scheduleTime)
      return false
    }

    const currentDateTime = new Date()
    // edit schedule time to be 2 hours before the tour time
    tourDateTime.setHours(tourDateTime.getHours() - 2)
    return tourDateTime < currentDateTime
  } catch (error) {
    console.error('Error checking if tour schedule is in past:', error)
    return false
  }
}
