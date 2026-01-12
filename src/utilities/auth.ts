import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/options'
import { NextRequest } from 'next/server'
import { EventBooking, TourBooking, User } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
/**
 * Get authenticated user session
 */
export async function getAuthenticatedUser(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { error: 'Authentication required', statusCode: 401 }
    }
    return { user: session.user }
  } catch (error) {
    return { error: 'Authentication failed', statusCode: 401 }
  }
}

/**
 * Interface for booking validation result
 */
export interface BookingValidationResult {
  isValid: boolean
  booking?: TourBooking | EventBooking
  user?: User
  error?: string
  statusCode?: number
}
/**
 * Validate booking access and editability
 */
export async function validateBookingAccess(
  bookingId: string,
  userId: string,
  userRole: string,
  bookingType: 'tour' | 'event',
): Promise<BookingValidationResult> {
  try {
    // Get existing booking
    const booking = await payload.findByID({
      collection: bookingType === 'tour' ? 'tour_bookings' : 'event_bookings',
      id: bookingId,
      depth: 2,
    })

    if (!booking) {
      return { isValid: false, error: 'Booking not found', statusCode: 404 }
    }

    // Verify user has access to this booking
    const userHasAccess =
      userRole === 'admin' ||
      (typeof booking.user === 'object' && booking.user?.id === Number(userId)) ||
      (typeof booking.bookedBy === 'object' && booking.bookedBy?.id === Number(userId))

    if (!userHasAccess) {
      return { isValid: false, error: 'Access denied', statusCode: 403 }
    }

    // Check if booking is editable
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return { isValid: false, error: 'This booking cannot be edited', statusCode: 400 }
    }

    // Get user details
    const bookingUserId =
      typeof booking.user === 'object' && booking.user ? booking.user.id : booking.user || userId

    const user = await payload.findByID({
      collection: 'users',
      id: bookingUserId,
    })

    if (!user) {
      return { isValid: false, error: 'User not found', statusCode: 404 }
    }

    return { isValid: true, booking, user }
  } catch (error) {
    console.error('Booking validation error:', error)
    return { isValid: false, error: 'Validation failed', statusCode: 500 }
  }
}
