import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/options'

export async function GET(request: NextRequest) {
  try {
    // Initialize Payload
    const session = await getServerSession(authOptions)
    const payload = await getPayload({
      config,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get status filter from query parameters
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    // Parse status parameter - support comma-separated values
    const statusFilters = statusParam ? statusParam.split(',').map((s) => s.trim()) : null

    try {
      // Build where condition based on status filter
      let eventBookingsWhere: Record<string, any> = {
        user: {
          equals: session?.user?.id,
        },
      }

      // If status filters are provided, filter by those statuses
      // Otherwise, exclude pending bookings by default
      if (statusFilters && statusFilters.length > 0) {
        if (statusFilters.length === 1) {
          // Single status filter
          eventBookingsWhere.status = { equals: statusFilters[0] }
        } else {
          // Multiple status filters - use 'in' operator
          eventBookingsWhere.status = { in: statusFilters }
        }
      } else {
        // Default behavior: exclude pending bookings
        eventBookingsWhere = {
          and: [
            {
              user: {
                equals: session?.user?.id,
              },
            },
            {
              status: {
                not_equals: 'pending',
              },
            },
          ],
        }
      }

      // Fetch bookings from the database using the provided userId
      const bookings = await payload.find({
        collection: 'event_bookings',
        where: eventBookingsWhere,
        depth: 2, // Get 1 level of relationships
        sort: '-createdAt',
      })

      // Build where condition for tour bookings based on status filter
      let tourBookingsWhere: Record<string, any> = {
        user: {
          equals: session?.user?.id,
        },
      }

      // Apply same status filter logic to tour bookings
      if (statusFilters && statusFilters.length > 0) {
        if (statusFilters.length === 1) {
          // Single status filter
          tourBookingsWhere.status = { equals: statusFilters[0] }
        } else {
          // Multiple status filters - use 'in' operator
          tourBookingsWhere.status = { in: statusFilters }
        }
      } else {
        // Default behavior: exclude pending bookings
        tourBookingsWhere = {
          and: [
            {
              user: {
                equals: session?.user?.id,
              },
            },
            {
              status: {
                not_equals: 'pending',
              },
            },
          ],
        }
      }

      const tourBookings = await payload.find({
        collection: 'tour_bookings',
        where: tourBookingsWhere,
        depth: 2, // Get 1 level of relationships
        sort: '-createdAt',
      })

      const processedBookings = bookings.docs
      const processedTourBookings = tourBookings.docs
      // console.log('processedBookings', processedBookings)

      return NextResponse.json({
        bookings: processedBookings,
        totalBookings: bookings.totalDocs,
        tourBookings: processedTourBookings,
        totalTourBookings: tourBookings.totalDocs,
      })
    } catch (dbError) {
      console.error('Error accessing bookings collection:', dbError)

      // If there's an error with the collection, return an empty result
      return NextResponse.json({
        bookings: [],
        totalBookings: 0,
        tourBookings: [],
        totalTourBookings: 0,
        message: 'No bookings found',
      })
    }
  } catch (error: unknown) {
    console.error('Error fetching user bookings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
