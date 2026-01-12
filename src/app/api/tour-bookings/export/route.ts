import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  getTourSelectedScheduleTime,
  getTourSelectedPickupLocationName,
  getTourSelectedPickupTime,
} from '@/utilities/tourBookingUtils'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)

    // Extract filter parameters from query string
    const tourId = searchParams.get('tourId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const bookingStatus = searchParams.get('bookingStatus')

    // Build where clause based on filters
    const whereClause: any = {}

    if (tourId) {
      whereClause.tour = { equals: tourId }
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

    // Get tour bookings with applied filters
    const tourBookings = await payload.find({
      collection: 'tour_bookings',
      depth: 3, // Increased depth to get tour and hotel info
      limit: 10000,
      sort: '-createdAt',
      where: whereClause,
    })

    const filteredBookings = tourBookings.docs

    // Transform data for CSV export
    const csvData = filteredBookings.map((booking, index) => {
      const tour = booking.tour as any
      const user = booking.user as any
      const bookedBy = booking.bookedBy as any

      // Use utility functions to get actual readable data instead of IDs
      const scheduleDateTime = getTourSelectedScheduleTime(booking, true)
      const pickupLocationName = getTourSelectedPickupLocationName(booking)
      const pickupTime = getTourSelectedPickupTime(booking)

      return {
        // 1. Index
        Index: index + 1,

        // 2. Tour Name
        'Tour Name': tour?.name || 'N/A',

        // 3. Tour Schedule Date & Time
        'Tour Schedule Date & Time': scheduleDateTime,

        // 4. User Name
        'User Name': user?.name || 'N/A',

        // 5. User Phone Number
        'User Phone Number': user?.phoneNumber || 'N/A',

        // 6. User Email
        'User Email': user?.email || 'N/A',

        // 7. Total Guests
        'Total Guests': (booking.adultCount || 0) + (booking.childCount || 0),

        // 8. Hotel Name & Location
        'Hotel Name & Location': pickupLocationName,

        // 9. Hotel Pickup Time
        'Hotel Pickup Time': pickupTime,

        // 10. Rest of data as it is
        'Booking Reference': booking.bookingReference,

        // 11. Tour Status
        'Tour Status': tour?.status || 'N/A',

        // 12. Booked By Email
        'Booked By Email': bookedBy?.email || 'N/A',

        // 13. Booked By Name
        'Booked By Name': bookedBy?.name || 'N/A',

        // 14. Adult Count & Child Count
        'Adult Count': booking.adultCount || 0,
        'Child Count': booking.childCount || 0,

        // 15. Booking Status
        'Booking Status': booking.status || 'N/A',

        // 16. Adult Price & Child Price
        'Adult Price': booking.pricing?.adultPrice || 0,
        'Child Price': booking.pricing?.childrenPrice || 0,
        'Total Amount': booking.pricing?.totalAmount || 0,
        Currency: booking.pricing?.currency || 'USD',

        // 17. Tour Duration
        'Tour Duration': tour?.duration || 'N/A',

        // 18. Tour Type
        'Tour Type': tour?.tour_type || 'N/A',

        // 19. Created Date
        'Created Date': booking.createdAt
          ? new Date(booking.createdAt).toLocaleDateString()
          : 'N/A',

        // 20. Scheduled Date
        'Scheduled Date': booking.scheduledDate
          ? new Date(booking.scheduledDate).toLocaleDateString()
          : 'N/A',
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
    let filename = `tour-bookings-${new Date().toISOString().split('T')[0]}`
    if (tourId) {
      const selectedTour = filteredBookings[0]?.tour as any
      if (selectedTour?.name) {
        filename += `-${selectedTour.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
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
    console.error('Error exporting tour bookings:', error)
    return NextResponse.json({ error: 'Failed to export tour bookings' }, { status: 500 })
  }
}
