import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import stripe from '@/lib/stripe'
import { formatAmountForStripe } from '@/lib/stripe-helpers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { CollectionSlug } from 'payload'
import { authOptions } from '../../auth/options'
import { PAYMENT_REFERENCE_STRING } from '@/utilities/constant'

const payload = await getPayload({ config })

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await req.json()
    const { bookingId, amount } = data

    if (!bookingId || !amount) {
      return NextResponse.json({ error: 'Booking ID and amount are required' }, { status: 400 })
    }

    // Get booking information
    const booking = await payload.findByID({
      collection: 'event_bookings',
      id: bookingId,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get user details
    const userId =
      typeof booking.user === 'object' && booking.user
        ? booking.user.id
        : booking.user || session.user.id
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      })

      customerId = customer.id

      // Update user with stripe customer ID
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          stripeCustomerId: customerId,
        },
      })
    }

    // Format amount for Stripe (convert to cents)
    const amountInCents = formatAmountForStripe(amount)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        bookingId,
        bookingReference: booking.bookingReference,
        userId: user.id,
        bookingType: 'event',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Generate a unique payment reference
    const paymentReference = PAYMENT_REFERENCE_STRING('event')

    // Create payment record
    const paymentRecord = await payload.create({
      collection: 'event_booking_payments' as CollectionSlug,
      data: {
        paymentReference,
        booking: [Number(bookingId)],
        user: Number(user.id),
        amount,
        currency: 'USD',
        paymentStatus: 'pending',
        paymentMethod: 'card',
        stripeDetails: {
          stripePaymentIntentId: paymentIntent.id,
          stripeCustomerId: customerId,
        },
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: paymentRecord.id,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Error creating payment intent' }, { status: 500 })
  }
}
