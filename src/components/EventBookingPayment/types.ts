// Shared types for BookingForm components
export type PickupTime = {
  id: string
  time: string
}

export type PickupLocation = {
  id: string
  name: string
  location?: string
  pickupTimes: PickupTime[]
  adultPrice?: number
  childrenPrice?: number
}

export type ScheduleOption = {
  id: string
  date: string
  status: string
  pickupLocations: PickupLocation[]
}

export type EventOption = {
  id: string
  name: string
  schedules: ScheduleOption[]
}

export type BookingFormData = {
  eventId: string
  scheduleId: string
  adultCount: number
  childCount: number
  pickupLocationId: string
  pickupTimeId: string
}
