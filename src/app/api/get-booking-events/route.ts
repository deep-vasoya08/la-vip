import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all')

    // Build query configuration based on whether 'all' parameter is passed
    const queryConfig: any = {
      collection: 'events',
      depth: 5,
      limit: 10000,
      sort: 'schedules.event_date_time',
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // If 'all' parameter is not passed, apply filtering for future events only
    if (!all) {
      queryConfig.where = {
        // only future schedule events not past event and also active event and also schedule is not empty and also 2 hour before event
        'schedules.event_date_time': {
          greater_than_equal: startOfToday.toUTCString(),
          less_than_equal: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString(),
        },
        'schedules.schedule_status': {
          not_in: ['cancelled', 'completed'],
        },
      }
    }

    // Fetch events with the configured query
    let { docs: events } = await payload.find(queryConfig)

    // Filter out pickups with expired hotel partnerships from schedules
    events = events.map((event: any) => ({
      ...event,
      schedules: event?.schedules?.map((schedule: any) => ({
        ...schedule,
        pickups: schedule?.pickups?.filter((pickup: any) => {
          const hotel = pickup?.hotel
          if (!hotel || typeof hotel !== 'object') return true // Keep if no hotel or hotel is just ID
          // Compare hotel partnerValidTill with the specific schedule date, not current date
          return (
            !hotel.partnerValidTill ||
            new Date(hotel.partnerValidTill) > new Date(schedule.event_date_time)
          )
        }),
      })),
    }))

    return NextResponse.json({
      success: true,
      events: events,
      total: events.length,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Error fetching events' }, { status: 500 })
  }
}
