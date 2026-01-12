'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

function PaymentReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookingType, setBookingType] = useState<string | null>(null)

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent')
        const currentBookingId = searchParams.get('booking_id')
        const currentBookingType = searchParams.get('bookingType')

        setBookingId(currentBookingId)
        setBookingType(currentBookingType)

        if (!paymentIntentId) {
          setStatus('error')
          setMessage(
            'No payment information found. Please contact support if you completed a payment.',
          )
          return
        }

        // Check payment status with Stripe
        const response = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to verify payment status')
        }

        const data = await response.json()

        if (data.status === 'succeeded') {
          setStatus('success')
          const bookingTypeText =
            currentBookingType === 'event'
              ? 'event'
              : currentBookingType === 'tour'
                ? 'tour'
                : 'booking'
          setMessage(
            `Payment completed successfully! Your ${bookingTypeText} booking has been confirmed.`,
          )
        } else if (data.status === 'requires_payment_method') {
          setStatus('error')
          setMessage(
            'Payment requires a valid payment method. Please try again with a different payment method.',
          )
        } else if (data.status === 'canceled') {
          setStatus('error')
          setMessage('Payment was canceled. Please try again if you wish to complete your booking.')
        } else {
          setStatus('error')
          setMessage(`Payment status: ${data.status}. Please try again or contact support.`)
        }
      } catch (error) {
        console.error('Payment return error:', error)
        setStatus('error')
        setMessage(
          error instanceof Error
            ? `Error: ${error.message}`
            : 'An error occurred while processing your payment. Please contact support.',
        )
      }
    }

    handlePaymentReturn()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="mb-6">
              <svg
                className="h-16 w-16 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h1>
              <p className="text-green-600">{message}</p>
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                {searchParams.get('bookingType') && (
                  <p>Booking Type: {searchParams.get('bookingType')?.toUpperCase()}</p>
                )}
                {/* {searchParams.get('booking_id') && (
                  <p>Booking ID: {searchParams.get('booking_id')}</p>
                )}
                <p>Payment Intent: {searchParams.get('payment_intent')?.slice(-8)}</p> */}
              </div>
            </div>
            <div className="space-y-3">
              <Link href="/my-account" className="block">
                <Button variant="outline" className="w-full">
                  View All Bookings
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <svg
                className="h-16 w-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-red-800 mb-2">Payment Issue</h1>
              <p className="text-red-600">{message}</p>
            </div>
            <div className="space-y-3">
              <Button
                variant="mustard"
                className="w-full"
                onClick={() => {
                  if (bookingId && bookingType) {
                    router.push(
                      `/my-account/${bookingType === 'event' ? 'events' : 'tours'}/${bookingId}`,
                    )
                  } else {
                    router.push('/my-account')
                  }
                }}
              >
                Try Again
              </Button>
              <Link href="/my-account" className="block">
                <Button variant="outline" className="w-full">
                  View My Bookings
                </Button>
              </Link>
              <Link href="/contact" className="block">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment status...</p>
          </div>
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  )
}
