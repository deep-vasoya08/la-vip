import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  getTourSelectedPickupTime,
  getTourSelectedPickupLocationName,
  getTourSelectedScheduleTime,
  getTourSelectedScheduleScheduleNotes,
} from './tourBookingUtils'
import {
  getEventSelectedPickupLocationName,
  getEventSelectedPickupTime,
  getEventSelectedScheduleScheduleNotes,
  getEventSelectedScheduleTime,
} from './eventBookingUtils'
import { EventBooking, Event, TourBooking, Tour, User } from '@/payload-types'
import { formatDateTime } from './formatDateTime'

/**
 * Format tour booking data for email template
 */
export async function formatTourBookingForEmail(booking: TourBooking): Promise<{
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingId: string
  bookingDetails: {
    // id: string
    name: string
    description?: string
    date: string
    eventLocation?: string
    totalAmount: string
    pickupLocation?: string
    pickupTime?: string
    totalGuests?: number
    scheduleNotes?: string
  }
  userId: string | number
}> {
  const payload = await getPayload({ config })

  // Get user information
  let user: User | null = null
  if (booking.user) {
    const userId = typeof booking.user === 'object' ? booking.user.id : booking.user
    user = (await payload.findByID({
      collection: 'users',
      id: userId,
    })) as User
  }

  // Get tour information
  let tour: Tour | null = null
  if (booking.tour) {
    const tourId = typeof booking.tour === 'object' ? booking.tour.id : booking.tour
    tour = (await payload.findByID({
      collection: 'tours',
      id: tourId,
      depth: 2,
    })) as Tour
  }

  return {
    customerName: user?.name || user?.email || 'Valued Customer',
    customerEmail: user?.email || '',
    customerPhoneNumber: user?.phoneNumber || '',
    bookingReference: booking.bookingReference || 'N/A',
    bookingId: booking.id?.toString() || 'N/A',
    bookingDetails: {
      // id: tour?.id?.toString() || 'N/A',
      name: tour?.name || 'VIP Tour Experience',
      description: tour?.shortDescription || '',
      date: formatDateTime(getTourSelectedScheduleTime(booking, false), false, false, false),
      totalAmount: booking.pricing?.totalAmount?.toString() || '0',
      pickupLocation: getTourSelectedPickupLocationName(booking),
      pickupTime: formatDateTime(getTourSelectedPickupTime(booking, false), true, false),
      totalGuests: booking.adultCount + (booking.childCount ?? 0) || 0,
      scheduleNotes: getTourSelectedScheduleScheduleNotes(booking),
    },
    userId: Number(user?.id),
  }
}

/**
 * Format event booking data for email template
 */
export async function formatEventBookingForEmail(booking: EventBooking): Promise<{
  customerName: string
  customerEmail: string
  customerPhoneNumber: string
  bookingReference: string
  bookingId: string
  bookingDetails: {
    // id: string
    name: string
    date: string
    eventLocation?: string
    totalAmount: string
    description?: string
    pickupLocation?: string
    pickupTime?: string
    totalGuests?: number
    additionalMessage?: string
    scheduleNotes?: string
  }
  userId: string | number
}> {
  const payload = await getPayload({ config })

  // Get user information
  let user: User | null = null
  if (booking.user) {
    const userId = typeof booking.user === 'object' ? booking.user.id : booking.user
    user = (await payload.findByID({
      collection: 'users',
      id: userId,
    })) as User
  }

  // Get event information
  let event: Event | null = null
  if (booking.event) {
    const eventId = typeof booking.event === 'object' ? booking.event.id : booking.event
    event = (await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 2,
    })) as Event
  }

  return {
    customerName: user?.name || user?.email || 'Valued Customer',
    customerEmail: user?.email || '',
    customerPhoneNumber: user?.phoneNumber || '',
    bookingReference: booking.bookingReference || 'N/A',
    bookingId: booking.id?.toString() || 'N/A',
    bookingDetails: {
      // id: event?.id?.toString() || '',
      name: typeof event?.name === 'string' ? event.name : 'VIP Event Experience',
      description: typeof event?.description === 'string' ? event.description : '',
      eventLocation:
        typeof event?.venue === 'object' && event.venue !== null && 'name' in event.venue
          ? (event.venue as { name?: string }).name || 'To be confirmed'
          : 'To be confirmed',
      date: getEventSelectedScheduleTime(booking, true),
      totalAmount: booking.pricing?.totalAmount?.toString() || '0',
      pickupLocation: getEventSelectedPickupLocationName(booking),
      pickupTime: getEventSelectedPickupTime(booking),
      totalGuests: booking.adultCount + (booking.childCount ?? 0) || 0,
      scheduleNotes: getEventSelectedScheduleScheduleNotes(booking) ?? '',
    },
    userId: Number(user?.id),
  }
}
