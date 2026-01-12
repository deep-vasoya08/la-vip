import { NextRequest, NextResponse } from 'next/server'
import { EditBookingData } from '@/utilities/tourBookingEditUtils'
import { getAuthenticatedUser, validateBookingAccess } from '@/utilities/auth'
import { processUpchargePayment } from '@/utilities/paymentUtils'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
    }

    const {
      bookingId,
      upchargeAmount,
      editData,
    }: { bookingId: string; upchargeAmount: number; editData: EditBookingData } = await req.json()

    if (!bookingId || !upchargeAmount || !editData) {
      return NextResponse.json(
        {
          error: 'Booking ID, upcharge amount, and edit data are required',
        },
        { status: 400 },
      )
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

    const { booking, user } = validationResult

    // Process upcharge payment using the utility function
    const paymentResult = await processUpchargePayment(
      bookingId,
      user!.id,
      upchargeAmount,
      user!,
      'tour',
      {
        bookingId,
        bookingReference: booking!.bookingReference,
        userId: user!.id,
        bookingType: 'tour',
        paymentType: 'upcharge',
        originalAmount: booking!.pricing.totalAmount,
        upchargeAmount,
        editData: JSON.stringify(editData),
      },
    )

    return NextResponse.json({
      clientSecret: paymentResult.clientSecret,
      paymentIntentId: paymentResult.paymentIntentId,
      paymentId: paymentResult.paymentId,
      upchargeAmount: paymentResult.amount,
    })
  } catch (error) {
    console.error('Upcharge payment creation error:', error)
    return NextResponse.json({ error: 'Error creating upcharge payment intent' }, { status: 500 })
  }
}
