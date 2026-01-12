import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Auto-calculate pricing for event booking based on event, schedule, pickup location, and participant counts
 */
export async function calculateEventBookingPricing({
  eventId,
  scheduleId,
  pickupLocationId,
  adultCount = 0,
  childCount = 0,
}: {
  eventId: string | number
  scheduleId: string
  pickupLocationId: string
  adultCount?: number
  childCount?: number
}) {
  try {
    const payload = await getPayload({ config })

    // Get event details with full depth
    const event = await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 3,
    })

    if (!event || !event.schedules) {
      throw new Error('Event or schedules not found')
    }

    // Find the selected schedule
    const selectedSchedule = event.schedules.find((schedule: any) => schedule.id === scheduleId)

    if (!selectedSchedule || !selectedSchedule.pickups) {
      throw new Error('Schedule or pickups not found')
    }

    // Find the selected pickup location
    const selectedPickup = selectedSchedule.pickups.find(
      (pickup: any) => pickup.id === pickupLocationId,
    )

    if (!selectedPickup) {
      throw new Error('Pickup location not found')
    }

    // Calculate pricing
    const adultPrice = selectedPickup.adult_price || 0
    const childrenPrice = selectedPickup.children_price || 0

    const adultTotal = adultCount * adultPrice
    const childTotal = childCount * childrenPrice
    const totalAmount = adultTotal + childTotal

    // Get hotel ID if available
    const hotelId = selectedPickup.hotel
      ? typeof selectedPickup.hotel === 'object'
        ? selectedPickup.hotel.id
        : selectedPickup.hotel
      : null

    return {
      pricing: {
        adultPrice,
        childrenPrice,
        adultTotal,
        childTotal,
        totalAmount,
        currency: 'USD',
      },
      hotelId,
      success: true,
    }
  } catch (error) {
    console.error('Error calculating event booking pricing:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }
  }
}

/**
 * Validate if all required data is present for pricing calculation
 */
export function canCalculatePricing(data: any): boolean {
  return !!(
    data.event &&
    data.scheduleId &&
    data.pickupDetails?.locationId &&
    (data.adultCount || data.childCount)
  )
}

/**
 * Check if pricing data is missing or incomplete
 */
export function isPricingMissing(data: any): boolean {
  return (
    !data.pricing ||
    !data.pricing.totalAmount ||
    data.pricing.totalAmount === 0 ||
    !data.pricing.adultPrice ||
    !data.pricing.adultTotal
  )
}
