// Shared types for TourBookingForm components

export type PickupTime = {
  id: string
  time: string
  time_tz: string
}

export type PickupLocation = {
  id: string
  hotel: {
    id: number
    name: string
    location?: string
  }
  pickup_times: PickupTime[]
  adult_price: number
  children_price: number
}

export type TourSchedule = {
  id: string
  tour_date_time: string
  schedule_notes?: string
  pickups: PickupLocation[]
}

export type TourOption = {
  id: string
  name: string
  schedules: TourSchedule[]
}

export type TourBookingFormData = {
  tourId: string
  scheduleId: string // Generated schedule ID (YYYY-MM-DD format) for frontend form logic
  pickupLocationId: string
  tourDateTime: string // Full ISO date-time string for the booked tour
  adultCount: number
  childCount: number
}
