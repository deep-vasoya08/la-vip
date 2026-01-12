'use client'
import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { TourOption, TourBookingFormData } from './types'
import { isSameDay } from 'date-fns'
import { formatDateTime } from '@/utilities/formatDateTime'
import { InfoIcon } from 'lucide-react'
import RequiredPhoneNumber, { RequiredPhoneNumberHandle } from '@/components/RequiredPhoneNumber'
import SearchableSelect from '@/components/SearchableSelect'

// Validation schema using Yup - updated for new schema
const BookingSchema = Yup.object().shape({
  tourId: Yup.string().required('Please select a tour'),
  scheduleId: Yup.string().required('Please select a date'),
  pickupLocationId: Yup.string().required('Please select hotel pick up location'),
  tourDateTime: Yup.string().required('Tour date time is required'),
  adultCount: Yup.number()
    .required('Adult count is required')
    .min(1, 'At least 1 adult is required'),
  childCount: Yup.number().min(0, 'Child count must be 0 or more'),
})

// Props for the BookingForm component
interface BookingFormProps {
  tours?: TourOption[]
  onSubmit?: (data: TourBookingFormData) => void
  className?: string
  initialValues?: Partial<TourBookingFormData>
  isEditing?: boolean
}

const TourBookingForm: React.FC<BookingFormProps> = ({
  tours = [],
  onSubmit,
  className = '',
  initialValues: propInitialValues,
  isEditing = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showPhoneRequired, setShowPhoneRequired] = useState(true)
  const phoneNumberRef = useRef<RequiredPhoneNumberHandle>(null)

  // Initial form values - merge defaults with provided initial values
  const initialValues: TourBookingFormData = {
    tourId: '',
    scheduleId: '',
    adultCount: 0,
    childCount: 0,
    pickupLocationId: '',
    tourDateTime: '',
    ...propInitialValues,
  }

  // Setup formik
  const formik = useFormik({
    initialValues,
    validationSchema: BookingSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        console.log('Form submitted with values:', values)
        console.log('Form is valid:', formik.isValid)
        console.log('onSubmit prop provided:', !!onSubmit)

        // First, validate and save phone number if required
        const phoneValidationSuccess = await phoneNumberRef.current?.validateAndSave()

        if (phoneValidationSuccess === false) {
          // Phone validation failed, don't proceed
          setSubmitting(false)
          return
        }

        // Phone validation passed, proceed with form submission
        if (onSubmit) {
          console.log('Calling onSubmit prop')
          onSubmit(values)
        } else {
          console.log('No onSubmit prop provided, using default behavior')
          // Default behavior: store in sessionStorage and redirect to checkout
          sessionStorage.setItem('bookingData', JSON.stringify(values))
          // For now, just log that we would redirect
          console.log('Would redirect to checkout page')
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
    if (propInitialValues && tours?.length > 0) {
      // Check if we need to update any values
      const needsUpdate = Object.entries(propInitialValues).some(([key, value]) => {
        return value !== undefined && formik.values[key as keyof TourBookingFormData] !== value
      })

      if (needsUpdate) {
        console.log('Updating tour form with restored data:', propInitialValues)
        console.log('Current form values:', formik.values)
        // Set all initial values
        Object.entries(propInitialValues).forEach(([key, value]) => {
          if (value !== undefined) {
            formik.setFieldValue(key, value, false)
          }
        })

        // Set selected date if scheduleId is provided
        if (propInitialValues.scheduleId) {
          const schedule = getSelectedTour()?.schedules?.find(
            (s) => s.id === propInitialValues.scheduleId,
          )
          if (schedule) {
            // Convert ISO string to Date object for calendar selection
            const scheduleDate = new Date(schedule.tour_date_time)
            if (!isNaN(scheduleDate.getTime())) {
              setSelectedDate(scheduleDate)
            }
          }
        }
      }
    }
  }, [propInitialValues, tours])

  // Additional effect to handle late-arriving restored data
  useEffect(() => {
    if (propInitialValues && Object.keys(propInitialValues).length > 0) {
      // Small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        Object.entries(propInitialValues).forEach(([key, value]) => {
          if (value !== undefined && formik.values[key as keyof TourBookingFormData] !== value) {
            console.log(`Setting ${key} to:`, value)
            formik.setFieldValue(key, value, false)
          }
        })

        // Set selected date if scheduleId is provided
        if (propInitialValues.scheduleId) {
          const schedule = getSelectedTour()?.schedules?.find(
            (s) => s.id === propInitialValues.scheduleId,
          )
          if (schedule) {
            // Convert ISO string to Date object for calendar selection
            const scheduleDate = new Date(schedule.tour_date_time)
            if (!isNaN(scheduleDate.getTime())) {
              setSelectedDate(scheduleDate)
            }
          }
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [propInitialValues])

  // Helper functions to filter data based on formik values
  const getSelectedTour = () => {
    if (!formik.values.tourId || !tours?.length) return null
    return tours.find((tour) => tour.id.toString() === formik.values.tourId) || null
  }

  const getSelectedSchedule = () => {
    const selectedTour = getSelectedTour()
    if (!selectedTour?.schedules?.length || !formik.values.scheduleId) return null
    return (
      selectedTour.schedules.find((schedule) => schedule.id === formik.values.scheduleId) || null
    )
  }

  const getSelectedPickupLocation = () => {
    const selectedSchedule = getSelectedSchedule()
    if (!selectedSchedule?.pickups?.length || !formik.values.pickupLocationId) return null

    // With the updated schema, pickup ID should match hotel ID
    return (
      selectedSchedule.pickups.find((pickup) => pickup.id === formik.values.pickupLocationId) ||
      null
    )
  }

  // Get available dates for the selected tour
  const getAvailableDates = () => {
    const selectedTour = getSelectedTour()
    if (!selectedTour?.schedules?.length) return []

    const dates = selectedTour.schedules
      .map((schedule) => {
        try {
          // Convert ISO string to Date object for calendar functionality
          const date = new Date(schedule.tour_date_time)
          if (isNaN(date.getTime())) {
            console.error('Invalid tour_date_time format:', schedule.tour_date_time)
            return null
          }
          return date
        } catch (error) {
          console.error('Error parsing tour_date_time:', schedule.tour_date_time, error)
          return null
        }
      })
      .filter((date): date is Date => date !== null)

    return dates
  }

  // Check if a date is available
  const isDateAvailable = (date: Date) => {
    const availableDates = getAvailableDates()
    return availableDates.some((availableDate) => isSameDay(availableDate, date))
  }

  // Handle date selection from calendar - updated for new schema
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      formik.setFieldValue('scheduleId', '')
      formik.setFieldValue('tourDateTime', '')
      formik.setFieldValue('pickupLocationId', '')
      return
    }

    setSelectedDate(date)

    // Generate schedule ID in YYYY-MM-DD format
    const scheduleId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    formik.setFieldValue('scheduleId', scheduleId)

    // Find the matching schedule to get the full tour date-time
    const selectedTour = getSelectedTour()
    if (selectedTour?.schedules?.length) {
      const schedule = selectedTour.schedules.find((s) => s.id === scheduleId)
      if (schedule) {
        formik.setFieldValue('tourDateTime', schedule.tour_date_time)
        console.log('Set tourDateTime to:', schedule.tour_date_time)
      } else {
        console.error('Could not find schedule with ID:', scheduleId)
        console.log(
          'Available schedules:',
          selectedTour.schedules.map((s) => s.id),
        )
      }
    } else {
      console.error('No schedules available for tour')
    }

    // Clear pickup selection when date changes
    formik.setFieldValue('pickupLocationId', '')
  }

  // Handle selection changes
  const handleTourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTourId = e.target.value
    formik.setFieldValue('tourId', newTourId, false)
    formik.setFieldValue('scheduleId', '', false)
    formik.setFieldValue('tourDateTime', '', false)
    formik.setFieldValue('pickupLocationId', '', false)
    setSelectedDate(undefined)
  }

  const handlePickupLocationChange = (newPickupLocationId: string) => {
    formik.setFieldValue('pickupLocationId', newPickupLocationId, false)
    // No need to set pickup time ID in new schema - pickup time is calculated automatically
  }

  // Helper function to display form errors
  const getErrorMessage = (fieldName: keyof TourBookingFormData) => {
    return formik.touched[fieldName] && formik.errors[fieldName] ? (
      <div className="font-semibold text-red-500 text-sm mt-1">{formik.errors[fieldName]}</div>
    ) : null
  }

  // Get pricing placeholders based on selected pickup location
  const getPricingInfo = () => {
    const selectedPickup = getSelectedPickupLocation()
    if (selectedPickup) {
      return {
        adult: `Number of Adults ($${selectedPickup.adult_price}/adult)`,
        child: `Number of Children ($${selectedPickup.children_price}/child)`,
      }
    }
    return {
      adult: 'Number of Adults',
      child: 'Number of Children',
    }
  }

  const pricingInfo = getPricingInfo()

  return (
    <div className={className}>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Tour Selection */}
        <div className="form-group">
          <p className="text-md font-bold text-black">Your Tour:</p>
          <select
            id="tourId"
            name="tourId"
            disabled={isEditing}
            value={formik.values.tourId}
            onChange={handleTourChange}
            onBlur={formik.handleBlur}
            className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded ${
              formik.errors.tourId && formik.touched.tourId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="" className="bg-white text-gray font-semibold">
              Select your Tour
            </option>
            {tours?.map((tour) => (
              <option key={tour.id} value={tour.id} className="bg-white text-gray font-semibold">
                {tour.name}
              </option>
            ))}
          </select>
          {getErrorMessage('tourId')}
        </div>

        {/* Schedule Selection - Calendar */}
        {formik.values.tourId && (
          <div className="form-group">
            <p className="text-md font-bold text-black">Your Round Trip Details:</p>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <Calendar
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => !isDateAvailable(date)}
                className="w-full"
                defaultMonth={getAvailableDates()[0] || new Date()}
              />
              {selectedDate && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-black">
                    Selected Date:{' '}
                    {formatDateTime(
                      getSelectedSchedule()?.tour_date_time || '',
                      false,
                      false,
                      false,
                    )}
                  </p>
                </div>
              )}
            </div>
            {getErrorMessage('scheduleId')}
          </div>
        )}

        {/* Pickup Location Selection */}
        <div className="form-group">
          <SearchableSelect
            id="pickupLocationId"
            name="pickupLocationId"
            value={formik.values.pickupLocationId}
            options={
              getSelectedSchedule()?.pickups?.map((pickup) => ({
                value: pickup.id,
                label: pickup.hotel.location
                  ? `${pickup.hotel.name} — ${pickup.hotel.location}`
                  : pickup.hotel.name,
              })) || []
            }
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
        {formik.values.pickupLocationId && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <InfoIcon className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-black">
              Pickup Time:{' '}
              {formatDateTime(
                getSelectedPickupLocation()?.pickup_times?.[0]?.time || '',
                true,
                false,
              )}
              <br />
            </p>
          </div>
        )}

        {/* Number of People */}
        <div className="form-group">
          <div className="space-y-3">
            <div>
              <input
                type="number"
                id="adultCount"
                name="adultCount"
                placeholder={pricingInfo.adult}
                value={formik.values.adultCount ? formik.values.adultCount : ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`!bg-white !text-gray font-semibold w-full p-3 border border-gray rounded placeholder:text-gray ${
                  formik.errors.adultCount && formik.touched.adultCount
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                min="0"
              />
              {getErrorMessage('adultCount')}
            </div>
            {getSelectedPickupLocation()?.children_price ? (
              <div>
                <input
                  type="number"
                  id="childCount"
                  name="childCount"
                  placeholder={pricingInfo.child}
                  value={formik.values.childCount ? formik.values.childCount : ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`!bg-white !text-gray font-semibold w-full p-3 ${getSelectedPickupLocation()?.children_price ? 'pt-1' : ''} border border-gray rounded placeholder:text-gray ${
                    formik.errors.childCount && formik.touched.childCount
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  min="0"
                />
                {getErrorMessage('childCount')}
              </div>
            ) : null}
          </div>
        </div>

        {/* Required Phone Number Component */}
        <RequiredPhoneNumber
          ref={phoneNumberRef}
          className="mt-4"
          onPhoneNumberSaved={() => setShowPhoneRequired(false)}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="mustard"
          disabled={formik.isSubmitting}
          className="align-center w-full"
          onClick={(_e) => {
            console.log('Button clicked!')
            console.log('Form values:', formik.values)
            console.log('Form errors:', formik.errors)
            console.log('Form valid:', formik.isValid)

            // Let the form handle submission
          }}
        >
          {formik.isSubmitting ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </form>
    </div>
  )
}

export default TourBookingForm
