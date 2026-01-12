import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/options'
import { CollectionSlug, getPayload } from 'payload'
import config from '@/payload.config'
import { EventBooking } from '@/payload-types'

// Helper function to check permissions
async function checkPermission(session: any, bookingId: string) {
  const payload = await getPayload({ config })
  if (!session?.user) {
    return { allowed: false, error: 'Authentication required', status: 401 }
  }

  const currentUser = session.user as { id: string; role: string; email: string }
  const isAdmin = currentUser.role === 'admin'

  // Admins always have access
  if (isAdmin) {
    return { allowed: true, currentUser }
  }

  // For non-admins, check if they own the booking
  try {
    const booking = (await payload.findByID({
      collection: 'event_bookings' as CollectionSlug,
      id: Number(bookingId),
      depth: 0, // No need for depth here, just checking ownership
    })) as EventBooking

    if (!booking) {
      return { allowed: false, error: 'Booking not found', status: 404 }
    }

    // Check if booking.user is an object or just an ID (number)
    const isOwner = booking?.user?.toString() == currentUser?.id

    if (!isOwner) {
      return { allowed: false, error: 'Unauthorized access', status: 403 }
    }

    return { allowed: true, currentUser, booking }
  } catch (error) {
    console.error('Error checking permissions:', error)
    return { allowed: false, error: 'Failed to verify permissions', status: 500 }
  }
}

// Get a specific booking by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  try {
    const { id: bookingId } = await params

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const permission = await checkPermission(session, bookingId)

    if (!permission.allowed) {
      return NextResponse.json({ error: permission.error }, { status: permission.status })
    }

    // Get payment status filter from query parameters
    const { searchParams } = new URL(req.url)
    const paymentStatusParam = searchParams.get('paymentStatus')

    // Parse payment status parameter - support comma-separated values
    const paymentStatusFilters = paymentStatusParam
      ? paymentStatusParam.split(',').map((s) => s.trim())
      : null

    // Get the booking data with detailed information
    const booking = await payload.findByID({
      collection: 'event_bookings',
      id: bookingId,
      depth: 3, // Load related fields with depth
    })

    // Build where condition for payments based on status filter
    const paymentsWhere: Record<string, any> = {
      booking: {
        equals: bookingId,
      },
    }

    // Apply payment status filter if provided
    if (paymentStatusFilters && paymentStatusFilters.length > 0) {
      if (paymentStatusFilters.length === 1) {
        // Single status filter
        paymentsWhere.paymentStatus = { equals: paymentStatusFilters[0] }
      } else {
        // Multiple status filters - use 'in' operator
        paymentsWhere.paymentStatus = { in: paymentStatusFilters }
      }
    }

    // Get related payment information with optional status filtering
    const payments = await payload.find({
      collection: 'event_booking_payments',
      where: paymentsWhere,
      sort: '-createdAt', // Get the most recent one first
    })

    const data = {
      booking,
      payments: payments?.docs || [],
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 })
  }
}

// Update a booking by ID
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  try {
    const { id: bookingId } = await params

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const permission = await checkPermission(session, bookingId)

    if (!permission.allowed) {
      return NextResponse.json({ error: permission.error }, { status: permission.status })
    }

    const currentUser = permission.currentUser
    const isAdmin = currentUser?.role === 'admin'
    const body = await req.json()

    // Restrict what fields regular users can update
    let updateData: any = {}

    if (isAdmin) {
      // Admins can update any field
      updateData = { ...body }
    } else {
      // Regular users can only update specific fields
      const allowedFields = ['notes', 'additionalRequests', 'contactInformation']
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      }
    }

    // Update the booking
    const updatedBooking = await payload.update({
      collection: 'event_bookings',
      id: bookingId,
      data: updateData,
      depth: 2,
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

// Delete a booking by ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  try {
    const { id: bookingId } = await params

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const permission = await checkPermission(session, bookingId)

    if (!permission.allowed) {
      return NextResponse.json({ error: permission.error }, { status: permission.status })
    }

    // Only admins can delete bookings
    const isAdmin = permission?.currentUser?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can delete bookings' },
        { status: 403 },
      )
    }

    // Delete the booking
    await payload.delete({
      collection: 'event_bookings',
      id: bookingId,
    })

    return NextResponse.json({ success: true, message: 'Booking successfully deleted' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
