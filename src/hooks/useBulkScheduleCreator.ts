import { useState, useCallback } from 'react'

interface ScheduleData {
  startDate: string
  endDate: string
  tourTime: string
  scheduleNotes: string
  pickups: PickupData[]
}

interface PickupData {
  hotelId: string
  hotelName: string
  pickupTimes: string[]
  adultPrice: number
  childrenPrice: number
}

interface UseBulkScheduleCreatorReturn {
  scheduleData: ScheduleData
  isCreating: boolean
  error: string | null
  updateScheduleData: (data: Partial<ScheduleData>) => void
  addPickup: () => void
  updatePickup: (index: number, data: Partial<PickupData>) => void
  removePickup: (index: number) => void
  createSchedules: (tourId: string) => Promise<boolean>
  reset: () => void
  validate: () => string | null
}

const initialData: ScheduleData = {
  startDate: '',
  endDate: '',
  tourTime: '',
  scheduleNotes: '',
  pickups: [],
}

export const useBulkScheduleCreator = (): UseBulkScheduleCreatorReturn => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>(initialData)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateScheduleData = useCallback((data: Partial<ScheduleData>) => {
    setScheduleData((prev) => ({ ...prev, ...data }))
    setError(null)
  }, [])

  const addPickup = useCallback(() => {
    setScheduleData((prev) => ({
      ...prev,
      pickups: [
        ...prev.pickups,
        {
          hotelId: '',
          hotelName: '',
          pickupTimes: [''],
          adultPrice: 0,
          childrenPrice: 0,
        },
      ],
    }))
  }, [])

  const updatePickup = useCallback((index: number, data: Partial<PickupData>) => {
    setScheduleData((prev) => ({
      ...prev,
      pickups: prev.pickups.map((pickup, i) => (i === index ? { ...pickup, ...data } : pickup)),
    }))
  }, [])

  const removePickup = useCallback((index: number) => {
    setScheduleData((prev) => ({
      ...prev,
      pickups: prev.pickups.filter((_, i) => i !== index),
    }))
  }, [])

  const validate = useCallback((): string | null => {
    if (!scheduleData.startDate || !scheduleData.endDate || !scheduleData.tourTime) {
      return 'Please fill in all required fields'
    }

    if (new Date(scheduleData.startDate) > new Date(scheduleData.endDate)) {
      return 'Start date cannot be after end date'
    }

    if (scheduleData.pickups.length === 0) {
      return 'Please add at least one pickup location'
    }

    const invalidPickups = scheduleData.pickups.filter(
      (p) => !p.hotelId || p.pickupTimes.every((t) => !t),
    )

    if (invalidPickups.length > 0) {
      return 'Please ensure all pickups have a hotel and at least one pickup time'
    }

    return null
  }, [scheduleData])

  const createSchedules = useCallback(
    async (tourId: string): Promise<boolean> => {
      const validationError = validate()
      if (validationError) {
        setError(validationError)
        return false
      }

      setIsCreating(true)
      setError(null)

      try {
        console.log('🚀 Attempting bulk schedule creation...')

        // Try the main endpoint first
        let response = await fetch('/api/tours/bulk-schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tourId,
            ...scheduleData,
          }),
        })

        // If main endpoint fails with Payload error, try simple endpoint
        if (!response.ok) {
          let errorData
          try {
            errorData = await response.json()
          } catch (jsonError) {
            console.error('Failed to parse error response:', jsonError)
            throw new Error(`API request failed with status ${response.status}`)
          }

          if (
            errorData.message?.includes("tours can't be found") ||
            errorData.message?.includes('collection')
          ) {
            console.log('⚠️ Main endpoint failed, trying simple endpoint...')

            response = await fetch('/api/tours/bulk-schedules-simple', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                tourId,
                ...scheduleData,
              }),
            })

            if (!response.ok) {
              let fallbackErrorData
              try {
                fallbackErrorData = await response.json()
              } catch (jsonError) {
                console.error('Failed to parse fallback error response:', jsonError)
                throw new Error(`Fallback API request failed with status ${response.status}`)
              }
              throw new Error(fallbackErrorData.message || 'Failed to create schedules')
            }
          } else {
            throw new Error(errorData.message || 'Failed to create schedules')
          }
        }

        const result = await response.json()
        console.log('✅ Schedules created successfully:', result)
        return true
      } catch (err: any) {
        console.error('❌ Schedule creation failed:', err)
        setError(err.message)
        return false
      } finally {
        setIsCreating(false)
      }
    },
    [scheduleData, validate],
  )

  const reset = useCallback(() => {
    setScheduleData(initialData)
    setError(null)
    setIsCreating(false)
  }, [])

  return {
    scheduleData,
    isCreating,
    error,
    updateScheduleData,
    addPickup,
    updatePickup,
    removePickup,
    createSchedules,
    reset,
    validate,
  }
}
