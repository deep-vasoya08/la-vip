'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import TourBookingForm from './TourBookingForm'
import PaymentForm from './PaymentForm'
import { TourOption, TourBookingFormData } from './types'
import {
  saveTourBookingData,
  getTourBookingData,
  removeTourBookingData,
  createTourBookingCallbackUrl,
  getTourBookingKeyFromUrl,
  cleanupTourBookingDataAfterPayment,
} from '@/utilities/tourBookingPersistence'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'

interface TourBookingPaymentProps {
  tours: TourOption[]
  className?: string
  selectedTourId?: number
}

interface PaymentStepData {
  bookingData: TourBookingFormData
  totalAmount: number
}

const TourBookingPayment: React.FC<TourBookingPaymentProps> = ({
  tours,
  className,
  selectedTourId,
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { trackTourAddToCart } = useGA4Tracking()
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentData, setPaymentData] = useState<PaymentStepData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [restoredBookingData, setRestoredBookingData] = useState<TourBookingFormData | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showRestoredMessage, setShowRestoredMessage] = useState(false)

  const isAuthenticated = status === 'authenticated' && session?.user

  // Check for booking data restoration on mount
  useEffect(() => {
    const restoreBookingData = async () => {
      if (status === 'loading') return // Wait for session to load
      if (!tours || tours.length === 0) return // Wait for tours to load

      const bookingKey = getTourBookingKeyFromUrl()
      if (bookingKey) {
        setIsRestoring(true)
        const savedData = getTourBookingData(bookingKey)

        if (savedData) {
          console.log('Restoring tour booking data:', savedData)
          console.log('Tours available:', tours?.length)
          setRestoredBookingData(savedData)
          setShowRestoredMessage(true)
          // Clean up the stored data after successful restoration
          removeTourBookingData(bookingKey)

          // Hide the restored message after 5 seconds
          setTimeout(() => setShowRestoredMessage(false), 5000)
        } else {
          console.warn('No tour booking data found for key:', bookingKey)
        }

        setIsRestoring(false)
      }
    }

    restoreBookingData()
  }, [status, tours])

  // Calculate booking amount based on form data - updated for new schema
  const calculateBookingAmount = (data: TourBookingFormData): number => {
    const selectedTour = tours.find((tour) => tour.id === data.tourId)
    if (!selectedTour) return 0

    // With new schema, schedules are generated, find the selected one
    const selectedSchedule = selectedTour.schedules?.find(
      (schedule) => schedule.id === data.scheduleId,
    )
    if (!selectedSchedule) return 0

    // Find pickup by ID (which should match hotel ID in new schema)
    const selectedPickup = selectedSchedule.pickups?.find(
      (pickup) => pickup.id === data.pickupLocationId,
    )
    if (!selectedPickup) return 0

    const adultPrice = selectedPickup.adult_price || 0
    const childrenPrice = selectedPickup.children_price || 0

    return Number(data.adultCount) * adultPrice + Number(data.childCount || 0) * childrenPrice
  }

  // Handle tour booking form submission
  // This function implements the login flow:
  // 1. Check if user is authenticated
  // 2. If not authenticated: save form data to localStorage and redirect to login
  // 3. If authenticated: proceed with booking flow
  const handleTourBookingSubmit = async (data: TourBookingFormData) => {
    setIsLoading(true)

    const tour = tours.find((tour) => tour.id === data.tourId)
    const pricing = { totalAmount: calculateBookingAmount(data), currency: 'USD' }
    trackTourAddToCart(tour as any, data, pricing)

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        // Save booking data to localStorage
        const tourIdStr = selectedTourId?.toString() || data.tourId
        const bookingKey = saveTourBookingData(tourIdStr, data)

        if (bookingKey) {
          // Create callback URL with booking restoration key
          const currentUrl = window.location.href
          const callbackUrl = createTourBookingCallbackUrl(currentUrl, bookingKey)

          console.log('Saving tour booking data and redirecting to login...')
          // Redirect to login page with callback
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          return
        } else {
          console.warn('Failed to save tour booking data, redirecting to login without persistence')
          // Fallback: redirect to login without data persistence
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
          return
        }
      }

      // User is authenticated, proceed with booking
      const totalAmount = calculateBookingAmount(data)

      console.log('data 1111', data)

      // Set payment data for the payment step
      setPaymentData({
        bookingData: data,
        totalAmount,
      })

      // Transition to payment step with animation
      setTimeout(() => {
        setCurrentStep(2)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error in booking submission:', error)
      setIsLoading(false)
    }
  }

  // Handle payment form submission
  const handlePaymentSubmit = async (paymentIntentId: string) => {
    if (!paymentData || !paymentIntentId) return
    setIsLoading(true)
    try {
      console.log('Payment successful with intent ID:', paymentIntentId)

      // Clean up localStorage immediately after successful payment
      cleanupTourBookingDataAfterPayment()
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
        className={`booking-form md:rounded-tl-lg md:rounded-br-lg md:shadow-2xl p-6 pt-4 text-white bg-white ${className}`}
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
      className={`booking-form md:rounded-tl-lg md:rounded-br-lg md:shadow-2xl p-6 pt-4 text-white bg-white ${className}`}
    >
      <h2 className="text-xl text-center font-semplicita font-bold text-mustard">
        BOOK YOUR SEATS!
      </h2>

      {/* Success message for restored booking data */}
      {showRestoredMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
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
                Welcome back! Your tour booking details have been restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show booking form or payment form based on current step */}
      {currentStep === 1 && (
        <TourBookingForm
          tours={tours}
          onSubmit={handleTourBookingSubmit}
          initialValues={
            restoredBookingData ||
            (selectedTourId
              ? {
                  tourId: selectedTourId.toString(),
                }
              : undefined)
          }
          isEditing={false}
        />
      )}
      {currentStep === 2 && paymentData && (
        <>
          <button onClick={handleStepBack} className="text-mustard hover:text-mustard/90 mb-4">
            ← Back to booking details
          </button>
          <PaymentForm
            amount={paymentData.totalAmount}
            onSubmit={handlePaymentSubmit}
            isLoading={isLoading}
            tourData={paymentData.bookingData}
          />
        </>
      )}
    </div>
  )
}

export default TourBookingPayment
