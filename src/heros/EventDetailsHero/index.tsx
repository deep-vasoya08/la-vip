'use client'
import React from 'react'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import { Event } from '@/payload-types'
import EventBookingPayment from '@/components/EventBookingPayment'
import { formatEventsForBookingForm } from '@/utilities/eventBookingUtils'

interface EventDetailsHeroProps {
  events: Event[]
  selectedEventId: number
}

export const EventDetailsHero: React.FC<EventDetailsHeroProps> = ({ events, selectedEventId }) => {
  if (!events || events.length === 0 || !selectedEventId) return null
  // Find the selected event for display in the hero section
  const selectedEvent = events.find((event) => event.id === selectedEventId)

  if (!selectedEvent) {
    console.warn(`Event with ID ${selectedEventId} not found in events array`)
    return null
  }

  // Extract venue information to get background image
  const venue =
    selectedEvent.venue && typeof selectedEvent.venue === 'object' ? selectedEvent.venue : null
  const venueImages = venue?.images || []
  const backgroundImage =
    venueImages.length > 0 && venueImages[0]?.image
      ? venueImages[0].image
      : selectedEvent.eventAvatarImage

  // console.log('selected event data', selectedEvent)
  const { name, eventAvatarImage, description } = selectedEvent

  const formattedEvents = formatEventsForBookingForm(events as Event[])

  return (
    <div className="relative bg-white">
      {/* Main Hero Image with Gradient Overlay */}
      <div className="relative min-h-[45vh] md:min-h-[60vh]">
        {backgroundImage && typeof backgroundImage === 'object' && (
          <Media fill priority imgClassName="object-cover" resource={backgroundImage} />
        )}

        {/* Blurry White Overlay - This creates the foggy effect */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"
          aria-hidden="true"
        />

        {/* Additional subtle blur gradient for more depth */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 backdrop-blur-sm opacity-60 bg-gradient-to-t from-white/90 to-transparent"
          style={{ mixBlendMode: 'overlay' }}
          aria-hidden="true"
        />
      </div>

      {/* Content Layout */}
      <div className={`container px-4 relative z-10 -mt-48 md:-mt-56 pb-2`}>
        <div
          className={cn('flex flex-col md:flex-row px-2 sm:px-4 md:px-8 xl:px-10 pt-8 md:pt-6', {
            'md:flex-row-reverse': true,
          })}
        >
          {/* Main Content - Appears first on mobile */}
          <div className="md:w-1/2 lg:w-7/12 md:px-4 mt-4 md:mt-2 self-start order-1 md:order-2">
            {eventAvatarImage && (
              <Media
                imgClassName="sm:max-w-[250px] md:max-w-[350px] lg:max-w-[500px]"
                resource={eventAvatarImage}
                alt={name || 'Event Image'}
                className="h-full w-full object-cover mb-5 flex"
              />
            )}
            {name && (
              <h2 className="font-bold font-semplicita mb-1 text-mustard uppercase">{name}</h2>
            )}
            {description && (
              <h5 className="font-semibold italic font-semplicita mb-3 text-gray">{description}</h5>
            )}
          </div>

          {/* Card or Image - Appears second on mobile */}
          <div className="md:w-1/2 lg:w-5/12 md:px-4 px-2 order-2 md:order-1 mt-8 md:mt-0">
            {/* Use the BookingForm component - now handles authentication flow internally */}
            <EventBookingPayment
              events={formattedEvents}
              selectedEventId={Number(selectedEventId)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsHero
