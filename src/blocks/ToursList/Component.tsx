import React from 'react'
import { ToursListConfig, Tour } from '@/payload-types'
import CustomMediaBlock from '../CustomMediaBlock/Component'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { generateTourDates } from '@/utilities/tourScheduleUtils'
import { addHours } from 'date-fns'
// Media type is handled by CustomMediaBlock internally

type TourWithMedia = Tour & {
  tourAvatarImage: {
    url: string
    alt: string
  }
  tourImages?: Array<{
    image: {
      url: string
      alt: string
    }
  }>
  tourDetailsPageLink?: {
    link?: {
      url?: string
      type?: 'custom' | 'reference'
      newTab?: boolean
      reference?: {
        value: {
          slug?: string
        }
      }
    }
  }
}

export const ToursList: React.FC<ToursListConfig> = async ({
  title,
  subtitle,
  backgroundColor,
  viewType,
  itemsPerRow = 'auto',
}) => {
  const payload = await getPayload({ config: configPromise })

  // Get all tours, we'll filter based on RRULE-generated schedules
  const toursResult = await payload.find({
    collection: 'tours',
    depth: 3,
    limit: 100,
    sort: 'name',
  })

  // Filter tours that have future available dates or are not bookable
  const currentTime = new Date()
  const twoHoursFromNow = addHours(currentTime, 2)

  const availableTours = toursResult.docs.filter((tour) => {
    // Always show non-bookable tours
    if (!tour.isBookable) {
      return true
    }

    // For bookable tours, check if they have valid future dates
    if (tour.recurrence_rule && tour.tour_start_time && tour.booking_window_months) {
      try {
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
    }

    return false
  })

  const tours = {
    ...toursResult,
    docs: availableTours,
  }

  tours.docs = tours.docs.slice(0, 8)

  // console.log('server tours', tours?.docs)
  const createTourURL = (tour: Tour) => {
    // Convert id to string, ensure name exists, create proper URL slug
    const id = tour?.id?.toString() || ''
    const name = tour?.name || ''
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single one

    return `${id}-${slug}` // Format: id-slug
  }

  // Safely extract and format media items from tours
  const validMediaItems = []

  if (tours?.docs && Array.isArray(tours.docs)) {
    for (const tour of tours.docs as TourWithMedia[]) {
      // Skip tours without valid avatar image
      if (!tour?.tourAvatarImage) {
        continue
      }

      // Get tour details
      const tourName = tour.name || 'Untitled Tour'
      const description = tour.shortDescription || ''

      validMediaItems.push({
        id: createTourURL(tour),
        media: tour.tourAvatarImage,
        overlayText: tourName,
        description: description,
        bgColor: 'bg-mustard' as const,
        textColor: 'text-white' as const,
        isEventItem: false,
        isTourItem: true,
        isTeamMember: false,
        d: {
          link: {
            ...tour.tourDetailsPageLink?.link,
            url: tour.tourDetailsPageLink?.link?.url || '',
            newTab: tour.tourDetailsPageLink?.link?.newTab || false,
            reference: tour.tourDetailsPageLink?.link?.reference,
            isBookable: tour.isBookable || false,
          },
        },
        // Add additional tour images if they exist
        additionalImages: tour.tourImages?.map((img) => img.image).filter(Boolean) || [],
      })
    }
  }

  return (
    <CustomMediaBlock
      title={title}
      subtitle={subtitle}
      blockType="customMediaBlock"
      mediaItems={validMediaItems}
      backgroundColor={backgroundColor}
      viewType={viewType}
      itemsPerRow={itemsPerRow}
      imageSpacing={24}
    />
  )
}

export default ToursList
