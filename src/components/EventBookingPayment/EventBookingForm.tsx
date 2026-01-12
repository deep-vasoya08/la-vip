'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { EventOption, PickupLocation, BookingFormData, PickupTime } from './types'
import RequiredPhoneNumber, { RequiredPhoneNumberHandle } from '@/components/RequiredPhoneNumber'
import SearchableSelect from '@/components/SearchableSelect'

export type { EventOption, PickupLocation, BookingFormData, PickupTime }

// Validation schema using Yup
const BookingSchema = Yup.object().shape({
  eventId: Yup.string().required('Please select an event'),
  scheduleId: Yup.string().required('Please select a date'),
  adultCount: Yup.number()
    .required('Rider count is required')
    .min(1, 'At least 1 rider is required'),
  childCount: Yup.number().min(0, 'Child count must be 0 or more'),
  pickupLocationId: Yup.string().required('Please select hotel pick up location'),
  pickupTimeId: Yup.string().required('Please select a pickup time'),
})

// Props for the BookingForm component
interface BookingFormProps {
  events?: EventOption[]
  onSubmit?: (data: BookingFormData) => void
  className?: string
  initialValues?: Partial<BookingFormData>
  isEdit?: boolean
}

const EventBookingForm: React.FC<BookingFormProps> = ({
  events = [],
  onSubmit,
  className = '',
  initialValues: propInitialValues,
  isEdit = false,
}) => {
  // Router not currently used, but kept for potential future navigation needs
  const _router = useRouter()
  // State for handling phone number requirement
  const [showPhoneRequired, setShowPhoneRequired] = useState(true)
  const phoneNumberRef = useRef<RequiredPhoneNumberHandle>(null)

  // Initial form values - merge defaults with provided initial values
  const initialValues: BookingFormData = {
    eventId: '',
    scheduleId: '',
    adultCount: 0,
    childCount: 0,
    pickupLocationId: '',
    pickupTimeId: '',
    ...propInitialValues,
  }

  // Setup formik
  const formik = useFormik({
    initialValues,
    validationSchema: BookingSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // First, validate and save phone number if required
        const phoneValidationSuccess = await phoneNumberRef.current?.validateAndSave()

        if (phoneValidationSuccess === false) {
          // Phone validation failed, don't proceed
          setSubmitting(false)
          return
        }

        // Phone validation passed, proceed with form submission
        if (onSubmit) {
          const event = events.find((e) => e.id.toString() === values.eventId)
          if (event) {
            onSubmit(values)
          }
        } else {
          // Default behavior: store in sessionStorage and redirect to checkout
          // sessionStorage.setItem('bookingData', JSON.stringify(values))
          // router.push('/booking/checkout')
        }
      } catch (error) {
        console.error('Error during form submission:', error)
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Handle initial values and ensure cascade effects work
  useEffect(() => {
    if (propInitialValues && events?.length > 0) {
      // Check if we need to update any values
      const needsUpdate = Object.entries(propInitialValues).some(([key, value]) => {
        return value !== undefined && formik.values[key as keyof BookingFormData] !== value
      })

      if (needsUpdate) {
        console.log('Updating form with restored data:', propInitialValues)
        console.log('Current form values:', formik.values)
        // Set all initial values
        Object.entries(propInitialValues).forEach(([key, value]) => {
          if (value !== undefined) {
            formik.setFieldValue(key, value, false)
          }
        })
      }
    }
  }, [propInitialValues, events])

  // Additional effect to handle late-arriving restored data
  useEffect(() => {
    if (propInitialValues && Object.keys(propInitialValues).length > 0) {
      // Small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        Object.entries(propInitialValues).forEach(([key, value]) => {
          if (value !== undefined && formik.values[key as keyof BookingFormData] !== value) {
            console.log(`Setting ${key} to:`, value)
            formik.setFieldValue(key, value, false)
          }
        })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [propInitialValues])

  // Helper functions to filter data based on formik values
  const getSelectedEvent = () => {
    if (!formik.values.eventId || !events?.length) return null
    return events.find((event) => event.id === formik.values.eventId) || null
  }

  const getSelectedSchedule = () => {
    const selectedEvent = getSelectedEvent()
    if (!selectedEvent?.schedules?.length || !formik.values.scheduleId) return null
    // schedule sort A -Z
    return (
      selectedEvent.schedules.find((schedule) => schedule.id === formik.values.scheduleId) || null
    )
  }

  const getPickupLocations = () => {
    const selectedSchedule = getSelectedSchedule()
    const locations = selectedSchedule?.pickupLocations || []
    // Sort locations alphabetically by name (A to Z)
    return locations.sort((a, b) => a.name.localeCompare(b.name))
  }

  const getSelectedPickupLocation = () => {
    const pickupLocations = getPickupLocations()
    if (!pickupLocations.length || !formik.values.pickupLocationId) return null
    return pickupLocations.find((loc) => loc.id === formik.values.pickupLocationId) || null
  }

  const getAvailablePickupTimes = () => {
    const selectedSchedule = getSelectedSchedule()
    if (!selectedSchedule?.pickupLocations?.length || !formik.values.pickupLocationId) return []

    const selectedLocation = selectedSchedule.pickupLocations.find(
      (loc) => loc.id === formik.values.pickupLocationId,
    )

    return selectedLocation?.pickupTimes || []
  }

  // Check if selected hotel has no available pickup times (already filtered data)
  const hasNoAvailablePickupTimes = () => {
    // Only check when hotel/location is selected
    if (!formik.values.pickupLocationId) return false

    const availablePickupTimes = getAvailablePickupTimes()
    return availablePickupTimes.length === 0
  }

  // Handle event selection change
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEventId = e.target.value

    // Update event and reset dependent fields
    formik.setFieldValue('eventId', newEventId, false)
    formik.setFieldValue('scheduleId', '', false)
    formik.setFieldValue('pickupLocationId', '', false)
    formik.setFieldValue('pickupTimeId', '', false)
  }

  // Handle schedule selection change
  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScheduleId = e.target.value

    // Update schedule and reset dependent fields
    formik.setFieldValue('scheduleId', newScheduleId, false)
    formik.setFieldValue('pickupLocationId', '', false)
    formik.setFieldValue('pickupTimeId', '', false)
  }

  // Handle pickup location change
  const handlePickupLocationChange = (newLocationId: string) => {
    // Update pickup location and reset pickup time
    formik.setFieldValue('pickupLocationId', newLocationId, false)
    formik.setFieldValue('pickupTimeId', '', false)

    // Auto-select pickup time if there's only one available
    const selectedLocation = getPickupLocations().find((loc) => loc.id === newLocationId)
    if (selectedLocation?.pickupTimes?.length === 1) {
      formik.setFieldValue('pickupTimeId', selectedLocation?.pickupTimes[0]?.id, false)
    }
  }

  // Helper function to display form errors
  const getErrorMessage = (fieldName: keyof BookingFormData) => {
    return formik.touched[fieldName] && formik.errors[fieldName] ? (
      <div className="font-semibold text-red-500 text-sm mt-1">{formik.errors[fieldName]}</div>
    ) : null
  }

  // Get pricing placeholders
  const getAdultPlaceholder = () => {
    const selectedLocation = getSelectedPickupLocation()
    if (selectedLocation?.adultPrice) {
      return `Number of Riders ($${selectedLocation.adultPrice}/rider)`
    }
    return 'Number of Riders'
  }

  const getChildPlaceholder = () => {
    const selectedLocation = getSelectedPickupLocation()
    if (selectedLocation?.childrenPrice) {
      return `Number of children ($${selectedLocation.childrenPrice}/child)`
    }
    return 'Number of children'
  }

  return (
    <div className={className}>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Event Selection */}
        <div className="form-group">
          <p className="text-md font-bold text-black">Your Event:</p>

          <select
            id="eventId"
            name="eventId"
            disabled={isEdit}
            value={formik.values.eventId}
            onChange={handleEventChange}
            onBlur={formik.handleBlur}
            className={`!bg-white !text-gray font-semibold  w-full p-3 border border-gray rounded ${
              formik.errors.eventId && formik.touched.eventId ? 'border-red' : 'border-gray-300'
            }`}
          >
            <option value="" className="bg-white text-gray font-semibold">
              Select your Event
            </option>
            {events?.map((event) => (
              <option key={event.id} value={event.id} className="bg-white text-gray font-semibold">
                {event.name}
              </option>
            ))}
          </select>
          {getErrorMessage('eventId')}
        </div>

        {/* Schedule Selection */}
        <div className="form-group">
          <p className="text-md font-bold text-black">Round Trip Details – Event Date & Time</p>
          <select
            id="scheduleId"
            name="scheduleId"
            value={formik.values.scheduleId}
            onChange={handleScheduleChange}
            onBlur={formik.handleBlur}
            className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded ${
              formik.errors.scheduleId && formik.touched.scheduleId
                ? 'border-red-500'
                : 'border-gray'
            }`}
          >
            <option value="" className="bg-white text-gray font-semibold">
              Select Event Date
            </option>
            {getSelectedEvent()?.schedules?.map((schedule) => {
              return (
                <option
                  key={schedule.id}
                  value={schedule.id}
                  className="bg-white text-gray font-semibold"
                >
                  {schedule.date}
                </option>
              )
            })}
          </select>
          {getErrorMessage('scheduleId')}
        </div>

        {/* Pickup Location */}
        <div className="form-group">
          <SearchableSelect
            id="pickupLocationId"
            name="pickupLocationId"
            value={formik.values.pickupLocationId}
            options={getPickupLocations().map((location) => ({
              value: location.id,
              label: location.location ? `${location.name} — ${location.location}` : location.name,
            }))}
            onChange={handlePickupLocationChange}
            onBlur={() => formik.setFieldTouched('pickupLocationId', true)}
            placeholder="Select Hotel Pick Up Location"
            error={!!(formik.errors.pickupLocationId && formik.touched.pickupLocationId)}
            className={
              formik.errors.pickupLocationId && formik.touched.pickupLocationId
                ? 'border-red-500'
                : ''
            }
          />
          {getErrorMessage('pickupLocationId')}
        </div>

        {/* Show message when no pickup times are available for selected hotel */}
        {hasNoAvailablePickupTimes() && (
          <div className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <p className="text-md text-black font-medium">
                To book a shuttle after the last available shuttle time
                <br />
                please call our customer service team:
              </p>
            </div>

            <Button
              variant="mustard"
              className="pt-2"
              onClick={() => window.open('tel:+18004381814', '_blank')}
            >
              CALL (800)-438-1814
            </Button>
          </div>
        )}

        {/* Guest Counts - Only show if pickup times are available */}
        {!hasNoAvailablePickupTimes() && (
          <>
            {/* Guest Counts */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-group">
                <input
                  type="number"
                  id="adultCount"
                  name="adultCount"
                  min="1"
                  // max="20"
                  placeholder={getAdultPlaceholder()}
                  value={formik.values.adultCount ? formik.values.adultCount : ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded placeholder:text-gray ${
                    formik.errors.adultCount && formik.touched.adultCount
                      ? 'border-red-500'
                      : 'border-gray'
                  }`}
                />
                {getErrorMessage('adultCount')}
              </div>
              {/* hide this field when child price is false */}
              {getSelectedPickupLocation()?.childrenPrice ? (
                <div className="form-group">
                  <input
                    type="number"
                    id="childCount"
                    name="childCount"
                    min="0"
                    // max="20"
                    placeholder={getChildPlaceholder()}
                    value={formik.values.childCount ? formik.values.childCount : ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded placeholder:text-gray ${
                      formik.errors.childCount && formik.touched.childCount
                        ? 'border-red-500'
                        : 'border-gray'
                    }`}
                  />
                  {getErrorMessage('childCount')}
                </div>
              ) : null}
            </div>

            {/* Pickup Time */}

            <div className="form-group">
              <select
                id="pickupTimeId"
                name="pickupTimeId"
                value={formik.values.pickupTimeId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded ${
                  formik.errors.pickupTimeId && formik.touched.pickupTimeId
                    ? 'border-red-500'
                    : 'border-gray'
                }`}
              >
                <option value="" className="bg-white text-gray font-semibold">
                  Select Shuttle Pick Up Time
                </option>
                {getAvailablePickupTimes().map((pickupTime) => (
                  <option
                    key={pickupTime.id}
                    value={pickupTime.id}
                    className="bg-white text-gray font-semibold"
                  >
                    {pickupTime.time}
                  </option>
                ))}
              </select>
              {getErrorMessage('pickupTimeId')}
            </div>

            {/* Required Phone Number Component */}
            <RequiredPhoneNumber
              ref={phoneNumberRef}
              className="mt-4"
              onPhoneNumberSaved={() => setShowPhoneRequired(false)}
            />

            {/* Submit Button */}
            <div className="form-group mt-6 w-full flex items-center justify-center">
              <Button
                type="submit"
                variant="mustard"
                // className="text-lg font-semibold"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default EventBookingForm
