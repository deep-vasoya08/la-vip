import React, { cache } from 'react'
import PageClient from './page.client'
import EventDetailsHero from '@/heros/EventDetailsHero'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { redirect } from 'next/navigation'
import { Metadata, ResolvingMetadata } from 'next'
import { cleanDescription, formatDuration } from '@/utilities/seoHelpers'
import { generateEventMerchantSchema } from '@/utilities/merchantStructuredData'
import { Hotel, type Page } from '@/payload-types'
import GA4EventTracker from '@/components/GA4EventTracker'
import { PayloadRedirects } from '@/components/PayloadRedirects'
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    eventString?: string
  }>
}

type MetadataProps = {
  params: Promise<{ eventString?: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(
  { params }: MetadataProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Get the event ID from the URL parameter
  const { eventString } = await params
  const eventStringSafe = eventString || ''
  const id = Number(eventStringSafe.split('-')[0] ?? '')

  // Fetch event data
  const payload = await getPayload({ config: configPromise })
  const { docs: events } = await payload.find({
    collection: 'events',
    depth: 2,
    where: {
      id: {
        equals: id,
      },
    },
  })

  const event = events[0] || null

  // Previous metadata from parent layouts
  const previousImages = (await parent).openGraph?.images || []

  if (!event) {
    return {
      title: 'Event Not Found - LA VIP Tours',
      description:
        'The requested event could not be found. Explore our other exciting Los Angeles events.',
      robots: 'noindex, nofollow',
    }
  }

  // Extract event information for metadata
  const title = event.name || 'Exclusive LA Event'
  const description =
    cleanDescription(event.description) ||
    `Experience ${title} with LA VIP Tours - Premium event experience in Los Angeles`

  // Get venue information
  const venueName =
    event.venue && typeof event.venue === 'object' ? event.venue.name : 'Los Angeles'
  const venueAddress =
    event.venue && typeof event.venue === 'object' ? event.venue.address : 'Los Angeles, CA'
  const venueCity =
    event.venue && typeof event.venue === 'object' ? event.venue.city : 'Los Angeles'

  // Generate image URL if available
  let imageUrl = ''
  let imageAlt = ''
  if (
    event?.eventAvatarImage &&
    typeof event.eventAvatarImage === 'object' &&
    event.eventAvatarImage.url
  ) {
    imageUrl = event.eventAvatarImage.url
    imageAlt = event.eventAvatarImage.alt || `${title} - LA VIP Tours`
  }

  // Get pricing information for structured data
  const startingPrice = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
  const currency = 'USD'

  // Date formatting for structured data
  const eventStartDate = event.schedules?.[0]?.event_date_time
    ? new Date(event.schedules[0].event_date_time).toISOString()
    : undefined

  const eventEndDate =
    eventStartDate && event.duration_hours
      ? new Date(
          new Date(eventStartDate).getTime() + event.duration_hours * 60 * 60 * 1000,
        ).toISOString()
      : undefined

  // Generate duration text using helper
  const durationText = event.duration_hours ? formatDuration(event.duration_hours) : undefined

  // Create rich title and description
  const seoTitle = `${title} | Exclusive LA VIP Events`
  const seoDescription = `${description} ${durationText ? `Duration: ${durationText}.` : ''} ${venueName ? `Location: ${venueName}.` : ''} ${startingPrice > 0 ? `Starting from $${startingPrice}.` : ''} Book your premium Los Angeles event experience.`

  return {
    title: seoTitle,
    description: seoDescription.slice(0, 160), // Ensure under 160 chars
    keywords: [
      'Los Angeles events',
      'VIP events LA',
      'exclusive events',
      'LA entertainment',
      'luxury events',
      title,
      'private events',
      'celebrity events',
      'premium experiences',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      url: `/events/${eventString}`,
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: imageAlt,
              type: 'image/jpeg',
            },
            ...previousImages,
          ]
        : previousImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: seoTitle,
      description: seoDescription,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: imageAlt,
            },
          ]
        : [],
    },
    alternates: {
      canonical: `/events/${eventString}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Add structured data for events
    other: {
      'script:ld+json': JSON.stringify([
        // Merchant Product Schema (for Google Merchant listings)
        generateEventMerchantSchema(event, eventStringSafe),
        // Event Schema (for event-specific information)
        {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: title,
          description: seoDescription,
          image: imageUrl || undefined,
          startDate: eventStartDate,
          endDate: eventEndDate,
          duration: durationText ? `PT${event.duration_hours}H` : undefined,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: venueName,
            address: {
              '@type': 'PostalAddress',
              streetAddress: venueAddress,
              addressLocality: venueCity,
              addressRegion: 'California',
              addressCountry: 'United States',
              postalCode: '90210',
            },
          },
          organizer: {
            '@type': 'Organization',
            name: 'LA VIP Tours',
            url: 'https://laviptours.com',
            logo: {
              '@type': 'ImageObject',
              url: 'https://laviptours.com/logo.png',
            },
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Los Angeles',
              addressRegion: 'California',
              addressCountry: 'United States',
            },
            telephone: '+1-XXX-XXX-XXXX',
            email: 'info@laviptours.com',
          },
          offers: {
            '@type': 'Offer',
            name: `${title} Event Ticket`,
            description: description,
            price: startingPrice > 0 ? startingPrice.toString() : undefined,
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
            url: `/events/${eventString}`,
            validFrom: new Date().toISOString(),
            priceValidUntil:
              eventStartDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Event date or 30 days from now
            category: 'Entertainment',
          },
          performer: {
            '@type': 'Organization',
            name: 'LA VIP Tours',
            url: 'https://laviptours.com',
          },
          audience: {
            '@type': 'Audience',
            audienceType: 'Riders and Families',
          },
        },
        // Organization Schema
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'LA VIP Tours',
          url: 'https://laviptours.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://laviptours.com/logo.png',
          },
          description:
            'Premier VIP event and tour operator in Los Angeles offering exclusive, luxury experiences.',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Los Angeles',
            addressRegion: 'California',
            addressCountry: 'United States',
          },
          sameAs: [
            'https://www.facebook.com/LAVIPTours',
            'https://www.instagram.com/LAVIPTours',
            'https://www.twitter.com/LAVIPTours',
          ],
        },
        // BreadcrumbList Schema
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://laviptours.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Events',
              item: 'https://laviptours.com/events',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: title,
              item: `https://laviptours.com/events/${eventString}`,
            },
          ],
        },
      ]),
    },
  }
}

