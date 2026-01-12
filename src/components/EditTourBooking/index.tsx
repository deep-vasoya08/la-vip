'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { CheckCircle, XCircle, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { TourBookingFormData, TourOption } from '../TourBookingPayment/types'
import { EditBookingData, PriceCalculationResult } from '@/utilities/tourBookingEditUtils'
import { Tour, TourBooking } from '@/payload-types'
import {
  formatTourDataForBookingForm,
  getTourSelectedPickupLocationName,
  getTourSelectedScheduleTime,
} from '@/utilities/tourBookingUtils'
import TourBookingForm from '../TourBookingPayment/TourBookingForm'
import RequiredPhoneNumber from '@/components/RequiredPhoneNumber'

// Types
type EditBookingFormData = TourBookingFormData

interface EditTourBookingProps {
  booking: TourBooking
  availableTours: Tour[]
  onSuccess: () => void
  onCancel: () => void
}

// Stripe configuration
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Stripe-dependent payment form for upcharges
const UpchargePaymentForm: React.FC<{
  bookingId: string
  priceDifference: PriceCalculationResult
  editData: EditBookingFormData
  onPaymentSuccess: () => void
  onCancel: () => void
}> = ({ bookingId, priceDifference, onPaymentSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripe = useStripe()
  const elements = useElements()

  const handleUpchargePayment = async () => {
    if (!stripe || !elements) {
      setError('Stripe is not ready')
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/return?payment_intent={PAYMENT_INTENT_ID}&booking_id=${bookingId}&bookingType=tour`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setError(error.message || 'Payment failed')
      } else {
        await pollForBookingUpdate()
      }
    } catch (error) {
      setError('Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const pollForBookingUpdate = async () => {
    const maxAttempts = 30
    let attempts = 0

    const pollInterval = setInterval(async () => {
      attempts++
      try {
        const response = await fetch(
          `/api/bookings/tours/${bookingId}?paymentStatus=failed,completed`,
        )
        if (response.ok || attempts >= maxAttempts) {
          clearInterval(pollInterval)
          onPaymentSuccess()
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          onPaymentSuccess()
        }
      }
    }, 1000)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Back to Edit
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6 text-black">Review Changes</h3>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <span className="text-black">Original Amount:</span>
          <span className="font-semibold text-black">
            ${priceDifference.originalAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <span className="text-black">New Amount:</span>
          <span className="font-semibold text-black">${priceDifference.newAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-4 rounded-lg bg-red-50">
          <span className="text-black">Additional Payment Required:</span>
          <span className="font-bold text-red-600">
            ${Math.abs(priceDifference.difference).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="">
        <div className="flex-1">
          <div className="mb-4 p-4 border rounded-lg">
            <h4 className="font-semibold mb-3 text-black">Payment Information</h4>
            <PaymentElement />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-end space-y-4 md:space-y-0 md:space-x-4 mt-6">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="mustard"
              onClick={handleUpchargePayment}
              disabled={isProcessing}
              className="min-w-[200px] w-full md:w-auto"
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay Additional $${Math.abs(priceDifference.difference).toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Non-Stripe form for refunds and no payment changes
const EditPaymentForm: React.FC<{
  bookingId: string
  priceDifference: PriceCalculationResult
  editData: EditBookingFormData
  onPaymentSuccess: () => void
  onCancel: () => void
}> = ({ bookingId, priceDifference, editData, onPaymentSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDowngradeRefund = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/bookings/tours/edit/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, editData }),
      })

      const data = await response.json()
      if (response.ok) {
        onPaymentSuccess()
      } else {
        throw new Error(data.error || 'Refund processing failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Refund processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNoPaymentChange = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/bookings/tours/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, editData }),
      })

      const data = await response.json()
      if (response.ok) {
        onPaymentSuccess()
      } else {
        throw new Error(data.error || 'Booking update failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Booking update failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Back to Edit
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-6 text-black">Review Changes</h3>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <span className="text-black">Original Amount:</span>
          <span className="font-semibold text-black">
            ${priceDifference.originalAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <span className="text-black">New Amount:</span>
          <span className="font-semibold text-black">${priceDifference.newAmount.toFixed(2)}</span>
        </div>
        <div
          className={`flex justify-between items-center p-4 rounded-lg ${
            priceDifference.type === 'downgrade' ? 'bg-green-50' : 'bg-blue-50'
          }`}
        >
          <span className="text-black">
            {priceDifference.type === 'downgrade' ? 'Refund Amount:' : 'No Payment Change'}
          </span>
          <span
            className={`font-bold ${
              priceDifference.type === 'downgrade' ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {priceDifference.type === 'no_change'
              ? 'No Change'
              : `$${Math.abs(priceDifference.difference).toFixed(2)}`}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {priceDifference.type === 'downgrade' && (
          <div className="flex-1">
            <div className="flex flex-col md:flex-row items-center justify-end space-y-4 md:space-y-0 md:space-x-4 mt-4">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDowngradeRefund}
                disabled={isProcessing}
                variant="mustard"
                className="w-full md:w-auto min-w-[200px]"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Processing Refund...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Process Refund
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {priceDifference.type === 'no_change' && (
          <Button
            onClick={handleNoPaymentChange}
            disabled={isProcessing}
            className="w-full md:w-auto min-w-[200px]"
            variant="mustard"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Booking
              </div>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// Payment Form Wrapper
const PaymentFormWrapper: React.FC<{
  bookingId: string
  priceDifference: PriceCalculationResult
  editData: EditBookingFormData
  onPaymentSuccess: () => void
  onCancel: () => void
}> = ({ bookingId, priceDifference, editData, onPaymentSuccess, onCancel }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (priceDifference.type === 'upcharge') {
      setIsLoading(true)
      const createPaymentIntent = async () => {
        try {
          const response = await fetch('/api/bookings/tours/edit/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              upchargeAmount: priceDifference.difference,
              editData,
            }),
          })

          const data = await response.json()
          if (response.ok) {
            setClientSecret(data.clientSecret)
          } else {
            throw new Error(data.error || 'Failed to create payment intent')
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Payment setup failed')
        } finally {
          setIsLoading(false)
        }
      }

      createPaymentIntent()
    } else {
      setIsLoading(false)
    }
  }, [bookingId, priceDifference, editData])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Back to Edit
        </Button>
      </div>
    )
  }

  if (priceDifference.type === 'upcharge' && (isLoading || !clientSecret)) {
    return (
      <div className="flex items-center justify-center p-8 text-black">
        <RefreshCcw className="w-6 h-6 animate-spin mr-2" />
        <span>Setting up payment...</span>
      </div>
    )
  }

  if (priceDifference.type === 'upcharge' && clientSecret) {
    const elementsOptions = {
      clientSecret,
      appearance: { theme: 'stripe' as const },
    }

    return (
      <Elements stripe={stripePromise} options={elementsOptions}>
        <UpchargePaymentForm
          bookingId={bookingId}
          priceDifference={priceDifference}
          editData={editData}
          onPaymentSuccess={onPaymentSuccess}
          onCancel={onCancel}
        />
      </Elements>
    )
  }

  return (
    <EditPaymentForm
      bookingId={bookingId}
      priceDifference={priceDifference}
      editData={editData}
      onPaymentSuccess={onPaymentSuccess}
      onCancel={onCancel}
    />
  )
}

// Edit Tour Booking Form
const EditTourBookingForm: React.FC<{
  booking: TourBooking
  availableTours: Tour[]
  onSubmit: (data: EditBookingFormData) => void
  onCancel: () => void
}> = ({ booking, availableTours, onSubmit, onCancel }) => {
  const tourOptions = formatTourDataForBookingForm(availableTours)
  const [showPhoneRequired, setShowPhoneRequired] = useState(true)

  // Generate scheduleId from scheduledDate for form compatibility
  const generateScheduleIdFromDate = (dateTime: string | Date): string => {
    try {
      const date = new Date(dateTime)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    } catch (error) {
      console.error('Error generating schedule ID from date:', error)
      return 'unknown-date'
    }
  }

  const initialFormData: EditBookingFormData = {
    tourId: typeof booking.tour === 'object' ? booking.tour.id.toString() : booking.tour.toString(),
    scheduleId: booking.scheduledDate ? generateScheduleIdFromDate(booking.scheduledDate) : '',
    adultCount: booking.adultCount,
    childCount: booking.childCount || 0,
    pickupLocationId:
      booking.pickupDetails?.locationId ||
      (booking.pickupDetails?.hotelId ? booking.pickupDetails.hotelId.toString() : ''),
    tourDateTime:
      booking.pickupDetails &&
      typeof booking.pickupDetails === 'object' &&
      'tourDateTime' in booking.pickupDetails
        ? (booking.pickupDetails as any).tourDateTime
        : booking.scheduledDate || '',
  }

  console.log('Edit Tour Booking - Initial form data:', initialFormData)
  console.log('Edit Tour Booking - Booking data:', booking)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Booking Details */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Current Booking</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-black">Tour:</span>
              <p className="font-medium text-black">
                {typeof booking.tour === 'object' ? booking.tour.name : 'Loading...'}
              </p>
            </div>
            <div>
              <span className="text-black">Date & Time:</span>
              <p className="font-medium text-black">
                {formatDateTime(getTourSelectedScheduleTime(booking, false), false, false, false) ||
                  'TBD'}
              </p>
            </div>
            <div>
              <span className="text-black">Pickup:</span>
              <p className="font-medium text-black">
                {getTourSelectedPickupLocationName(booking) || 'TBD'}
              </p>
            </div>
            <div>
              <span className="text-black">Guests:</span>
              <p className="font-medium text-black">
                {booking.adultCount} Adult{booking.adultCount !== 1 ? 's' : ''}
                {booking.childCount
                  ? booking.childCount > 0
                    ? `, ${booking.childCount} Child${booking.childCount !== 1 ? 'ren' : ''}`
                    : ''
                  : ''}
              </p>
            </div>
            <div>
              <span className="text-black">Current Total:</span>
              <p className="font-bold text-lg text-black">
                ${booking.pricing.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black mb-4">Edit Booking Details</h3>
          <TourBookingForm
            tours={tourOptions}
            onSubmit={onSubmit}
            className="space-y-4"
            initialValues={initialFormData}
            isEditing={true}
          />

          {/* Required Phone Number Component */}
          {showPhoneRequired && (
            <RequiredPhoneNumber
              className="mt-4"
              onPhoneNumberSaved={() => setShowPhoneRequired(false)}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Main EditEventBooking Component
const EditEventBooking: React.FC<EditTourBookingProps> = ({
  booking,
  availableTours,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<'edit' | 'review' | 'success'>('edit')
  const [editData, setEditData] = useState<EditBookingFormData | null>(null)
  const [priceDifference, setPriceDifference] = useState<PriceCalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEditFormSubmit = async (formData: EditBookingFormData) => {
    try {
      const response = await fetch('/api/bookings/tours/edit/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          editData: formData,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        setEditData(formData)
        setPriceDifference(data.priceDifference)
        setCurrentStep('review')
      } else {
        throw new Error(data.error || 'Price calculation failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Price calculation failed')
    }
  }

  const handlePaymentSuccess = () => {
    setCurrentStep('success')
  }

  const handleBackToEdit = () => {
    setCurrentStep('edit')
    setEditData(null)
    setPriceDifference(null)
    setError(null)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="outline" onClick={() => setError(null)}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-4">Booking Updated Successfully!</h2>
          <p className="text-black mb-6">
            Your event booking has been updated. You&apos;ll receive a confirmation email shortly.
          </p>
          <Button variant="mustard" onClick={onSuccess}>
            View Updated Booking
          </Button>
        </motion.div>
      )}

      {currentStep === 'review' && editData && priceDifference && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <PaymentFormWrapper
            bookingId={booking.id.toString()}
            priceDifference={priceDifference}
            editData={editData}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handleBackToEdit}
          />
        </motion.div>
      )}

      {currentStep === 'edit' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <EditTourBookingForm
            booking={booking}
            availableTours={availableTours}
            onSubmit={handleEditFormSubmit}
            onCancel={onCancel}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EditEventBooking
