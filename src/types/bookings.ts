import { ChipStatus } from '@/components/ui/chip'
import { Event, Hotel, Tour } from '@/payload-types'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface PickupDetails {
  locationId: string
  hotelId: number
  pickupDateTime: string
  tourDateTime: string
}

export interface PricingDetails {
  adultPrice: number
  childrenPrice: number
  adultTotal: number
  childTotal: number
  totalAmount: number
  currency: string
}

export interface BookedByInfo {
  id: string | number
  name: string
  email: string
  role: string
}

export interface BaseBooking {
  id: string
  bookingReference: string
  scheduledDate: string // Changed from scheduleId to scheduledDate
  adultCount: number
  childCount: number
  pickupDetails: PickupDetails
  pricing: PricingDetails
  status: BookingStatus
  createdAt: string
  updatedAt: string
  bookedByInfo?: BookedByInfo | null
  isSelfBooked?: boolean
  bookingCreator?: string
}

export interface EventBooking extends BaseBooking {
  type: 'event'
  event: Event
  eventDate?: string | null
}

export interface TourBooking extends BaseBooking {
  type: 'tour'
  tour: Tour
  tourDate?: string | null
}

export type Booking = EventBooking | TourBooking

export interface PaymentData {
  id: string
  paymentReference: string
  amount: number
  currency: string
  paymentStatus: string
  paymentMethod: string
  paymentDate: string
  stripeDetails?: {
    stripePaymentIntentId?: string
    lastCardDigits?: string
    paymentMethodType?: string
    receiptUrl?: string
  }
  refundStatus?: 'not_refunded' | 'pending' | 'refunded' | 'failed'
  refundedAmount?: number
  stripeRefundId?: string
  refundReceiptUrl?: string
  notes?: string
  createdAt: string
}

export const STATUS_COLOR: Record<BookingStatus, ChipStatus> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
  completed: 'info',
}
