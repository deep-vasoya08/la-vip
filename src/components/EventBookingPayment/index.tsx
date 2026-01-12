'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Event } from '@/payload-types'
import EventBookingForm, { BookingFormData, EventOption } from './EventBookingForm'
import { PickupLocation, ScheduleOption } from './types'
import PaymentForm from './PaymentForm'
import {
  saveBookingData,
  getBookingData,
  removeBookingData,
  createBookingCallbackUrl,
  getBookingKeyFromUrl,
  cleanupBookingDataAfterPayment,
} from '@/utilities/bookingPersistence'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'

export interface PaymentStepData {
  bookingData: BookingFormData
  totalAmount: number
  eventBookingId?: string
}

interface EventBookingPaymentProps {
  events?: EventOption[]
  className?: string
  selectedEventId?: number
}

const EventBookingPayment: React.FC<EventBookingPaymentProps> = ({
  events = [],
  className = '',
  selectedEventId,
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { trackEventAddToCart } = useGA4Tracking()
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentData, setPaymentData] = useState<PaymentStepData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [restoredBookingData, setRestoredBookingData] = useState<BookingFormData | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showRestoredMessage, setShowRestoredMessage] = useState(false)

  const isAuthenticated = status === 'authenticated' && session?.user

  // Check for booking data restoration on mount
  useEffect(() => {
    const restoreBookingData = async () => {
      if (status === 'loading') return // Wait for session to load
      if (!events || events.length === 0) return // Wait for events to load

      const bookingKey = getBookingKeyFromUrl()
      if (bookingKey) {
        setIsRestoring(true)
        const savedData = getBookingData(bookingKey)

        if (savedData) {
          console.log('Restoring booking data:', savedData)
          console.log('Events available:', events?.length)
          setRestoredBookingData(savedData)
          setShowRestoredMessage(true)
          // Clean up the stored data after successful restoration
          removeBookingData(bookingKey)

          // Hide the restored message after 5 seconds
          setTimeout(() => setShowRestoredMessage(false), 5000)
        } else {
          console.warn('No booking data found for key:', bookingKey)
        }

        setIsRestoring(false)
      }
    }

    restoreBookingData()
  }, [status, events])

  // Animation variants for step transitions
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  // Calculate booking amount based on form data
  const calculateBookingAmount = (data: BookingFormData): number => {
    const selectedEvent = events.find((event) => event.id === data.eventId)
    if (!selectedEvent) return 0

    const selectedSchedule = selectedEvent.schedules.find(
      (schedule: ScheduleOption) => schedule.id === data.scheduleId,
    )
    if (!selectedSchedule) return 0

    const selectedPickup = selectedSchedule.pickupLocations.find(
      (loc: PickupLocation) => loc.id === data.pickupLocationId,
    )
    if (!selectedPickup) return 0

    const adultPrice = selectedPickup.adultPrice || 0
    const childrenPrice = selectedPickup.childrenPrice || 0

    return data.adultCount * adultPrice + data.childCount * childrenPrice
  }

  // Handle event booking form submission
  // This function implements the login flow:
  // 1. Check if user is authenticated
  // 2. If not authenticated: save form data to localStorage and redirect to login
  // 3. If authenticated: proceed with booking flow
  const handleEventBookingSubmit = async (data: BookingFormData) => {
    setIsLoading(true)

    const event = events.find((e) => e.id === data.eventId)
    const pricing = { totalAmount: calculateBookingAmount(data), currency: 'USD' }

    if (event) {
      trackEventAddToCart(event as unknown as Event, data, pricing)
    }

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Save booking data to localStorage
        const eventIdStr = selectedEventId?.toString() || data.eventId
        const bookingKey = saveBookingData(eventIdStr, data)

        if (bookingKey) {
          // Create callback URL with booking restoration key
          const currentUrl = window.location.href
          const callbackUrl = createBookingCallbackUrl(currentUrl, bookingKey)

          console.log('Saving booking data and redirecting to login...')
          // Redirect to login page with callback
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          return
        } else {
          console.warn('Failed to save booking data, redirecting to login without persistence')
          // Fallback: redirect to login without data persistence
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
          return
        }
      }

      // User is authenticated, proceed with booking
      const totalAmount = calculateBookingAmount(data)

      // Set payment data for the payment step
      // Booking will be created in the PaymentForm component
      setPaymentData({
        bookingData: data,
        totalAmount,
        // No booking ID yet - it will be created during payment
      })

      // Transition to payment step with animation
      setTimeout(() => {
        setCurrentStep(2)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error in booking submission:', error)
      setIsLoading(false)
      // You could add error handling UI here
    }
  }

  // Handle payment form submission
  const handlePaymentSubmit = async (paymentIntentId: string) => {
    if (!paymentData || !paymentIntentId) return
    setIsLoading(true)
    try {
      console.log('Payment successful with intent ID:', paymentIntentId)

      // Clean up localStorage immediately after successful payment
      cleanupBookingDataAfterPayment()
    } catch (error) {
      console.error('Error processing payment confirmation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step back handler
  const handleStepBack = () => {
    setCurrentStep(1)
  }

  // Show loading state while restoring data
  if (isRestoring) {
    return (
      <div
        className={`booking-form md:rounded-tl-lg md:rounded-br-lg md:shadow-md dark:md:shadow-gray p-6 text-white bg-white ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mustard"></div>
          <span className="ml-3 text-gray-600">Restoring your booking details...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`booking-form md:rounded-tl-lg md:rounded-br-lg md:shadow-md dark:md:shadow-gray p-6 pt-4 text-white bg-white ${className}`}
    >
      <h2 className="text-xl text-center font-semplicita font-bold text-mustard mb-1">
        BOOK YOUR SEATS!
      </h2>

      {/* Success message for restored booking data */}
      {showRestoredMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-50 border-l-4 border-green-400 p-3 mb-4"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Welcome back! Your booking details have been restored.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step content with animations */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="booking-form"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
          >
            <EventBookingForm
              key={restoredBookingData ? 'restored' : 'initial'}
              events={events}
              initialValues={
                restoredBookingData ||
                (selectedEventId
                  ? {
                      eventId: selectedEventId.toString(),
                    }
                  : undefined)
              }
              onSubmit={handleEventBookingSubmit}
              className={className}
              isEdit={false}
            />
          </motion.div>
        )}

        {currentStep === 2 && paymentData && (
          <motion.div
            key="payment-form"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <button
                onClick={handleStepBack}
                className="flex items-center text-blue-600 hover:underline text-mustard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to booking details
              </button>
            </div>

            <PaymentForm
              onSubmit={handlePaymentSubmit}
              amount={paymentData.totalAmount}
              eventData={paymentData.bookingData}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EventBookingPayment
export { EventBookingForm, PaymentForm }
