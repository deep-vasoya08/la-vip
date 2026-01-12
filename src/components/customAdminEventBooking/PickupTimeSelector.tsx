'use client'

import React, { useState, useEffect } from 'react'
import { useField, useFormFields, LoadingOverlay, FieldLabel, Select } from '@payloadcms/ui'
import { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'

interface PickupTimeSelectorProps {
  path: string
  label?: string
  required?: boolean
}

interface PickupTimeOption {
  label: string
  value: string
  time: string
  formattedTime: string
}

const PickupTimeSelector: React.FC<PickupTimeSelectorProps> = ({
  path,
  label = 'Pickup Time',
  required = false,
}) => {
  const { value, setValue } = useField<string>({ path })
  const eventField = useFormFields(([fields]) => fields?.event)
  const scheduleField = useFormFields(([fields]) => fields?.scheduleId)
  const locationField = useFormFields(([fields]) => fields?.['pickupDetails.locationId'])
  const [eventData, setEventData] = useState<Event | null>(null)
  const [_selectedTime, setSelectedTime] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Format time for display
  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    } catch (_error) {
      return timeString
    }
  }

  // Fetch event data when event field changes
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventField?.value) {
        setEventData(null)
        setSelectedTime(null)
        setValue('')
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/events/${eventField.value}?depth=2`)
        if (response.ok) {
          const event = await response.json()
          setEventData(event)

          // If there's a current timeId, find and set the selected time
          if (value && event.schedules && scheduleField?.value && locationField?.value) {
            const schedule = event.schedules.find((s: any) => s.id === scheduleField.value)
            if (schedule?.pickups) {
              const pickup = schedule.pickups.find((p: any) => p.id === locationField.value)
              if (pickup?.pickup_times) {
                const time = pickup.pickup_times.find((t: any) => t.id === value)
                setSelectedTime(time)
              }
            }
          }
        }
      } catch (_error) {
        console.error('Error fetching event data:', _error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventField?.value, scheduleField?.value, locationField?.value, value, setValue])

  // Handle time selection
  const handleTimeChange = (option: any) => {
    const timeId = Array.isArray(option) ? option[0]?.value : option?.value
    setValue(timeId || '')

    if (eventData?.schedules && scheduleField?.value && locationField?.value) {
      const schedule = eventData.schedules.find((s: any) => s.id === scheduleField.value)
      if (schedule?.pickups) {
        const pickup = schedule.pickups.find((p: any) => p.id === locationField.value)
        if (pickup?.pickup_times) {
          const time = pickup.pickup_times.find((t: any) => t.id === timeId)
          setSelectedTime(time || null)
        }
      }
    }
  }

  if (!eventField?.value) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">
          Please select an event first to choose a pickup time.
        </div>
      </div>
    )
  }

  if (!scheduleField?.value) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">
          Please select a schedule first to choose a pickup time.
        </div>
      </div>
    )
  }

  if (!locationField?.value) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">
          Please select a pickup location first to choose a pickup time.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <LoadingOverlay />
      </div>
    )
  }

  // Get current location's pickup times
  const currentSchedule = eventData?.schedules?.find((s: any) => s.id === scheduleField.value)
  const currentPickup = currentSchedule?.pickups?.find((p: any) => p.id === locationField.value)

  const timeOptions: PickupTimeOption[] =
    currentPickup?.pickup_times?.map((time: any) => {
      const formattedTime = formatDateTime(time.time)

      // Create detailed label with both short time and full date/time
      const label = `${formattedTime}`

      return {
        label,
        value: time.id || '',
        time: time.time,
        formattedTime,
      }
    }) || []

  // Debug logging
  console.log('PickupTimeSelector Debug:', {
    eventFieldValue: eventField?.value,
    scheduleFieldValue: scheduleField?.value,
    locationFieldValue: locationField?.value,
    currentSchedule: !!currentSchedule,
    currentPickup: !!currentPickup,
    pickupTimesCount: currentPickup?.pickup_times?.length || 0,
    timeOptionsCount: timeOptions.length,
  })

  return (
    <div className="field-type" style={{ width: '100%' }}>
      <FieldLabel htmlFor={path} label={label} required={required} />

      {/* Time Selector */}
      <div style={{ width: '100%' }}>
        <Select
          value={(() => {
            const allOptions = [
              { label: 'Select a pickup time...', value: '' },
              ...timeOptions.map((option) => ({ label: option.label, value: option.value })),
            ]
            return allOptions.find((option) => option.value === value) || allOptions[0]
          })()}
          onChange={handleTimeChange}
          options={[
            { label: 'Select a pickup time...', value: '' },
            ...timeOptions.map((option) => ({ label: option.label, value: option.value })),
          ]}
          isClearable={true}
        />
      </div>

      {/* No times message */}
      {currentPickup &&
        (!currentPickup.pickup_times || currentPickup.pickup_times.length === 0) && (
          <div className="field-description">No pickup times available for this location.</div>
        )}
    </div>
  )
}

export default PickupTimeSelector
