import { NextRequest, NextResponse } from 'next/server'
import { calculatePriceDifference, type EditBookingData } from '@/utilities/eventBookingEditUtils'
import { getAuthenticatedUser, validateBookingAccess } from '@/utilities/auth'
import { EventBooking } from '@/payload-types'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
    }

    const { bookingId, editData }: { bookingId: string; editData: EditBookingData } =
      await req.json()

    if (!bookingId || !editData) {
      return NextResponse.json({ error: 'Booking ID and edit data are required' }, { status: 400 })
    }

    // Validate booking access
    const validationResult = await validateBookingAccess(
      bookingId,
      authResult.user.id,
      authResult.user.role,
      'event',
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.statusCode },
      )
    }

    // Calculate price difference
    const priceResult = await calculatePriceDifference(
      validationResult.booking as EventBooking,
      editData,
    )

    if ('error' in priceResult) {
      return NextResponse.json({ error: priceResult.error }, { status: priceResult.statusCode })
    }

    // Return the price difference and new pricing details
    return NextResponse.json({
      priceDifference: {
        originalAmount: priceResult.originalAmount,
        newAmount: priceResult.newAmount,
        difference: priceResult.difference,
        type: priceResult.type,
      },
      newPricing: priceResult.newPricing,
    })
  } catch (error) {
    console.error('Price calculation error:', error)
    return NextResponse.json({ error: 'Error calculating price difference' }, { status: 500 })
  }
}
