'use client'

import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Chip } from '@/components/ui/chip'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { STATUS_COLOR } from '@/types/bookings'
import { EventBooking, TourBooking, Event, Tour, User } from '@/payload-types'
import {
  getEventSelectedPickupLocationName,
  getEventSelectedPickupTime,
  getEventSelectedScheduleTime,
} from '@/utilities/eventBookingUtils'
import {
  getTourSelectedPickupLocationName,
  getTourSelectedPickupTime,
  getTourSelectedScheduleTime,
} from '@/utilities/tourBookingUtils'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('events') // 'events' or 'tours'
  const [eventBookings, setEventBookings] = useState<EventBooking[]>([])
  const [tourBookings, setTourBookings] = useState<TourBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/my-account')
    }
  }, [isLoading, isAuthenticated, router])

  const fetchUserBookings = useCallback(async () => {
    if (!isAuthenticated || !user) return

    try {
      setBookingsLoading(true)
      const response = await fetch('/api/user-bookings?status=confirmed,cancelled,completed')

      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }

      const data = await response.json()
      setEventBookings(data.bookings || [])
      setTourBookings(data.tourBookings || [])
    } catch (err) {
      console.error('Error fetching trips:', err)
      setBookingsError('Could not load your trips. Please try again later.')
    } finally {
      setBookingsLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchUserBookings()
  }, [isAuthenticated, user, fetchUserBookings])

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading your account..." />
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const renderBookingCard = (booking: EventBooking | TourBooking, type: 'event' | 'tour') => {
    const isEventBooking = type === 'event'

    // Type-safe property access
    const eventBooking = isEventBooking ? (booking as EventBooking) : null
    const tourBooking = !isEventBooking ? (booking as TourBooking) : null

    const name = isEventBooking
      ? eventBooking && typeof eventBooking.event === 'object'
        ? eventBooking.event.name
        : 'Event Details'
      : tourBooking && typeof tourBooking.tour === 'object'
        ? tourBooking.tour.name
        : 'Tour Details'

    const venue = isEventBooking
      ? eventBooking &&
        typeof eventBooking.event === 'object' &&
        typeof eventBooking.event.venue === 'object'
        ? eventBooking.event.venue.name
        : undefined
      : undefined // Tours don't have venue property

    const date = isEventBooking
      ? eventBooking
        ? getEventSelectedScheduleTime(eventBooking)
        : null
      : tourBooking
        ? formatDateTime(getTourSelectedScheduleTime(tourBooking, false), false, false, false)
        : null

    const pickupLocation = isEventBooking
      ? eventBooking
        ? getEventSelectedPickupLocationName(eventBooking)
        : ''
      : tourBooking
        ? getTourSelectedPickupLocationName(tourBooking)
        : ''

    const pickupTime = isEventBooking
      ? eventBooking
        ? getEventSelectedPickupTime(eventBooking)
        : ''
      : tourBooking
        ? getTourSelectedPickupTime(tourBooking)
        : ''

    const detailsPath = isEventBooking
      ? `/my-account/events/${booking.id}`
      : `/my-account/tours/${booking.id}`

    return (
      <div key={booking.id} className="border rounded-md p-4 shadow-sm">
        <div className="flex flex-col mb-2">
          <div className="flex items-center mb-1 justify-between">
            <span className="text-lg font-semibold text-black font-roboto">{name || 'N/A'}</span>
            <Chip
              color={STATUS_COLOR[booking.status as keyof typeof STATUS_COLOR]}
              text={booking.status}
            />
          </div>
          <div className="text-gray text-sm font-roboto">
            Ref: <span className="text-black font-medium">{booking.bookingReference}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {venue && (
            <div>
              <p className="text-gray text-sm font-roboto">Venue:</p>
              <p className="text-black font-medium font-roboto">{venue || 'N/A'}</p>
            </div>
          )}
          <div>
            <p className="text-gray text-sm font-roboto">Booking Date:</p>
            <p className="text-black font-medium font-roboto">
              {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-gray text-sm font-roboto">
              {isEventBooking ? 'Event' : 'Tour'} Date & Time:
            </p>
            <p className="text-black font-medium font-roboto">
              {date && date !== 'Not specified' ? date : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-gray text-sm font-roboto">Booking Creator:</p>
            <p className="text-black font-medium font-roboto">
              {isAdmin ? (
                <span className="text-blue-600">
                  Admin Booking ({(booking.bookedBy as User).name})
                </span>
              ) : (
                <span>Self Booking</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-gray text-sm font-roboto">Total Participants & Amount:</p>
            <p className="text-black font-medium font-roboto">
              {/* show child and adult count */}
              {booking.adultCount} Rider{booking.adultCount !== 1 ? 's' : ''}
              {booking?.childCount
                ? booking.childCount > 0
                  ? `, ${booking.childCount} Child${booking.childCount !== 1 ? 'ren' : ''}`
                  : ''
                : ''}
              <br />
              {booking.pricing.currency} {booking.pricing.totalAmount}
            </p>
          </div>
          <div>
            <p className="text-gray text-sm font-roboto">Pickup Details:</p>
            <p className="text-black font-medium font-roboto">
              {pickupLocation} <br /> {pickupTime}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Link href={detailsPath}>
            <Button variant="mustard" className="w-full md:w-auto">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-md shadow-md p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-mustard font-semplicita mb-6">MY ACCOUNT</h1>

        <div className="grid gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-black">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray text-sm font-roboto">Name:</p>
                <p className="font-medium text-black font-roboto">{user?.name}</p>
              </div>
              <div>
                <p className="text-gray text-sm font-roboto">Email:</p>
                <p className="font-medium text-black font-roboto">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray text-sm font-roboto">Phone:</p>
                <p className="font-medium text-black font-roboto">
                  {user?.phoneNumber ? user?.phoneNumber : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray text-sm font-roboto">Role:</p>
                <p className="font-medium capitalize text-black font-roboto">
                  {user?.role || 'User'}
                </p>
              </div>
              <div>
                <p className="text-gray text-sm font-roboto">Auth Provider:</p>
                <p className="font-medium capitalize text-black font-roboto">
                  {user?.provider === 'google'
                    ? 'Google'
                    : user?.provider === 'apple'
                      ? 'Apple'
                      : user?.provider === 'credentials'
                        ? 'Email/Password'
                        : user?.provider || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Bookings Section with Tabs */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-mustard mb-4 font-bold">My Trips</h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeTab === 'events' ? 'mustard' : 'outline'}
                onClick={() => setActiveTab('events')}
                className="font-roboto"
              >
                Events ({eventBookings.length})
              </Button>
              <Button
                variant={activeTab === 'tours' ? 'mustard' : 'outline'}
                onClick={() => setActiveTab('tours')}
                className="font-roboto"
              >
                Tours ({tourBookings.length})
              </Button>
            </div>

            {bookingsLoading ? (
              <LoadingSpinner message="Loading your trips..." />
            ) : bookingsError ? (
              <p className="text-red font-roboto">{bookingsError}</p>
            ) : activeTab === 'events' ? (
              eventBookings.length === 0 ? (
                <div>
                  <p className="text-gray font-roboto mb-4">
                    You don&apos;t have any event bookings yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {eventBookings.map((booking) => renderBookingCard(booking, 'event'))}
                </div>
              )
            ) : tourBookings.length === 0 ? (
              <div>
                <p className="text-gray font-roboto mb-4">
                  You don&apos;t have any tour bookings yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {tourBookings.map((booking) => renderBookingCard(booking, 'tour'))}
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant="mustard"
                className="font-roboto w-full sm:w-auto text-sm sm:text-base px-4 py-2"
              >
                <Link href="/events"> Browse Events</Link>
              </Button>
              <Button
                variant="mustard"
                className="font-roboto w-full sm:w-auto text-sm sm:text-base px-4 py-2"
              >
                <Link href="/our-tours">Browse Tours</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