export default async function Page({ params: paramsPromise }: Args) {
  const { eventString } = await paramsPromise
  const id = Number(eventString?.split('-')[0] ?? '')

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  twoDaysAgo.setHours(0, 0, 0, 0)

  const payload = await getPayload({ config: configPromise })
  let { docs: events } = await payload.find({
    collection: 'events',
    depth: 5,
    sort: 'schedules.event_date_time',
    limit: 10000,

    // only last 2 days schedule events
    where: {
      status: {
        // equals: 'active',
      },
      'schedules.event_date_time': {
        greater_than_equal: twoDaysAgo.toUTCString(),
        // less_than_equal: now.toUTCString(),
      },
      'schedules.schedule_status': {
        not_in: ['cancelled', 'completed'],
      },
    },
  })

  // Filter out pickups with expired hotel partnerships from schedules
  events = events.map((event) => ({
    ...event,
    schedules: event.schedules?.map((schedule) => ({
      ...schedule,
      pickups: schedule.pickups?.filter((pickup) => {
        const hotel = pickup.hotel
        if (!hotel || typeof hotel !== 'object') return true // Keep if no hotel or hotel is just ID
        // Compare hotel partnerValidTill with the specific schedule date, not current date
        return (
          !hotel.partnerValidTill ||
          new Date(hotel.partnerValidTill) > new Date(schedule.event_date_time)
        )
      }),
    })),
  }))

  // here also add an filter which pickup times is in past remove that pickup time and another full data put as it is
  events = events.map((event) => ({
    ...event,
    schedules: event.schedules?.map((schedule) => ({
      ...schedule,
      pickups: schedule.pickups?.map((pickup) => ({
        ...pickup,
        pickup_times: pickup.pickup_times?.filter((time) => {
          return new Date(time.time) > new Date()
        }),
      })),
    })),
  }))

  const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft: false,
      limit: 1,
      pagination: false,
      overrideAccess: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  })

  const event = events.find((event) => event.id === id) || null

  // Use type guards to check if value has a slug property
  const refValue = event?.eventDetailsPageLink?.link?.reference?.value
  const slug =
    refValue && typeof refValue === 'object' && 'slug' in refValue ? refValue.slug : 'event-details'

  const page = await queryPageBySlug({
    slug: slug ? slug : 'event-details',
  })

  if (!page) {
    return redirect('/events')
  }

  if (!event) {
    return redirect('/events')
  }

  // Step 1: Get ALL hotels from ALL event schedules and their pickups
  const allPickupsFromAllSchedules =
    event.schedules?.flatMap((schedule) => schedule.pickups || []) || []

  // Step 2: Extract unique hotels from all pickups
  const uniqueHotelsMap = new Map<number, Hotel>()

  allPickupsFromAllSchedules.forEach((pickup) => {
    if (pickup?.hotel && typeof pickup.hotel === 'object') {
      const hotel = pickup.hotel as Hotel
      const hotelId = Number(hotel.id) || 0
      if (hotelId > 0 && !uniqueHotelsMap.has(hotelId)) {
        uniqueHotelsMap.set(hotelId, hotel)
      }
    }
  })

  // Step 3: Convert to hotel servicing list format and sort by priority
  const hotelServicingList = Array.from(uniqueHotelsMap.values())
    .map((hotel) => ({
      id: Number(hotel.id) || 0,
      name: hotel.name || '',
      logo: hotel.images || 0,
      isActive: true,
      updatedAt: hotel.updatedAt || '',
      createdAt: hotel.createdAt || '',
      priority: hotel.priority || 50, // Default to 50 if priority not set
    }))
    .sort((a, b) => a.priority - b.priority) // Sort by priority (ascending: 1 = highest priority)

  const hotelServicingBlock = {
    id: 'hotel-servicing',
    blockType: 'hotelServicing',
    heading: 'Servicing',
    headingTextColor: 'text-gray',
    // subheading: 'Hotel Servicing',
    // subheadingTextColor: 'text-gray',
    selectedHotels: hotelServicingList.map((hotel) => ({ id: hotel.id })),
  }

  // Build Custom Media Block from selected event images
  const eventImagesMediaItems = (event.eventImages || [])
    .map((img) => (typeof img === 'object' && img && 'image' in img ? img.image : null))
    .filter(Boolean)
    .map((media) => ({ media }))

  const customMediaBlock = {
    id: 'event-media',
    blockType: 'customMediaBlock',
    title: undefined,
    subtitle: undefined,
    mediaItems: eventImagesMediaItems,
    imageSpacing: 2,
    backgroundColor: 'bg-white' as const,
    viewType: 'carousel' as const,
    itemsPerRow: '4' as const,
    buttonText: undefined,
    buttonLink: undefined,
  }

  // Create new layout with hotelPartnerBlock at index 1 and customMediaBlock at index 2
  const newLayout = [
    page?.layout?.[0],
    customMediaBlock,
    hotelServicingBlock,
    ...(page?.layout?.slice(1) || []),
  ].filter(Boolean) // Remove any undefined values

  return (
    <article>
      <GA4EventTracker event={event} />
      <PageClient />
      {event && <EventDetailsHero events={events} selectedEventId={event.id} />}
      {/* <RenderBlocks blocks={event.blocks} /> */}
      <RenderBlocks blocks={newLayout as Page['layout']} />
    </article>
  )
}
