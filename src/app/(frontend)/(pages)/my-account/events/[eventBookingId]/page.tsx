'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatDateTime } from '@/utilities/formatDateTime'
import { EventBooking, EventBookingPayment } from '@/payload-types'
import { Chip, ChipStatus } from '@/components/ui/chip'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  Info,
  RefreshCcw,
  HelpCircle,
  Edit,
} from 'lucide-react'
import {
  getEventSelectedPickupLocationName,
  getEventSelectedPickupTime,
  getEventSelectedScheduleTime,
  isEventScheduleInPast,
} from '@/utilities/eventBookingUtils'

const BOOKING_STATUS_COLOR: Record<string, ChipStatus> = {
  completed: 'success',
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
}

const PAYMENT_STATUS_COLOR: Record<string, ChipStatus> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'success',
}

export default function EventDetailsPage() {
  const params = useParams() as { eventBookingId: string }
  const bookingId = params.eventBookingId
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [booking, setBooking] = useState<EventBooking | null>(null)
  const [payments, setPayments] = useState<EventBookingPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const handleCancelBooking = async (bookingId: string, reference: string, _paymentId?: string) => {
    if (cancelLoading) return

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${reference}? This action cannot be undone.`,
    )

    if (!confirmCancel) return

    try {
      setCancelLoading(bookingId)

      const response = await fetch('/api/bookings/events/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Booking cancelled successfully! ${data.message}`)
        // Refresh the booking data to show updated status
        window.location.reload()
      } else {
        alert(`Failed to cancel booking: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('An error occurred while cancelling the booking. Please try again.')
    } finally {
      setCancelLoading(null)
    }
  }

  const handleContinuePayment = async () => {
    if (paymentLoading || !booking) return

    try {
      setPaymentLoading(true)

      const response = await fetch('/api/bookings/events/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to new payment page - payment intent will be created there
        router.push(`/my-account/events/${booking.id}/payment`)
      } else {
        alert(`Failed to initiate payment: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error initiating payment:', error)
      alert('An error occurred while initiating payment. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/my-account')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !isAuthenticated) return

      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/bookings/events/${bookingId}?paymentStatus=failed,completed`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch booking details')
        }

        const data = await response.json()
        setBooking(data.booking)
        console.log('set payments on details page', data?.payments)

        // Set payment data if available
        if (data.payments && Array.isArray(data.payments)) {
          setPayments(data.payments)
        }
        console.log('Selected Id Booking Data', data)
      } catch (err: unknown) {
        console.error('Error fetching booking details:', err)
        // Display the actual error message from the backend if available
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('An error occurred while fetching booking details. Please try again later.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookingDetails()
  }, [bookingId, isAuthenticated])

  // Loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading event booking details..." />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-4">Something went wrong</h1>
            <p className="text-black mb-6">{error}</p>
            <Button
              variant="mustard"
              className="font-semibold"
              onClick={() => router.push('/my-account')}
            >
              Back to My Trips
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not found state
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">
              The booking you&apos;re looking for could not be found.
            </p>
            <Button
              variant="mustard"
              className="font-semibold"
              onClick={() => router.push('/my-account')}
            >
              Back to My Trips
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-mustard px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Event Booking Details</h1>
                <p className="text-white font-semibold">Your exclusive event experience</p>
              </div>
              <Button variant="default" onClick={() => router.push('/my-account')}>
                ← Back to My Trips
              </Button>
            </div>
          </div>

          {/* Booking Status Banner */}
          <div className="px-4 md:px-8 py-4 bg-gray-50 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
              <div className="flex items-start md:items-center space-x-3">
                {getStatusIcon(booking.status)}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-black">
                    {typeof booking?.event === 'object' ? booking.event.name : 'Event Details'}
                  </h2>
                  <p className="text-xs md:text-sm text-black">
                    Booking Reference:{' '}
                    <span className="font-mono font-semibold text-black">
                      {booking?.bookingReference}
                    </span>
                  </p>
                </div>
              </div>
              <Chip
                color={BOOKING_STATUS_COLOR[booking.status] || 'info'}
                text={booking.status.toUpperCase()}
                className="w-fit"
              />
            </div>
            <p className="text-sm text-black mt-3 md:mt-2 font-semibold w-full md:pl-8">
              {typeof booking.event === 'object'
                ? booking.event.description
                : 'Event information pending'}
            </p>
          </div>

          {/* Event Information */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Event Details */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    Event Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Venue</p>
                        <p className="font-semibold text-black">
                          {typeof booking.event === 'object' &&
                          typeof booking.event?.venue === 'object'
                            ? booking.event.venue.name
                            : 'Venue information pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Event Date</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-black">
                            {getEventSelectedScheduleTime(booking) || 'Date to be confirmed'}
                          </p>
                          {isEventScheduleInPast(booking) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Past Event
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Participants</p>
                        <p className="font-semibold text-black">
                          {booking.adultCount} Rider{booking.adultCount !== 1 ? 's' : ''}
                          {booking?.childCount
                            ? booking.childCount > 0
                              ? `, ${booking.childCount} Child${booking.childCount !== 1 ? 'ren' : ''}`
                              : ''
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pickup Details */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                    Pickup Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Hotel</p>
                        <p className="font-semibold text-black">
                          {getEventSelectedPickupLocationName(booking)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Pickup Time</p>
                        <p className="font-semibold text-black">
                          {getEventSelectedPickupTime(booking)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    Pricing Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-black">
                        {booking.adultCount} Rider{booking.adultCount !== 1 ? 's' : ''} × $
                        {booking.pricing.adultPrice}
                      </span>
                      <span className="font-semibold text-black">
                        ${booking.pricing.adultTotal.toFixed(2)}
                      </span>
                    </div>
                    {booking?.childCount
                      ? booking?.childCount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-black">
                              {booking.childCount} Child{booking.childCount !== 1 ? 'ren' : ''} × $
                              {booking.pricing.childrenPrice}
                            </span>
                            <span className="font-semibold text-black">
                              ${booking.pricing?.childTotal?.toFixed(2) || 0}
                            </span>
                          </div>
                        )
                      : null}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-lg font-semibold text-black">Total</span>
                      <span className="text-xl font-bold text-black">
                        ${booking.pricing.totalAmount.toFixed(2)} {booking.pricing.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-6">
                {/* Booking Information */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center flex-row">
                    <Info className="w-5 h-5 text-blue-600 mr-2" />
                    Booking Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-black">Booking Date</p>
                      <p className="font-semibold text-black">
                        {formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black">Last Updated</p>
                      <p className="font-semibold text-black">
                        {formatDateTime(booking.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black">Booking Creator</p>
                      <p className="font-semibold text-black">
                        {typeof booking.bookedBy === 'object' &&
                        booking.bookedBy?.role === 'admin' ? (
                          <span className="text-blue-600">
                            Admin Booking ({booking.bookedBy.name})
                          </span>
                        ) : (
                          <span className="text-black">Self Booking</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Payment Details */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                    Payment Details
                  </h3>
                  {payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="bg-white rounded-lg border p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-black">
                                {payment.currency} {payment.amount}
                              </p>
                              <p className="text-sm text-black font-mono">
                                {payment.paymentReference}
                              </p>
                            </div>
                            <Chip
                              color={PAYMENT_STATUS_COLOR[payment.paymentStatus] || 'info'}
                              text={payment.paymentStatus.toUpperCase()}
                            />
                          </div>
                          <div className="text-sm text-black space-y-1">
                            <p>
                              Paid on {formatDateTime(payment.paymentDate || payment.createdAt)} by{' '}
                              {payment.paymentMethod}
                            </p>
                            {payment.refundStatus && payment.refundStatus !== 'not_refunded' && (
                              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                                <RefreshCcw className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-600">
                                    Refund Information
                                  </p>
                                  {payment.refundedAmount && (
                                    <p className="text-xs text-gray-600 font-mono">
                                      Refunded Amount: {payment.currency} {payment.refundedAmount}
                                    </p>
                                  )}
                                  {payment.refundStatus === 'refunded' && (
                                    <p className="text-xs text-green-600">
                                      Refund processed successfully. Please allow 5-10 business days
                                      for the funds to appear in your account.
                                    </p>
                                  )}
                                  {payment.refundStatus === 'pending' && (
                                    <p className="text-xs text-yellow-600">
                                      Refund is being processed (5-10 business days)
                                    </p>
                                  )}
                                  {payment.refundStatus === 'failed' && (
                                    <p className="text-xs text-red-600">
                                      Refund failed - please contact support
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CreditCard className="w-8 h-8 text-black mx-auto mb-2" />
                      <p className="text-black">No payment information available</p>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="bg-beige rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-mustard mb-4 flex items-center">
                    <HelpCircle className="w-5 h-5 text-mustard mr-2" />
                    Need Help?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Call us</p>
                        <p className="font-semibold text-black">+1 (800) 438 1814</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-black" />
                      <div>
                        <p className="text-sm text-black">Email us</p>
                        <p className="font-semibold text-black">bookings@laviptours.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  {/* Continue Payment Button */}
                  {booking.status === 'pending' && !isEventScheduleInPast(booking) && (
                    <Button
                      variant="mustard"
                      className="font-semibold w-full sm:w-auto"
                      onClick={handleContinuePayment}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Continue Payment
                        </>
                      )}
                    </Button>
                  )}

                  {/* Edit Button */}
                  {booking.status === 'confirmed' && !isEventScheduleInPast(booking) && (
                    <Button
                      variant="mustard"
                      className="font-semibold w-full sm:w-auto"
                      onClick={() => router.push(`/my-account/events/${booking.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Booking
                    </Button>
                  )}

                  {/* Cancel Button */}
                  {booking.status !== 'pending' && !isEventScheduleInPast(booking) && (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 font-semibold w-full sm:w-auto"
                      onClick={() =>
                        handleCancelBooking(
                          booking.id.toString(),
                          booking.bookingReference,
                          payments[0]?.id?.toString(),
                        )
                      }
                      disabled={!!cancelLoading}
                    >
                      {cancelLoading === booking.id.toString() ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-black mt-2 text-center sm:text-right">
                  {(booking.status === 'confirmed' || booking.status === 'pending') &&
                    !isEventScheduleInPast(booking) &&
                    'You can edit your booking details. '}
                  {booking.status !== 'pending' &&
                    !isEventScheduleInPast(booking) &&
                    'Cancellation policy applies. Refunds depend on timing.'}
                  {isEventScheduleInPast(booking) &&
                    'This event has already taken place. No modifications are allowed.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
