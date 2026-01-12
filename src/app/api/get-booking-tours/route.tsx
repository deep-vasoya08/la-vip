import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateTourDates } from '@/utilities/tourScheduleUtils'
import { addHours } from 'date-fns'
import { type Tour } from '@/payload-types'

const payload = await getPayload({ config })

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all')

    // Build query configuration based on whether 'all' parameter is passed
    const queryConfig: any = {
      collection: 'tours',
      depth: 3,
      limit: 100,
      sort: 'name',
    }

    // If 'all' parameter is not passed, apply filtering for bookable tours only
    if (!all) {
      queryConfig.where = {
        isBookable: {
          equals: true,
        },
        // Ensure tours have proper RRULE configuration
        recurrence_rule: {
          exists: true,
        },
        tour_start_time: {
          exists: true,
        },
        booking_window_months: {
          exists: true,
        },
      }
    }

    // Get tours with the configured query
    const tours = (await payload.find(queryConfig)) as { docs: Tour[]; totalDocs: number }

    // If 'all' parameter is passed, return all tours without filtering
    if (all) {
      return NextResponse.json({
        success: true,
        tours: tours.docs,
        total: tours.totalDocs,
      })
    }

    // Filter tours that have future available dates based on RRULE
    const currentTime = new Date()
    const twoHoursFromNow = addHours(currentTime, 2)

    const availableTours = tours.docs.filter((tour) => {
      try {
        // Generate dates for this tour
        const config = {
          tour_start_time: tour.tour_start_time || '',
          tour_start_date: tour.tour_start_date || undefined,
          recurrence_rule: tour.recurrence_rule || '',
          booking_window_months: tour.booking_window_months || 0,
          schedule_notes: tour.schedule_notes || undefined,
        }

        const generatedDates = generateTourDates(config)

        // Check if tour has any dates at least 2 hours in the future
        return generatedDates.some((date) => {
          const tourDateTime = new Date(date.tour_date_time)
          return tourDateTime >= twoHoursFromNow
        })
      } catch (error) {
        console.error(`Error generating dates for tour ${tour.id}:`, error)
        return false
      }
    })

    return NextResponse.json({
      success: true,
      tours: availableTours,
      total: availableTours.length,
    })
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json({ error: 'Error fetching tours' }, { status: 500 })
  }
}
