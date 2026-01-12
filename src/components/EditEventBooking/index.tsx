'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { EventBooking, Event } from '@/payload-types'
import { CheckCircle, XCircle, RefreshCcw, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import {
  getEventSelectedPickupLocationName,
  getEventSelectedScheduleTime,
} from '@/utilities/eventBookingUtils'
import EventBookingForm, {
  EventOption,
  BookingFormData,
} from '@/components/EventBookingPayment/EventBookingForm'
import { EditBookingData, PriceCalculationResult } from '@/utilities/eventBookingEditUtils'
import RequiredPhoneNumber from '@/components/RequiredPhoneNumber'

// Types
type EditBookingFormData = BookingFormData & EditBookingData

interface EditEventBookingProps {
  booking: EventBooking
  availableEvents: Event[]
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
}> = ({ bookingId, priceDifference, editData, onPaymentSuccess, onCancel }) => {
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
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/return?payment_intent={PAYMENT_INTENT_ID}&booking_id=${bookingId}&bookingType=event`,
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
          `/api/bookings/events/${bookingId}?paymentStatus=failed,completed`,
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
                <div className="flex items-center justify-center">
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pay Additional ${Math.abs(priceDifference.difference).toFixed(2)}
                </div>
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
      const response = await fetch('/api/bookings/events/edit/refund', {
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
      const response = await fetch('/api/bookings/events/edit', {
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

      <div className="flex flex-col sm:flex-row gap-4">
        {priceDifference.type === 'downgrade' && (
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end mt-4 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDowngradeRefund}
                disabled={isProcessing}
                variant="mustard"
                className="w-full sm:w-auto min-w-[200px]"
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
            className="w-full sm:flex-1"
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
          const response = await fetch('/api/bookings/events/edit/payment', {
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

// Helper function to transform Event[] to EventOption[]
const transformEventsToOptions = (events: Event[]): EventOption[] => {
  return events.map((event) => ({
    id: event.id.toString(),
    name: event.name || 'Unnamed Event',
    schedules:
      event.schedules?.map((schedule) => ({
        id: schedule.id || '',
        date: formatDateTime(schedule.event_date_time),
        status: schedule.schedule_status || 'active',
        pickupLocations:
          schedule.pickups?.map((pickup) => ({
            id: pickup.id || '',
            name:
              pickup?.hotel && typeof pickup.hotel === 'object' && 'name' in pickup.hotel
                ? pickup.hotel.name.toString()
                : '',
            location:
              pickup?.hotel && typeof pickup.hotel === 'object' && 'location' in pickup.hotel
                ? pickup.hotel.location.toString()
                : '',
            adultPrice: pickup.adult_price,
            childrenPrice: pickup.children_price || 0,
            pickupTimes:
              pickup.pickup_times?.map((pt) => ({
                id: pt.id || '',
                time: formatDateTime(pt.time, true, true),
              })) || [],
          })) || [],
      })) || [],
  }))
}

// Edit Event Booking Form
const EditEventBookingForm: React.FC<{
  booking: EventBooking
  availableEvents: Event[]
  onSubmit: (data: EditBookingFormData) => void
  onCancel: () => void
}> = ({ booking, availableEvents, onSubmit, onCancel }) => {
  const eventOptions = transformEventsToOptions(availableEvents)
  const [showPhoneRequired, setShowPhoneRequired] = useState(true)

  const initialFormData: EditBookingFormData = {
    eventId:
      typeof booking.event === 'object' ? booking.event.id.toString() : booking.event.toString(),
    scheduleId: booking.scheduleId,
    adultCount: booking.adultCount,
    childCount: booking.childCount || 0,
    pickupLocationId: booking.pickupDetails.locationId,
    pickupTimeId: booking.pickupDetails.selectedTimeId || '',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Booking Details */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Current Booking</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-black">Event:</span>
              <p className="font-medium text-black">
                {typeof booking.event === 'object' ? booking.event.name : 'Loading...'}
              </p>
            </div>
            <div>
              <span className="text-black">Date & Time:</span>
              <p className="font-medium text-black">
                {getEventSelectedScheduleTime(booking) || 'TBD'}
              </p>
            </div>
            <div>
              <span className="text-black">Pickup:</span>
              <p className="font-medium text-black">
                {getEventSelectedPickupLocationName(booking) || 'TBD'}
              </p>
            </div>
            <div>
              <span className="text-black">Guests:</span>
              <p className="font-medium text-black">
                {booking.adultCount} Rider{booking.adultCount !== 1 ? 's' : ''}
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
          <EventBookingForm
            events={eventOptions}
            onSubmit={onSubmit}
            className="space-y-4"
            initialValues={initialFormData}
            isEdit={true}
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
const EditEventBooking: React.FC<EditEventBookingProps> = ({
  booking,
  availableEvents,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<'edit' | 'review' | 'success'>('edit')
  const [editData, setEditData] = useState<EditBookingFormData | null>(null)
  const [priceDifference, setPriceDifference] = useState<PriceCalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEditFormSubmit = async (formData: EditBookingFormData) => {
    try {
      const response = await fetch('/api/bookings/events/edit/calculate-price', {
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
          <EditEventBookingForm
            booking={booking}
            availableEvents={availableEvents}
            onSubmit={handleEditFormSubmit}
            onCancel={onCancel}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EditEventBooking
