'use client'

import { useEffect } from 'react'
import { useGA4Tracking } from '@/hooks/useGA4Tracking'
import { useMetaPixelTracking } from '@/hooks/useMetaPixelTracking'
import { type Tour, type Event } from '@/payload-types'

interface ConversionTrackerProps {
  tour?: Tour
  event?: Event
}

/**
 * Unified Conversion Tracker Component
 * Tracks both GA4 and Meta Pixel events for tours and events
 */
const GA4EventTracker: React.FC<ConversionTrackerProps> = ({ tour, event }) => {
  const { trackTourView: trackGA4TourView, trackEventView: trackGA4EventView } = useGA4Tracking()
  const { trackTourView: trackMetaTourView, trackEventView: trackMetaEventView } =
    useMetaPixelTracking()

  useEffect(() => {
    if (tour) {
      // Track in both GA4 and Meta Pixel
      trackGA4TourView(tour)
      trackMetaTourView(tour)
    } else if (event) {
      // Track in both GA4 and Meta Pixel
      trackGA4EventView(event)
      trackMetaEventView(event)
    }
  }, [tour, event, trackGA4TourView, trackGA4EventView, trackMetaTourView, trackMetaEventView])

  return null
}

export default GA4EventTracker
