import { TourBooking } from '@/payload-types'
import { getAuthenticatedUser, validateBookingAccess } from '@/utilities/auth'
import { EditBookingData } from '@/utilities/tourBookingEditUtils'
import { calculatePriceDifference } from '@/utilities/tourBookingEditUtils'
import { NextRequest, NextResponse } from 'next/server'

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
      'tour',
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.statusCode },
      )
    }

    // Calculate price difference
    const priceResult = await calculatePriceDifference(
      validationResult.booking as TourBooking,
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
