import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  getEventSelectedScheduleTime,
  getEventSelectedPickupLocationName,
  getEventSelectedPickupTime,
} from '@/utilities/eventBookingUtils'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)

    // Extract filter parameters from query string
    const eventId = searchParams.get('eventId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const bookingStatus = searchParams.get('bookingStatus')
    const venueId = searchParams.get('venueId')

    // Build where clause based on filters
    const whereClause: any = {}

    if (eventId) {
      whereClause.event = { equals: eventId }
    }

    if (bookingStatus) {
      whereClause.status = { equals: bookingStatus }
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.greater_than_equal = new Date(dateFrom).toISOString()
      }
      if (dateTo) {
        // Add one day to include the entire dateTo day
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        whereClause.createdAt.less_than = endDate.toISOString()
      }
    }

    // Get event bookings with applied filters
    const eventBookings = await payload.find({
      collection: 'event_bookings',
      depth: 3, // Increased depth to get venue info through event
      limit: 10000,
      sort: '-createdAt',
      where: whereClause,
    })

    // Additional filtering for venue and schedule status (done in memory since these are nested fields)
    let filteredBookings = eventBookings.docs

    if (venueId && filteredBookings.length > 0) {
      filteredBookings = filteredBookings.filter((booking) => {
        const event = booking.event as any
        return event && event.venue && event.venue.id === venueId
      })
    }

    // Note: Schedule status filtering would require additional logic to match against event schedules
    // This is more complex as it involves matching booking scheduleId with event.schedules array

    // Transform data for CSV export
    const csvData = filteredBookings.map((booking, index) => {
      const event = booking.event as any
      const user = booking.user as any
      const bookedBy = booking.bookedBy as any

      // Use utility functions to get actual readable data instead of IDs
      const scheduleDateTime = getEventSelectedScheduleTime(booking, true)
      const pickupLocationName = getEventSelectedPickupLocationName(booking)
      const pickupTime = getEventSelectedPickupTime(booking)

      return {
        // 1. Index
        Index: index + 1,

        // 2. Event Name
        'Event Name': event?.name || 'N/A',

        // 3. Event Schedule Date & Time
        'Event Schedule Date & Time': scheduleDateTime,

        // 4. Event Venue
        'Event Venue': event?.venue?.name || 'N/A',

        // 5. User Name
        'User Name': user?.name || 'N/A',

        // 6. User Phone Number
        'User Phone Number': user?.phoneNumber || 'N/A',

        // 7. User Email
        'User Email': user?.email || 'N/A',

        // 8. Total Guests
        'Total Guests': (booking.adultCount || 0) + (booking.childCount || 0),

        // 9. Hotel Name & Location
        'Hotel Name & Location': pickupLocationName,

        // 10. Hotel Pickup Time
        'Hotel Pickup Time': pickupTime,

        // 11. Rest of data as it is
        'Booking Reference': booking.bookingReference,

        // 12. Event Status
        'Event Status': event?.status || 'N/A',

        // 13. Booked By Email
        'Booked By Email': bookedBy?.email || 'N/A',

        // 14. Booked By Name
        'Booked By Name': bookedBy?.name || 'N/A',

        // 15. Adult Count & Child Count
        'Adult Count': booking.adultCount || 0,
        'Child Count': booking.childCount || 0,

        // 16. Booking Status
        'Booking Status': booking.status || 'N/A',

        // 17. Adult Price & Child Price
        'Adult Price': booking.pricing?.adultPrice || 0,
        'Child Price': booking.pricing?.childrenPrice || 0,
        'Total Amount': booking.pricing?.totalAmount || 0,
        Currency: booking.pricing?.currency || 'USD',
      }
    })

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) =>
        headers.map((header) => JSON.stringify(row[header as keyof typeof row] || '')).join(','),
      ),
    ].join('\n')

    // Generate filename with filter info
    let filename = `event-bookings-${new Date().toISOString().split('T')[0]}`
    if (eventId) {
      const selectedEvent = filteredBookings[0]?.event as any
      if (selectedEvent?.name) {
        filename += `-${selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
      }
    }
    if (dateFrom && dateTo) {
      filename += `-${dateFrom}-to-${dateTo}`
    } else if (dateFrom) {
      filename += `-from-${dateFrom}`
    } else if (dateTo) {
      filename += `-until-${dateTo}`
    }
    filename += `.csv`

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting event bookings:', error)
    return NextResponse.json({ error: 'Failed to export event bookings' }, { status: 500 })
  }
}
