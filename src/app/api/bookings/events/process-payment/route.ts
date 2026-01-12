import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/options'
import { EventBooking, User } from '@/payload-types'
import { createOrGetStripeCustomer } from '@/utilities/paymentUtils'
import stripe from '@/lib/stripe'
import { formatAmountForStripe } from '@/lib/stripe-helpers'
import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'

export async function POST(req: NextRequest) {
  try {
    // Initialize payload instance
    const payload = await getPayload({ config })

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get booking details
    const booking = (await payload.findByID({
      collection: 'event_bookings',
      id: bookingId,
      depth: 2,
    })) as EventBooking

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user has access to this booking
    const bookingUserId = typeof booking.user === 'object' ? booking.user.id : booking.user
    const isAdmin = session.user.role === 'admin'
    const hasAccess = isAdmin || bookingUserId?.toString() === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if payment is needed
    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'Booking is already confirmed' }, { status: 400 })
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot process payment for this booking' },
        { status: 400 },
      )
    }

    // Get user details for payment
    const user = (await payload.findByID({
      collection: 'users',
      id: bookingUserId!,
    })) as User

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    const customerId = await createOrGetStripeCustomer(user)

    // Format amount for Stripe
    const amount = booking.pricing?.totalAmount || 0
    const amountInCents = formatAmountForStripe(amount)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        bookingId: booking.id.toString(),
        bookingReference: booking.bookingReference,
        userId: user.id.toString(),
        bookingType: 'event',
        paymentType: 'initial',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Generate payment reference
    const paymentReference = PAYMENT_REFERENCE_STRING('event')

    // Create payment record
    const paymentRecord = await payload.create({
      collection: 'event_booking_payments',
      data: {
        paymentReference,
        booking: [Number(booking.id)],
        user: Number(user.id),
        amount,
        currency: 'USD',
        paymentStatus: 'pending',
        paymentMethod: 'card',
        stripeDetails: {
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: customerId,
          metadata: {
            paymentType: 'initial',
          },
        },
        notes: `Initial payment for booking ${booking.bookingReference}`,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: paymentRecord.id,
      amount,
      bookingReference: booking.bookingReference,
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
