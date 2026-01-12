'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EventBooking } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { StripeElementsProvider } from '@/components/StripeElements'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ArrowLeft } from 'lucide-react'

interface PaymentComponentProps {
  booking: EventBooking
  onBack?: () => void
  showBackButton?: boolean
}

// Payment Form Component
function PaymentForm({
  booking,
  clientSecret: _clientSecret,
  paymentId: _paymentId,
  onBack,
}: {
  booking: EventBooking
  clientSecret: string
  paymentId: string
  onBack?: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Process payment using the same pattern as PaymentForm.tsx
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/return?payment_intent={PAYMENT_INTENT_ID}&booking_id=${booking.id}&bookingType=event`,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        // Show error to customer
        setPaymentError(result.error.message || 'An error occurred during payment')
        setIsProcessing(false)
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setPaymentSuccess(true)

        // TODO: Add GA4 tracking here like in PaymentForm.tsx
        // TODO: Add ShopperApproved script loading here

        console.log('✅ Payment successful:', result.paymentIntent.id)
        setIsProcessing(false)
      }
    } catch (_err) {
      setPaymentError('An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-mustard text-white p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Payment Successful!</h1>
                <p className="text-sm md:text-base text-blue-100">
                  Your booking has been confirmed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="p-8 text-center">
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
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-2">Booking Confirmed</h2>
            <p className="text-black">
              Your payment has been processed successfully and your event booking is now confirmed.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              Booking Reference: <span className="font-mono">{booking.bookingReference}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/my-account" className="inline-block w-full sm:w-auto">
              <Button variant="mustard" className="font-roboto w-full sm:w-auto">
                View My Bookings
              </Button>
            </Link>
            <div>
              <Link href={`/my-account/events/${booking.id}`} className="inline-block">
                <Button variant="outline" className="font-roboto">
                  View Booking Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-mustard text-white p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            {onBack && (
              <Button
                variant="outline"
                size="small"
                onClick={onBack}
                className="text-white bg-white/10 w-fit"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Complete Your Payment</h1>
              <p className="text-sm md:text-base text-blue-100">
                Secure payment for your event booking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Total Amount Display */}
        <div className="mb-6 p-3 bg-bridge rounded-md text-center border border-gray">
          <p className="text-sm font-semibold text-mustard">Total Amount</p>
          <p className="text-xl font-bold text-mustard">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(booking.pricing?.totalAmount || 0)}
          </p>
        </div>

        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{paymentError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <PaymentElement />
          </div>
          <div className="mt-4">
            <Button
              type="submit"
              className="py-2 w-full"
              disabled={isProcessing || !stripe}
              variant="mustard"
            >
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PaymentComponent({
  booking,
  onBack,
  showBackButton = true,
}: PaymentComponentProps) {
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string
    paymentId: string
  } | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(true) // Start with loading
  const [error, setError] = useState<string | null>(null)

  // Auto-create payment intent on component mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      setIsCreatingIntent(true)
      setError(null)

      try {
        console.log('🚀 Creating payment intent for booking:', booking.id)

        const response = await fetch('/api/payments/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: booking.pricing?.totalAmount || 0,
          }),
        })

        const data = await response.json()
        console.log('💳 Payment intent response:', data)

        if (response.ok) {
          if (data.clientSecret) {
            setPaymentData({
              clientSecret: data.clientSecret,
              paymentId: data.paymentIntentId || data.paymentId,
            })

            // Store payment intent ID for future reference (like in PaymentForm.tsx)
            if (data.paymentIntentId) {
              localStorage.setItem(`payment_intent_${booking.id}`, data.paymentIntentId)
            }

            console.log('✅ Payment intent created successfully')
          } else {
            throw new Error('No client secret in response')
          }
        } else {
          console.error('❌ Payment intent creation failed:', data.error)
          setError(data.error || 'Payment initialization failed')
        }
      } catch (err) {
        console.error('❌ Error creating payment intent:', err)
        setError('Failed to initiate payment. Please try again.')
      } finally {
        setIsCreatingIntent(false)
      }
    }

    // Only create payment intent if we don't already have one
    if (!paymentData && booking?.id) {
      createPaymentIntent()
    }
  }, [booking?.id, booking.pricing?.totalAmount, paymentData])

  // Loading state while creating payment intent
  if (isCreatingIntent) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-mustard text-white p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              {onBack && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={onBack}
                  className="text-white bg-white/10 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Setting Up Payment</h1>
                <p className="text-sm md:text-base text-blue-100">
                  Please wait while we prepare your secure payment form
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-mustard text-white p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              {onBack && showBackButton && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={onBack}
                  className="text-white bg-white/10 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Payment Setup Failed</h1>
                <p className="text-sm md:text-base text-blue-100">
                  There was an issue preparing your payment
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <div className="text-center">
            <Button
              onClick={() => {
                setError(null)
                setIsCreatingIntent(true)
                // Re-trigger the useEffect by clearing payment data
                setPaymentData(null)
              }}
              variant="mustard"
              className="font-roboto"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Payment form (once payment intent is created)
  if (paymentData) {
    return (
      <StripeElementsProvider clientSecret={paymentData.clientSecret}>
        <PaymentForm
          booking={booking}
          clientSecret={paymentData.clientSecret}
          paymentId={paymentData.paymentId}
          onBack={showBackButton ? onBack : undefined}
        />
      </StripeElementsProvider>
    )
  }

  // Fallback state (shouldn't normally reach here)
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-mustard text-white p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Loading Payment</h1>
              <p className="text-sm md:text-base text-blue-100">Initializing payment system</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-8">
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-black">Preparing your payment form...</p>
        </div>
      </div>
    </div>
  )
}
