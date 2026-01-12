import React from 'react'
import { EventListConfig, Event } from '@/payload-types'
import CustomMediaBlock from '../CustomMediaBlock/Component'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { formatDateTime } from '@/utilities/formatDateTime'

export const EventList: React.FC<EventListConfig> = async ({
  title,
  subtitle,
  backgroundColor,
  // imageSpacing = 0,
  viewType,
  itemsPerRow = 'auto',
  buttonText,
  selectedEvents,
  category,
  // blockType,
}) => {
  const payload = await getPayload({ config: configPromise })
  let events

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // If selectedEvents are provided, fetch only those specific events
  if (selectedEvents && Array.isArray(selectedEvents) && selectedEvents.length > 0) {
    // Extract IDs from the selectedEvent array
    const eventIds = selectedEvents?.map((event) =>
      typeof event === 'object' && event !== null ? event.id : event,
    )
    events = await payload.find({
      collection: 'events',
      depth: 2,
      limit: 10000,
      // sort by schedules.event_date_time upcoming first is sort ascending
      sort: 'schedules.event_date_time',
      where: {
        status: {
          equals: 'active',
        },
        'schedules.event_date_time': {
          greater_than_equal: startOfToday.toUTCString(),
          less_than_equal: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString(),
        },
        id: {
          in: eventIds,
        },
        ...(category
          ? {
              category: {
                equals: typeof category === 'object' && category !== null ? category.id : category,
              },
            }
          : {}),
      },
    })
  } else {
    // Otherwise fetch all future events as before
    events = await payload.find({
      collection: 'events',
      depth: 3,
      limit: 10000,
      // sort by schedules.event_date_time upcoming first is sort ascending
      sort: 'schedules.event_date_time',
      // only future schedule events not past event and also active event and also schedule is not empty and also 2 hour before event
      where: {
        status: {
          equals: 'active',
        },
        'schedules.event_date_time': {
          greater_than_equal: startOfToday.toUTCString(),
          less_than_equal: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toUTCString(),
        },
        'schedules.schedule_status': {
          not_in: ['cancelled', 'completed'],
        },
        ...(category
          ? {
              category: {
                equals: typeof category === 'object' && category !== null ? category.id : category,
              },
            }
          : {}),
      },
    })
  }

  // event limit 8
  // events.docs = events.docs.slice(0, 8)

  const createEventURL = (event: Event) => {
    // Convert id to string, ensure name exists, create proper URL slug
    const id = event?.id?.toString() || ''
    const name = event?.name || ''
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single one

    return `${id}-${slug}` // Format: id-slug
  }

  const createEventDate = (event: Event) => {
    const eventDates = event?.schedules?.map((schedule) =>
      formatDateTime(schedule.event_date_time, false, false, false, true).replace(' PST', ''),
    )
    return (
      eventDates?.join(', ') +
      ' @ ' +
      formatDateTime(event?.schedules?.[0]?.event_date_time || '', true, true, true)
    )
  }

  return (
    <CustomMediaBlock
      title={title || ''}
      subtitle={subtitle || ''}
      mediaItems={events?.docs?.map((event) => ({
        id: createEventURL(event),
        media: event.eventAvatarImage,
        isEventItem: true,
        eventTitle: event.name,
        eventDate: createEventDate(event),
        eventPlace:
          typeof event.venue === 'object' && event.venue !== null
            ? event.venue.name
            : String(event.venue),
      }))}
      // imageSpacing={imageSpacing}
      backgroundColor={backgroundColor}
      viewType={viewType}
      itemsPerRow={itemsPerRow}
      buttonText={buttonText}
      blockType={'customMediaBlock'}
    />
  )
}
