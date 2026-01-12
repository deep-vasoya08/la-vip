import type { Metadata } from 'next/types'

// import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import CustomMediaBlock from '@/blocks/CustomMediaBlock/Component'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Event } from '@/payload-types'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  // here write search on event an tour both collection
  const events = await payload.find({
    collection: 'events',
    depth: 2,
    limit: 8,
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          'schedules.event_date_time': {
            greater_than_equal: new Date().toUTCString(),
            less_than_equal: new Date(
              new Date().getTime() + 365 * 24 * 60 * 60 * 1000,
            ).toUTCString(),
          },
        },
        {
          'schedules.schedule_status': {
            not_in: ['cancelled', 'completed'],
          },
        },
        ...(query
          ? [
              {
                name: {
                  like: query,
                },
              },
            ]
          : []),
      ],
    },
  })

  // const tours = await payload.find({
  //   collection: 'tours',
  //   depth: 2,
  //   limit: 8,
  //   ...(query
  //     ? {
  //         where: {
  //           or: [
  //             {
  //               name: {
  //                 like: query,
  //               },
  //             },
  //           ],
  //         },
  //       }
  //     : {}),
  // })
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

  return (
    <div className="pt-24 pb-24 bg-beige">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16 font-semplicita font-bold text-black">Search Events</h1>

          <div className="max-w-[46rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {/* Events Section */}
      {events.docs.length > 0 && (
        <div className="pb-16 bg-white">
          <CustomMediaBlock
            title="Events"
            mediaItems={events?.docs?.map((event) => ({
              id: createEventURL(event),
              media: event.eventAvatarImage,
              isEventItem: true,
              eventTitle: event.name,
              eventDate: event?.schedules?.[0]?.event_date_time
                ? formatDateTime(event?.schedules?.[0]?.event_date_time)
                : '',
              eventPlace:
                typeof event.venue === 'object' && event.venue !== null
                  ? event.venue.name
                  : String(event.venue),
            }))}
            viewType="grid"
            itemsPerRow="4"
            blockType={'customMediaBlock'}
            backgroundColor="bg-white"
          />
        </div>
      )}

      {/* Tours Section */}
      {/* {tours.docs.length > 0 && (
        <div className="pb-16 bg-white">
          <CustomMediaBlock
            title="Tours"
            mediaItems={tours?.docs?.map((tour) => ({
              id: tour.id.toString(),
              media: tour.tourAvatarImage,
              isEventItem: false,
              isTourItem: true,
              overlayText: tour.name,
              tourName: tour.name,
              eventDate: 'Multiple dates available',
            }))}
            viewType="grid"
            itemsPerRow="auto"
            blockType={'customMediaBlock'}
            backgroundColor="bg-white"
          />
        </div>
      )} */}

      {/* No Results Message */}
      {events.docs.length === 0 && query && (
        <div className="container text-center">
          <h3 className="text-xl font-semplicita text-black mb-4">No results found</h3>
          <p className="text-black">Try searching with different keywords or browse our events.</p>
        </div>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `LA VIP Tours & Charters Search`,
  }
}
