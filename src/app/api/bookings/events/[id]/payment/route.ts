import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/options'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: bookingId } = await params

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Fetch the booking first to verify user has access to it
    const booking = await payload.findByID({
      collection: 'event_bookings',
      id: bookingId,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify that the user has access to this booking
    // const userHasAccess =
    //   session.user.role === 'admin' ||
    //   booking.user?.id === Number(session.user.id) ||
    //   booking.bookedBy?.id === Number(session.user.id)

    // if (!userHasAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    // }

    // Find the payment associated with this booking
    const payments = await payload.find({
      collection: 'event_booking_payments',
      where: {
        booking: {
          equals: bookingId,
        },
      },
      limit: 1,
      sort: '-createdAt', // Get the most recent one first
    })

    const payment = payments.docs.length > 0 ? payments.docs[0] : null

    return NextResponse.json({
      payment,
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Failed to fetch payment information' }, { status: 500 })
  }
}
