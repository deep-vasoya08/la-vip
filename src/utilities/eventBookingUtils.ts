import { EventBooking, Venue, Event as PayloadEvent } from '@/payload-types'
import { formatDateTime } from './formatDateTime'
import { EventOption, PickupLocation, ScheduleOption } from '@/components/EventBookingPayment/types'

/**
 * Types for event booking data
 */

interface ImageSize {
  url: string | null
  width: number | null
  height: number | null
  mimeType: string | null
  filesize: number | null
  filename: string | null
}

interface ImageSizes {
  thumbnail: ImageSize
  square: ImageSize
  small: ImageSize
  medium: ImageSize
  large: ImageSize
  xlarge: ImageSize
  og: ImageSize
}

interface Image {
  id: number
  alt: string | null
  caption: string | null
  prefix: string
  updatedAt: string
  createdAt: string
  url: string
  thumbnailURL: string
  filename: string
  mimeType: string
  filesize: number
  width: number
  height: number
  focalX: number
  focalY: number
  sizes: ImageSizes
}

interface EventDetailsPageLink {
  link: {
    type: string
    newTab: boolean | null
    reference: {
      relationTo: string
      value: {
        id: number
        title: string
        slug: string
      }
    }
    url: string | null
    label: string
  }
}

interface User {
  id: number
  name: string
  googleId: string | null
  appleId: string | null
  image: string | null
  role: string
  phoneNumber: string
  receiveTexts: boolean
  stripeCustomerId: string | null
  updatedAt: string
  createdAt: string
  email: string
  loginAttempts: number
}

interface PickupTime {
  id: string
  time: string
  time_tz: string
}

interface Hotel {
  id: number
  name: string
  description: string | null
  location: string
  rating: number
  images: Image
  updatedAt: string
  createdAt: string
}

interface Pickup {
  id: string
  hotel: Hotel
  adult_price: number
  children_price: number
  pickup_times: PickupTime[]
}

interface Schedule {
  id: string
  event_date_time: string
  schedule_status: string
  schedule_notes: string | null
  pickups: Pickup[]
}

interface Event {
  id: number
  name: string
  venue: Venue
  description: string | null
  duration_hours: number
  status: string
  eventAvatarImage: Image
  eventDetailsPageLink: EventDetailsPageLink
  schedules: Schedule[]
  eventImages: Image[]
  updatedAt: string
  createdAt: string
}

interface PickupDetails {
  locationId: string
  hotelId: number
  selectedTimeId: string
}

interface Pricing {
  adultPrice: number
  childrenPrice: number
  adultTotal: number
  childTotal: number
  totalAmount: number
  currency: string
}

/**
 * Get the selected pickup time for an event booking
 * @param booking The booking object
 * @returns Formatted datetime string or 'N/A' if not found
 */
export const getEventSelectedPickupTime = (booking: EventBooking): string => {
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event) return 'N/A'

  const schedule = event.schedules?.find((s) => s.id === booking.scheduleId)
  const pickup = schedule?.pickups?.find((p) => p.id === booking.pickupDetails.locationId)
  const selectedTime = pickup?.pickup_times?.find(
    (t) => t.id === booking.pickupDetails.selectedTimeId,
  )

  return selectedTime ? formatDateTime(selectedTime.time) : 'N/A'
}

/**
 * Get all event schedule dates/times for a booking
 * @param booking The booking object
 * @returns Array of formatted datetime strings or 'Not specified' if not found
 */
export const getEventScheduleTimes = (booking: EventBooking): string[] | string => {
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event?.schedules || event.schedules.length === 0) {
    return 'Not specified'
  }

  return event.schedules.map((schedule) => formatDateTime(schedule.event_date_time))
}

/**
 * Get selected event schedule date/time for a booking
 * @param booking The booking object
 * @param isformattedDate Whether to return formatted date or raw date string
 * @returns Formatted datetime string or raw date string, or 'Not specified' if not found
 */
export const getEventSelectedScheduleTime = (
  booking: EventBooking,
  isformattedDate: boolean = true,
): string => {
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event) return 'Not specified'

  const schedule = event.schedules?.find((s) => s.id === booking.scheduleId)

  if (isformattedDate) {
    return schedule ? formatDateTime(schedule.event_date_time) : 'Not specified'
  }
  return schedule ? schedule.event_date_time : 'Not specified'
}

/**
 * Get pickup location name
 * @param booking The booking object
 * @returns Hotel name or 'Not specified' if not found
 */
export const getEventSelectedPickupLocationName = (booking: EventBooking): string => {
  console.log('booking', booking)
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event) return 'Not specified'

  const schedule = event.schedules?.find((s) => s.id === booking.scheduleId)
  const pickup = schedule?.pickups?.find((p) => p.id === booking.pickupDetails.locationId)
  return typeof pickup?.hotel === 'object'
    ? pickup.hotel.name + (pickup.hotel.location ? ' - ' + pickup.hotel.location : '')
    : 'Not specified'
}

/**
 * Get event schedule notes
 * @param booking The booking object
 * @returns Schedule notes or 'Not specified' if not found
 */
