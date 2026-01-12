'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EventBooking } from '@/payload-types'
import PaymentComponent from '@/components/EventBookingPayment/PendingPaymentForm'
import { AlertCircle } from 'lucide-react'

export default function EventPaymentPage() {
  const params = useParams() as { eventBookingId: string }
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const bookingId = params.eventBookingId

  const [booking, setBooking] = useState<EventBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/my-account')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId || !isAuthenticated) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/bookings/events/${bookingId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch booking details')
        }

        const data = await response.json()
        setBooking(data.booking)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError(err instanceof Error ? err.message : 'Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, isAuthenticated])

  // Handle back navigation
  const handleBack = () => {
    router.push(`/my-account/events/${bookingId}`)
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" message="Loading payment page..." />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Error Loading Payment</h2>
          <p className="text-black mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Booking
          </button>
        </div>
      </div>
    )
  }

  // No booking found
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Booking Not Found</h2>
          <p className="text-black mb-6">The booking you&apos;re looking for could not be found.</p>
          <button
            onClick={() => router.push('/my-account')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PaymentComponent booking={booking} onBack={handleBack} showBackButton={true} />
      </div>
    </div>
  )
}
