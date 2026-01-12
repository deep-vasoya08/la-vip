'use client'

import React, { useState, useEffect } from 'react'
import { useField, useFormFields, LoadingOverlay, FieldLabel, Select } from '@payloadcms/ui'
import { Event } from '@/payload-types'
import type { EventScheduleSelectorProps, ScheduleOption, EventSchedule } from './types'
import { formatDateTime } from '@/utilities/formatDateTime'
// import './EventScheduleSelector.scss'

const EventScheduleSelector: React.FC<EventScheduleSelectorProps> = ({
  path,
  label = 'Event Schedule',
  required = false,
}) => {
  const { value, setValue } = useField<string>({ path })
  const eventField = useFormFields(([fields]) => fields?.event)
  const [eventData, setEventData] = useState<Event | null>(null)
  const [_selectedSchedule, setSelectedSchedule] = useState<EventSchedule | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch event data when event field changes
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventField?.value) {
        setEventData(null)
        setSelectedSchedule(null)
        setValue('')
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/events/${eventField.value}?depth=2`)
        if (response.ok) {
          const event = await response.json()
          setEventData(event)

          // If there's a current scheduleId, find and set the selected schedule
          if (value && event.schedules) {
            const schedule = event.schedules.find((s: EventSchedule) => s.id === value)
            setSelectedSchedule(schedule || null)
          }
        }
      } catch (_error) {
        console.error('Error fetching event data:', _error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventField?.value, value, setValue])

  // Handle schedule selection
  const handleScheduleChange = (option: any) => {
    const scheduleId = Array.isArray(option) ? option[0]?.value : option?.value
    setValue(scheduleId || '')

    if (eventData?.schedules) {
      const schedule = eventData.schedules.find((s) => s.id === scheduleId)
      setSelectedSchedule(schedule || null)
    }
  }

  if (!eventField?.value) {
    return (
      <div className="field-type">
        <FieldLabel htmlFor={path} label={label} required={required} />
        <div className="field-description">Please select an event first to choose a schedule.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="field-type">
        <FieldLabel htmlFor={path} label={label} required={required} />
        <LoadingOverlay />
      </div>
    )
  }

  // Prepare options for the Select component
  const scheduleOptions: ScheduleOption[] =
    eventData?.schedules?.map((schedule) => ({
      label: `${formatDateTime(schedule.event_date_time)}`,
      value: schedule.id || '',
    })) || []

  return (
    <div className="field-type">
      <FieldLabel htmlFor={path} label={label} required={required} />

      {/* Schedule Selector */}
      <Select
        value={(() => {
          const allOptions = [
            { label: 'Select a schedule date...', value: '' },
            ...scheduleOptions.map((option) => ({ label: option.label, value: option.value })),
          ]
          return allOptions.find((option) => option.value === value) || allOptions[0]
        })()}
        onChange={handleScheduleChange}
        options={[
          { label: 'Select a schedule date...', value: '' },
          ...scheduleOptions.map((option) => ({ label: option.label, value: option.value })),
        ]}
        isClearable={true}
      />
    </div>
  )
}

export default EventScheduleSelector
