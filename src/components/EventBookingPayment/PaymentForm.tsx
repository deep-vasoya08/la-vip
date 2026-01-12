'use client'

import React, { useState, useEffect } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookingFormData } from './types'
import { StripeElementsProvider } from '../StripeElements'
import { useSession } from 'next-auth/react'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'
import { useMetaPixelTracking } from '@/hooks/useMetaPixelTracking'
import { EventBooking } from '@/payload-types'

interface PaymentFormProps {
  onSubmit: (paymentId: string) => Promise<void>
  amount: number
  currency?: string
  isLoading?: boolean
  eventData: BookingFormData
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  amount,
  currency = 'USD',
  isLoading: initialLoading = false,
  eventData,
}) => {
  const { data: session } = useSession()
  const { trackEventBeginCheckout, trackEventAddPaymentInfo, trackEventPurchase } = useGA4Tracking()
  const {
    trackEventInitiateCheckout: trackMetaEventInitiateCheckout,
    trackEventAddPaymentInfo: trackMetaEventAddPaymentInfo,
    trackEventPurchase: trackMetaEventPurchase,
  } = useMetaPixelTracking()
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookingDetails, setBookingDetails] = useState<EventBooking | null>(null)
  const [bookingCreationInProgress, setBookingCreationInProgress] = useState(false)

  // Function to load ShopperApproved script
  const loadShopperApprovedScript = (orderId: string, email: string) => {
    const sa_values = {
      site: 41381,
      token: '31dTm80f',
      orderid: orderId,
      email: email,
    }

    // Make sa_values available globally for the ShopperApproved script
    ;(window as any).sa_values = sa_values

    function saLoadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }

        const js = document.createElement('script')
        js.src = src
        js.type = 'text/javascript'
        js.async = true

        js.onload = () => resolve()
        js.onerror = () => reject(new Error(`Failed to load script: ${src}`))

        document.getElementsByTagName('head')[0]?.appendChild(js)
      })
    }

    // Load the ShopperApproved script
    saLoadScript('https://www.shopperapproved.com/thankyou/rate/41381.js')
      .then(() => {
        console.log('ShopperApproved script loaded successfully')
      })
      .catch((error) => {
        console.error('Error loading ShopperApproved script:', error)
      })
  }

  // Initialize payment process when component mounts
  useEffect(() => {
    // Only run once when the component mounts and if not already in progress
    if (!bookingCreationInProgress && !bookingId && !clientSecret && eventData) {
      const initializePaymentProcess = async () => {
        setBookingCreationInProgress(true)
        setIsLoading(true)
        try {
          setPaymentError(null) // Clear any previous errors

          // Step 1: Create the booking first
          // console.log('Creating booking with event data:', eventData)
          const bookingResponse = await fetch('/api/bookings/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          })

          if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json()
            throw new Error(errorData.error || 'Failed to create booking')
          }

          const bookingResult = await bookingResponse.json()
          console.log('Booking created successfully:', bookingResult)
          const newBookingId = bookingResult.booking.id
          setBookingId(newBookingId)
          setBookingDetails(bookingResult.booking)

          // Track GA4 and Meta Pixel begin_checkout / InitiateCheckout events
          try {
            const eventForTracking = {
              id: eventData.eventId,
              name: 'Event Booking',
              venue: { name: 'Event Venue' },
              schedules: [{ pickups: [{ adult_price: amount }] }],
            }
            const bookingForTracking = {
              adultCount: eventData.adultCount || 1,
              childCount: eventData.childCount || 0,
              bookingReference: bookingResult.booking.bookingReference,
              scheduleId: eventData.scheduleId,
              pickupDetails: { hotelId: eventData.pickupLocationId },
            }
            const pricingForTracking = {
              totalAmount: amount,
              currency: currency || 'USD',
            }

            // Track GA4
            trackEventBeginCheckout(
              eventForTracking as any,
              bookingForTracking as any,
              pricingForTracking,
            )

            // Track Meta Pixel
            trackMetaEventInitiateCheckout(
              eventForTracking as any,
              bookingForTracking as any,
              pricingForTracking,
            )
          } catch (trackingError) {
            // Silently handle tracking errors in production
          }

          // console.log('Fetching payment intent for booking:', newBookingId)
          /**
           * The response from the payment initialization API route.
           *
           * The response should contain the client secret for the payment intent.
           * If the response is not successful, the error message should be thrown.
           */
          const paymentResponse = await fetch('/api/payments/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: newBookingId,
              amount: amount,
            }),
          })

          if (!paymentResponse.ok) {
            const paymentErrorData = await paymentResponse.json()
            throw new Error(paymentErrorData.error || 'Payment initialization failed')
          }

          const paymentData = await paymentResponse.json()
          // console.log('Payment intent created/retrieved successfully')

          if (paymentData.clientSecret) {
            setClientSecret(paymentData.clientSecret)
            // Store the payment intent ID for future reference
            if (paymentData.paymentIntentId) {
              localStorage.setItem(`payment_intent_${newBookingId}`, paymentData.paymentIntentId)
            }

            // Track GA4 and Meta Pixel add_payment_info / AddPaymentInfo events
            try {
              const eventForTracking = {
                id: eventData.eventId,
                name: 'Event Booking',
                venue: { name: 'Event Venue' },
                schedules: [{ pickups: [{ adult_price: amount }] }],
              }
              const bookingForTracking = {
                adultCount: eventData.adultCount || 1,
                childCount: eventData.childCount || 0,
                bookingReference: bookingResult.booking.bookingReference,
                scheduleId: eventData.scheduleId,
                pickupDetails: { hotelId: eventData.pickupLocationId },
              }
              const pricingForTracking = {
                totalAmount: amount,
                currency: currency || 'USD',
              }

              // Track GA4
              trackEventAddPaymentInfo(
                eventForTracking as any,
                bookingForTracking as any,
                pricingForTracking,
                'card',
              )

              // Track Meta Pixel
              trackMetaEventAddPaymentInfo(
                eventForTracking as any,
                bookingForTracking as any,
                pricingForTracking,
              )
            } catch (trackingError) {
              // Silently handle tracking errors in production
            }
          } else {
            throw new Error('No client secret in response')
          }
        } catch (error) {
          console.error('Payment process initialization error:', error)
          setPaymentError(
            `Setup failed: ${error instanceof Error ? error.message : 'Please try again or contact support.'}`,
          )
        } finally {
          setIsLoading(false)
          setBookingCreationInProgress(false)
        }
      }

      initializePaymentProcess()
    }
  }, [eventData, amount, bookingId, clientSecret, bookingCreationInProgress])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  // CheckoutForm component that contains the Stripe Elements
  const CheckoutForm = () => {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!stripe || !elements) {
        // Stripe.js has not yet loaded.
        // Make sure to disable form submission until Stripe.js has loaded.
        return
      }

      setIsProcessing(true)
      setPaymentError(null)

      // Process payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/return?payment_intent={PAYMENT_INTENT_ID}&booking_id=${bookingId}&bookingType=event`,
        },
        redirect: 'if_required',
      })

      if (result.error) {
        // Show error to your customer
        setPaymentError(result.error.message || 'An error occurred during payment')
        setIsProcessing(false)
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        setPaymentSuccess(true)

        // Track GA4 and Meta Pixel purchase events
        if (bookingDetails) {
          try {
            // Track GA4
            trackEventPurchase(
              result.paymentIntent.id,
              bookingDetails.event as any,
              bookingDetails,
              bookingDetails.pricing,
            )

            // Track Meta Pixel
            trackMetaEventPurchase(
              bookingId || result.paymentIntent.id,
              bookingDetails.event as any,
              bookingDetails,
              bookingDetails.pricing,
            )
          } catch (trackingError) {
            // Silently handle tracking errors
          }
        }

        // Load ShopperApproved script with booking ID and user email
        if (bookingId && session?.user?.email) {
          loadShopperApprovedScript(bookingId, session.user.email)
        }

        // Call the onSubmit handler with the payment intent ID
        if (bookingId) {
          await onSubmit(result.paymentIntent.id)
        }
        setIsProcessing(false)
      }
    }

    if (paymentSuccess) {
      return (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg mb-6 text-center w-full flex flex-col items-center justify-center">
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
          <h3 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-600 mb-4">
            Your booking has been confirmed and payment has been processed successfully.
          </p>
          <div className="mt-8">
            <Link href="/my-account" className="inline-block">
              <Button variant="mustard" className="font-roboto">
                View My Bookings
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4">
          <PaymentElement />
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            className="py-2 w-full"
            disabled={isProcessing || !stripe || !elements}
            variant="mustard"
          >
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-mustard">Payment Details</h2>

      <div className="mb-6 p-3 bg-bridge rounded-md text-center border border-gray">
        <p className="text-sm font-semibold text-mustard">Total Amount</p>
        <p className="text-xl font-bold text-mustard">{formatCurrency(amount)}</p>
      </div>

      {paymentError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard"></div>
        </div>
      ) : clientSecret ? (
        <StripeElementsProvider clientSecret={clientSecret}>
          <CheckoutForm />
        </StripeElementsProvider>
      ) : (
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-gray-600">Initializing payment system...</p>
        </div>
      )}
    </div>
  )
}

export default PaymentForm
