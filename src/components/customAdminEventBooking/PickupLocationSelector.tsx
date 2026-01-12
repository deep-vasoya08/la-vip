'use client'

import React, { useState, useEffect } from 'react'
import { useField, useFormFields, LoadingOverlay, FieldLabel, Select } from '@payloadcms/ui'
import { Event } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { ScheduleOption } from './types'

interface PickupLocationSelectorProps {
  path: string
  label?: string
  required?: boolean
}

interface PickupLocationOption {
  label: string
  value: string
  hotelName?: string
  location?: string
  adultPrice?: number
  childrenPrice?: number
}

const PickupLocationSelector: React.FC<PickupLocationSelectorProps> = ({
  path,
  label = 'Pickup Location',
  required = false,
}) => {
  const { value, setValue } = useField<string>({ path })
  const eventField = useFormFields(([fields]) => fields?.event)
  const scheduleField = useFormFields(([fields]) => fields?.scheduleId)
  const [eventData, setEventData] = useState<Event | null>(null)
  const [_selectedLocation, setSelectedLocation] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch event data when event field changes
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventField?.value) {
        setEventData(null)
        setSelectedLocation(null)
        setValue('')
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/events/${eventField.value}?depth=2`)
        if (response.ok) {
          const event = await response.json()
          setEventData(event)

          // If there's a current locationId, find and set the selected location
          if (value && event.schedules && scheduleField?.value) {
            const schedule = event.schedules.find((s: any) => s.id === scheduleField.value)
            if (schedule?.pickups) {
              const pickup = schedule.pickups.find((p: any) => p.id === value)
              setSelectedLocation(pickup)
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
  }, [eventField?.value, scheduleField?.value, value, setValue])

  // Handle location selection
  const handleLocationChange = (option: any) => {
    const locationId = Array.isArray(option) ? option[0]?.value : option?.value
    setValue(locationId || '')

    if (eventData?.schedules && scheduleField?.value) {
      const schedule = eventData.schedules.find((s: any) => s.id === scheduleField.value)
      if (schedule?.pickups) {
        const pickup = schedule.pickups.find((p: any) => p.id === locationId)
        setSelectedLocation(pickup || null)
      }
    }
  }

  if (!eventField?.value) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">
          Please select an event first to choose a pickup location.
        </div>
      </div>
    )
  }

  if (!scheduleField?.value) {
    return (
      <div className="field-type" style={{ width: '100%' }}>
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">
          Please select a schedule first to choose a pickup location.
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

  // Get current schedule's pickup locations
  const currentSchedule = eventData?.schedules?.find((s: any) => s.id === scheduleField.value)
  const locationOptions: PickupLocationOption[] =
    currentSchedule?.pickups?.map((pickup: any) => {
      const hotelName = typeof pickup.hotel === 'object' ? pickup.hotel.name : 'Unknown Hotel'
      const location = typeof pickup.hotel === 'object' ? pickup.hotel.location : ''
      const adultPrice = pickup.adult_price
      const childrenPrice = pickup.children_price

      // Create detailed label with hotel name, location, and pricing
      let label = hotelName
      if (location) {
        label += ` - ${location}`
      }
      label += ` (Adult: $${adultPrice}`
      if (childrenPrice !== null && childrenPrice !== undefined) {
        label += `, Child: $${childrenPrice}`
      }
      label += ')'

      return {
        label,
        value: pickup.id || '',
        hotelName,
        location,
        adultPrice,
        childrenPrice,
      }
    }) || []

  // Debug logging
  console.log('PickupLocationSelector Debug:', {
    eventFieldValue: eventField?.value,
    scheduleFieldValue: scheduleField?.value,
    currentSchedule: !!currentSchedule,
    pickupsCount: currentSchedule?.pickups?.length || 0,
    locationOptionsCount: locationOptions.length,
  })

  return (
    <div className="field-type" style={{ width: '100%' }}>
      <FieldLabel htmlFor={path} label={label} required={required} />

      {/* Location Selector */}
      <div style={{ width: '100%' }}>
        <Select
          value={(() => {
            const allOptions = [
              { label: 'Select a pickup location...', value: '' },
              ...locationOptions.map((option) => ({ label: option.label, value: option.value })),
            ]
            return allOptions.find((option) => option.value === value) || allOptions[0]
          })()}
          onChange={handleLocationChange}
          options={[
            { label: 'Select a pickup location...', value: '' },
            ...locationOptions.map((option) => ({ label: option.label, value: option.value })),
          ]}
          isClearable={true}
        />
      </div>

      {/* No locations message */}
      {currentSchedule && (!currentSchedule.pickups || currentSchedule.pickups.length === 0) && (
        <div className="field-description">No pickup locations available for this schedule.</div>
      )}
    </div>
  )
}

export default PickupLocationSelector