export const getEventSelectedScheduleScheduleNotes = (booking: EventBooking): string | null => {
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event) return null

  const schedule = event.schedules?.find((s) => s.id === booking.scheduleId)
  return schedule?.schedule_notes ?? 'Not specified'
}

/**
 * Get event details including name, schedule, and pickup information
 * @param booking The booking object
 * @returns Object containing event details with all IDs and nested structure
 */
export const getFormattedEventDetails = (booking: EventBooking) => {
  const event = typeof booking.event === 'object' ? booking.event : null
  if (!event) return null

  const schedule = event.schedules?.find((s) => s.id === booking.scheduleId)
  const pickup = schedule?.pickups?.find((p) => p.id === booking.pickupDetails.locationId)
  const selectedTime = pickup?.pickup_times?.find(
    (t) => t.id === booking.pickupDetails.selectedTimeId,
  )

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
    event: {
      id: event.id,
      name: event.name,
      venue:
        event.venue && typeof event.venue === 'object'
          ? {
              id: event.venue.id,
              name: event.venue.name,
              address: event.venue.address,
              city: event.venue.city,
            }
          : null,
      description: event.description,
      duration_hours: event.duration_hours,
      status: event.status,
      eventAvatarImage:
        event.eventAvatarImage && typeof event.eventAvatarImage === 'object'
          ? {
              id: event.eventAvatarImage.id,
              url: event.eventAvatarImage.url,
            }
          : null,
      schedule: schedule
        ? {
            id: schedule.id,
            dateTime: formatDateTime(schedule.event_date_time),
            rawDateTime: schedule.event_date_time,
            status: schedule.schedule_status,
            notes: schedule.schedule_notes,
          }
        : null,
    },
    pickupDetails: {
      locationId: booking.pickupDetails.locationId,
      hotelId: booking.pickupDetails.hotelId,
      selectedTimeId: booking.pickupDetails.selectedTimeId,
      hotel:
        pickup?.hotel && typeof pickup.hotel === 'object'
          ? {
              id: pickup.hotel.id,
              name: pickup.hotel.name,
              location: pickup.hotel.location,
              rating: pickup.hotel.rating,
            }
          : null,
      pickupTime: selectedTime
        ? {
            id: selectedTime.id,
            time: formatDateTime(selectedTime.time),
            rawTime: selectedTime.time,
            timeZone: selectedTime.time_tz,
          }
        : null,
    },
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    notes: booking.notes,
  }
}

/**
 * Format events data for BookingForm component
 * @param events - Array of events
 * @returns Array of formatted events
 */
export const formatEventsForBookingForm = (events: PayloadEvent[]): EventOption[] => {
  return events?.map((event) => {
    // Format each schedule
    const formattedSchedules: ScheduleOption[] = []

    if (event.schedules && event.schedules.length > 0) {
      event.schedules.forEach((schedule) => {
        // Format the schedule date
        // Using formatDateTime utility with custom date format for schedules
        const scheduleDate = formatDateTime(schedule.event_date_time)

        // Create pickup locations for this schedule
        const pickupLocations: PickupLocation[] = []

        if (schedule.pickups && schedule.pickups.length > 0) {
          // Process each pickup location
          schedule.pickups.forEach((pickup) => {
            // Format each pickup time
            const pickupTimes =
              pickup.pickup_times?.map((pt) => {
                return {
                  id: pt.id || '',
                  // Using formatDateTime utility for pickup times
                  time: formatDateTime(pt.time, true, true),
                }
              }) || []

            // Add pickup location with price information
            pickupLocations.push({
              id: pickup.id || '',
              name:
                pickup?.hotel && typeof pickup.hotel === 'object' && 'name' in pickup.hotel
                  ? pickup.hotel.name.toString()
                  : '',
              location:
                pickup?.hotel && typeof pickup.hotel === 'object' && 'location' in pickup.hotel
                  ? pickup.hotel.location.toString()
                  : '',
              pickupTimes: pickupTimes,
              adultPrice: pickup.adult_price,
              childrenPrice: pickup.children_price || 0,
            })
          })
        }

        // Add formatted schedule to the list
        formattedSchedules.push({
          id: schedule.id || '',
          date: scheduleDate,
          status: schedule.schedule_status,
          pickupLocations: pickupLocations,
        })
      })
    }

    return {
      id: String(event.id), // Convert number to string
      name: event.name || 'Unnamed Event',
      schedules: formattedSchedules,
    }
  })
}

/**
 * Check if an event schedule is in the past
 * @param booking The booking object
 * @returns true if the event schedule is in the past, false otherwise
 */
export const isEventScheduleInPast = (booking: EventBooking): boolean => {
  const scheduleTime = getEventSelectedScheduleTime(booking, false)
  const eventDateTime = new Date(scheduleTime)
  const currentDateTime = new Date()
  // edit schedule time to be 2 hours before the event time
  eventDateTime.setHours(eventDateTime.getHours() - 2)
  return eventDateTime < currentDateTime
}
