import React, { cache } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Metadata, ResolvingMetadata } from 'next'
import TourDetailsHero from '@/heros/TourDetailsHero'
import { formatDuration } from '@/utilities/seoHelpers'
import { generateTourMerchantSchema } from '@/utilities/merchantStructuredData'
import { type Page, type Hotel, type Media } from '@/payload-types'
import { generateTourDates } from '@/utilities/tourScheduleUtils'
import { addHours } from 'date-fns'
import { formatTourDataForBookingForm } from '@/utilities/tourBookingUtils'
import GA4EventTracker from '@/components/GA4EventTracker'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    tourString?: string
  }>
}

type MetadataProps = {
  params: Promise<{ tourString?: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(
  { params }: MetadataProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Get the tour ID from the URL parameter
  const { tourString } = await params
  const tourStringSafe = tourString || ''
  const id = Number(tourStringSafe.split('-')[0] ?? '')

  // Fetch tour data
  const payload = await getPayload({ config: configPromise })
  const { docs: tours } = await payload.find({
    collection: 'tours',
    depth: 2,
    sort: 'name',
    where: {
      id: {
        equals: id,
      },
    },
  })

  const tour = tours[0] || null

  // Previous metadata from parent layouts
  const previousImages = (await parent).openGraph?.images || []

  if (!tour) {
    return {
      title: 'Tour Not Found - LA VIP Tours',
      description:
        'The requested tour could not be found. Explore our other amazing Los Angeles tours.',
      robots: 'noindex, nofollow',
    }
  }

  // Extract tour information for metadata
  const title = tour.name || 'Exclusive LA Tour'
  const shortDescription = tour.shortDescription || `Experience ${title} with LA VIP Tours`
  // const description = cleanDescription(tour.description) || shortDescription

  // Generate image URL if available
  let imageUrl = ''
  let imageAlt = ''
  if (
    tour?.tourAvatarImage &&
    typeof tour.tourAvatarImage === 'object' &&
    tour.tourAvatarImage.url
  ) {
    imageUrl = tour.tourAvatarImage.url
    imageAlt = tour.tourAvatarImage.alt || `${title} - LA VIP Tours`
  }

  // Get pricing information for structured data
  const startingPrice = tour.pickups?.[0]?.adult_price || 0
  const currency = 'USD'

  // Date formatting for structured data - use tour_start_date or current date for availability
  const tourStartDate = tour.tour_start_date
    ? new Date(tour.tour_start_date).toISOString()
    : new Date().toISOString()

  // Generate duration text using helper
  const durationHoursValue = (tour as unknown as { duration_hours?: number }).duration_hours
  const durationText =
    typeof durationHoursValue === 'number' ? formatDuration(durationHoursValue) : undefined

  // Create itinerary for structured data
  const itineraryStops =
    tour.itinerary?.map((stop, index) => ({
      '@type': 'TouristAttraction',
      name: stop.title,
      description: typeof stop.description === 'string' ? stop.description : stop.title,
      image: typeof stop.image === 'object' && stop.image?.url ? stop.image.url : undefined,
      position: index + 1,
    })) || []

  // Create rich title and description
  const seoTitle = `${title} | Premium LA VIP Tours`
  const seoDescription = `${shortDescription} ${durationText ? `Duration: ${durationText}.` : ''} ${startingPrice > 0 ? `Starting from $${startingPrice}.` : ''} Book your exclusive Los Angeles tour experience today.`

  return {
    title: seoTitle,
    description: seoDescription.slice(0, 160), // Ensure under 160 chars
    keywords: [
      'Los Angeles tours',
      'VIP tours LA',
      'private tours',
      'LA attractions',
      'luxury tours',
      title,
      'Hollywood tours',
      'Beverly Hills tours',
      'celebrity tours',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'website',
      url: `/tours/${tourString}`,
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
      canonical: `/tours/${tourString}`,
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
    // Add structured data for tours
    other: {
      'script:ld+json': JSON.stringify([
        // Merchant Product Schema (for Google Merchant listings)
        generateTourMerchantSchema(tour, tourStringSafe),
        // TouristTrip Schema (for tour-specific information)
        {
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: title,
          description: seoDescription,
          image: imageUrl || undefined,
          startDate: tourStartDate,
          location: {
            '@type': 'City',
            name: 'Los Angeles',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Los Angeles',
              addressRegion: 'California',
              addressCountry: 'United States',
              postalCode: '90210',
            },
          },
          provider: {
            '@type': 'TourOperator',
            name: 'LA VIP Tours',
            url: 'https://laviptours.com',
            logo: 'https://laviptours.com/logo.png',
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
            name: `${title} Tour Package`,
            description: shortDescription,
            price: startingPrice > 0 ? startingPrice.toString() : undefined,
            priceCurrency: currency,
            availability: 'https://schema.org/InStock',
            url: `/tours/${tourString}`,
            validFrom: new Date().toISOString(),
            priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          },
          itinerary: itineraryStops.length > 0 ? itineraryStops : undefined,
          includesObject:
            tour.itinerary?.map((stop) => ({
              '@type': 'Thing',
              name: stop.title,
            })) || undefined,
        },
        // Organization Schema
        {
          '@context': 'https://schema.org',
          '@type': 'TourOperator',
          name: 'LA VIP Tours',
          url: 'https://laviptours.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://laviptours.com/logo.png',
          },
          description:
            'Premier VIP tour operator in Los Angeles offering exclusive, luxury tour experiences.',
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
              name: 'Tours',
              item: 'https://laviptours.com/tours',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: title,
              item: `https://laviptours.com/tours/${tourString}`,
            },
          ],
        },
      ]),
    },
  }
}

