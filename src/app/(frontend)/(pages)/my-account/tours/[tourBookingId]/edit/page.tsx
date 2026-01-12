'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { TourBooking, Tour } from '@/payload-types'
import { ArrowLeft, XCircle, AlertCircle, Clock } from 'lucide-react'
import EditTourBooking from '@/components/EditTourBooking'
import { isTourScheduleInPast } from '@/utilities/tourBookingUtils'

export default function EditTourBookingPage() {
  const params = useParams() as { tourBookingId: string }
  const bookingId = params.tourBookingId
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [booking, setBooking] = useState<TourBooking | null>(null)
  const [availableTours, setAvailableTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/my-account')
    }
  }, [authLoading, isAuthenticated, router])

  // Data fetching
  useEffect(() => {
    const fetchBookingAndEvents = async () => {
      if (!bookingId || !isAuthenticated) return

      try {
        setIsLoading(true)

        // Fetch booking details and available events in parallel
        const [bookingResponse, toursResponse] = await Promise.all([
          fetch(`/api/bookings/tours/${bookingId}?paymentStatus=failed,completed`),
          fetch('/api/get-booking-tours'),
        ])

        if (!bookingResponse.ok) {
          throw new Error('Failed to fetch tour booking details')
        }
        if (!toursResponse.ok) {
          throw new Error('Failed to fetch available tours')
        }

        const [bookingData, toursData] = await Promise.all([
          bookingResponse.json(),
          toursResponse.json(),
        ])

        setBooking(bookingData.booking)
        setAvailableTours(toursData.tours || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookingAndEvents()
  }, [bookingId, isAuthenticated])

  // Navigation handlers
  const handleBackToBooking = () => {
    router.push(`/my-account/tours/${bookingId}`)
  }

  const handleEditSuccess = () => {
    router.push(`/my-account/tours/${bookingId}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="mustard" onClick={handleBackToBooking}>
              Back to Booking
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Booking not found
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">
              The booking you&apos;re trying to edit could not be found.
            </p>
            <Button variant="mustard" onClick={() => router.push('/my-account')}>
              Back to My Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if booking is editable
  const isEditable = booking.status === 'confirmed' || booking.status === 'pending'
  const isPastTour = isTourScheduleInPast(booking)
  if (!isEditable) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Cannot Be Edited</h1>
            <p className="text-gray-600 mb-6">
              This booking cannot be edited because it has been {booking.status}.
            </p>
            <Button variant="mustard" onClick={handleBackToBooking}>
              Back to Booking Details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if tour is in the past
  if (isPastTour) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tour Has Already Taken Place</h1>
            <p className="text-gray-600 mb-6">
              This tour has already occurred and cannot be modified. Past tours cannot be edited or
              cancelled.
            </p>
            <Button variant="mustard" onClick={handleBackToBooking}>
              Back to Booking Details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-mustard text-white p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
                <Button
                  variant="mustard"
                  size="small"
                  onClick={handleBackToBooking}
                  className="text-white bg-white/10 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Edit Tour Booking</h1>
                  <p className="text-sm md:text-base text-blue-100">
                    Booking Reference: {booking.bookingReference}
                  </p>
                </div>
              </div>
              <Chip
                color={booking.status === 'confirmed' ? 'success' : 'warning'}
                text={booking.status || 'unknown'}
                className="text-xs font-roboto w-fit"
                isBackgroundWhite={true}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <EditTourBooking
              booking={booking}
              availableTours={availableTours}
              onSuccess={handleEditSuccess}
              onCancel={handleBackToBooking}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
