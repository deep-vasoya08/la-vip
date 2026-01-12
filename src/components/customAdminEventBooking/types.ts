// Types for Custom Admin Event Booking Components

export interface EventScheduleSelectorProps {
  path: string
  label?: string
  required?: boolean
}

export interface ScheduleOption {
  label: string
  value: string
}

export interface EventSchedule {
  id?: string | null
  event_date_time: string
  schedule_status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  schedule_notes?: string | null
}

// Additional types for future event booking admin components
export interface EventBookingData {
  id: string
  bookingReference: string
  event: string | number
  scheduleId: string
  adultCount: number
  childCount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalAmount: number
  currency: string
}

export interface EventBookingFormProps {
  initialData?: Partial<EventBookingData>
  onSubmit?: (data: EventBookingData) => void
  onCancel?: () => void
  isEdit?: boolean
}