export default async function Page({ params: paramsPromise }: Args) {
  const { tourString } = await paramsPromise
  const id = Number(tourString?.split('-')[0] ?? '')
  const payload = await getPayload({ config: configPromise })
  // Get all bookable tours - filtering will be done based on RRULE generation
  const { docs: allTours } = await payload.find({
    collection: 'tours',
    depth: 3,
    limit: 100,
    sort: 'name',
    where: {
      isBookable: {
        equals: true,
      },
    },
  })

  // Filter tours with valid future dates
  const currentTime = new Date()
  const twoHoursFromNow = addHours(currentTime, 2)

  const tours = allTours.filter((tour) => {
    if (!tour.recurrence_rule || !tour.tour_start_time || !tour.booking_window_months) {
      return false
    }

    try {
      const config = {
        tour_start_time: tour.tour_start_time,
        tour_start_date: tour.tour_start_date || undefined,
        recurrence_rule: tour.recurrence_rule,
        booking_window_months: tour.booking_window_months,
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

  const tour = tours.find((tour) => tour.id === Number(id)) || null

  //   Use type guards to check if value has a slug property
  const refValue = tour?.tourDetailsPageLink?.link?.reference?.value
  const slug =
    refValue && typeof refValue === 'object' && 'slug' in refValue ? refValue.slug : 'tour-details'

  const page = await queryPageBySlug({
    slug: slug ? slug : 'tour-details',
  })

  if (!page) {
    return redirect('/tours')
  }

  if (!tour) {
    return redirect('/tours')
  }

  // Use the updated utility function to format tour data with RRULE-based schedules
  const toursData = formatTourDataForBookingForm(tours)

  // Build servicing hotel list from tour pickups (preserve pickup order, dedupe by first appearance)
  const hotelList = tour.pickups || []
  const seenHotelIds = new Set<number>()
  const hotelServicingList = hotelList
    .filter((pickup) => pickup?.hotel)
    .reduce<
      Array<{
        id: number
        name: string
        logo: number | Media
        isActive: boolean
        updatedAt: string
        createdAt: string
        priority: number
      }>
    >((acc, pickup) => {
      const hotelRef = pickup.hotel as number | Hotel
      const hotelId = Number(typeof hotelRef === 'number' ? hotelRef : hotelRef.id) || 0
      if (hotelId === 0 || seenHotelIds.has(hotelId)) return acc

      const name = typeof hotelRef === 'number' ? '' : hotelRef.name || ''
      const logo = (typeof hotelRef === 'number' ? hotelRef : hotelRef.images) as number | Media
      const updatedAt = typeof hotelRef === 'number' ? '' : (hotelRef.updatedAt as string) || ''
      const createdAt = typeof hotelRef === 'number' ? '' : (hotelRef.createdAt as string) || ''
      const priority = typeof hotelRef === 'number' ? 50 : hotelRef.priority || 50 // Default to 50 if priority not set

      // Only include hotels with valid name and logo
      if (!name || !logo) return acc

      seenHotelIds.add(hotelId)
      acc.push({
        id: hotelId,
        name,
        logo,
        isActive: true,
        updatedAt,
        createdAt,
        priority,
      })
      return acc
    }, [])
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

  // Build Custom Media Block from selected tour images
  const tourImagesMediaItems = (tour.tourImages || [])
    .map((img) => (typeof img === 'object' && img && 'image' in img ? img.image : null))
    .filter(Boolean)
    .map((media) => ({ media }))

  const customMediaBlock = {
    id: 'tour-media',
    blockType: 'customMediaBlock',
    title: undefined,
    subtitle: undefined,
    mediaItems: tourImagesMediaItems,
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
      {tour && (
        <>
          <GA4EventTracker tour={tour} />
          <TourDetailsHero
            tourName={tour.name}
            shortDescription={tour.shortDescription}
            description={tour.description}
            tourAvatarImage={tour.tourAvatarImage}
            tourDetailsPageHeroImage={tour.tourDetailsPageHeroImage}
            toursData={toursData}
            selectedTourId={Number(tour.id)}
          />

          <RenderBlocks blocks={newLayout as Page['layout']} />
        </>
      )}
    </article>
  )
}
