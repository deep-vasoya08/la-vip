/**
 * React hooks for Meta Pixel (Facebook Pixel) conversion tracking
 * Mirrors the GA4 tracking structure for consistency
 */

import { useCallback } from 'react'
import {
  trackMetaAddPaymentInfo,
  trackMetaAddToCart,
  trackMetaInitiateCheckout,
  trackMetaPurchase,
  trackMetaViewContent,
  trackMetaLead,
  trackMetaContact,
  trackMetaSchedule,
  convertTourBookingToMetaItem,
  convertEventBookingToMetaItem,
  MetaPixelItem,
} from '@/lib/meta-pixel'
import {
  Tour,
  Event,
  TourBooking as TourBookingType,
  EventBooking as EventBookingType,
} from '@/payload-types'

export interface UseMetaPixelTrackingReturn {
  // Standard Meta Pixel events
  trackViewContent: (
    currency: string,
    value: number,
    contentIds: string[],
    contentName?: string,
    contentCategory?: string,
  ) => void
  trackAddToCart: (
    currency: string,
    value: number,
    contentIds: string[],
    contentName?: string,
    contentCategory?: string,
    contents?: MetaPixelItem[],
  ) => void
  trackInitiateCheckout: (
    currency: string,
    value: number,
    contentIds: string[],
    contentName?: string,
    contentCategory?: string,
    contents?: MetaPixelItem[],
    numItems?: number,
  ) => void
  trackAddPaymentInfo: (
    currency: string,
    value: number,
    contentIds: string[],
    contentName?: string,
    contentCategory?: string,
  ) => void
  trackPurchase: (
    currency: string,
    value: number,
    contentIds: string[],
    orderId: string,
    contentName?: string,
    contentCategory?: string,
    contents?: MetaPixelItem[],
    numItems?: number,
  ) => void
  trackLead: (
    currency?: string,
    value?: number,
    contentName?: string,
    contentCategory?: string,
  ) => void
  trackContact: (contentName?: string, contentCategory?: string) => void
  trackSchedule: (
    currency?: string,
    value?: number,
    contentName?: string,
    contentCategory?: string,
  ) => void

  // Convenience methods for tours
  trackTourView: (tour: Tour) => void
  trackTourAddToCart: (
    tour: Tour,
    booking: Partial<TourBookingType>,
    pricing: { totalAmount: number; currency: string },
  ) => void
  trackTourInitiateCheckout: (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => void
  trackTourAddPaymentInfo: (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => void
  trackTourPurchase: (
    orderId: string,
    tour: Tour,
    booking: Partial<TourBookingType>,
    pricing: any,
  ) => void

  // Convenience methods for events
  trackEventView: (event: Event) => void
  trackEventAddToCart: (
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: { totalAmount: number; currency: string },
  ) => void
  trackEventInitiateCheckout: (
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: any,
  ) => void
  trackEventAddPaymentInfo: (event: Event, booking: Partial<EventBookingType>, pricing: any) => void
  trackEventPurchase: (
    orderId: string,
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: any,
  ) => void
}

/**
 * Hook for Meta Pixel conversion tracking
 */
export const useMetaPixelTracking = (): UseMetaPixelTrackingReturn => {
  // Standard Meta Pixel event functions
  const trackViewContentCallback = useCallback(
    (
      currency: string,
      value: number,
      contentIds: string[],
      contentName?: string,
      contentCategory?: string,
    ) => {
      trackMetaViewContent(currency, value, contentIds, contentName, contentCategory)
    },
    [],
  )

  const trackAddToCartCallback = useCallback(
    (
      currency: string,
      value: number,
      contentIds: string[],
      contentName?: string,
      contentCategory?: string,
      contents?: MetaPixelItem[],
    ) => {
      trackMetaAddToCart(currency, value, contentIds, contentName, contentCategory, contents)
    },
    [],
  )

  const trackInitiateCheckoutCallback = useCallback(
    (
      currency: string,
      value: number,
      contentIds: string[],
      contentName?: string,
      contentCategory?: string,
      contents?: MetaPixelItem[],
      numItems?: number,
    ) => {
      trackMetaInitiateCheckout(
        currency,
        value,
        contentIds,
        contentName,
        contentCategory,
        contents,
        numItems,
      )
    },
    [],
  )

  const trackAddPaymentInfoCallback = useCallback(
    (
      currency: string,
      value: number,
      contentIds: string[],
      contentName?: string,
      contentCategory?: string,
    ) => {
      trackMetaAddPaymentInfo(currency, value, contentIds, contentName, contentCategory)
    },
    [],
  )

  const trackPurchaseCallback = useCallback(
    (
      currency: string,
      value: number,
      contentIds: string[],
      orderId: string,
      contentName?: string,
      contentCategory?: string,
      contents?: MetaPixelItem[],
      numItems?: number,
    ) => {
      trackMetaPurchase(
        currency,
        value,
        contentIds,
        orderId,
        contentName,
        contentCategory,
        contents,
        numItems,
      )
    },
    [],
  )

  const trackLeadCallback = useCallback(
    (currency?: string, value?: number, contentName?: string, contentCategory?: string) => {
      trackMetaLead(currency, value, contentName, contentCategory)
    },
    [],
  )

  const trackContactCallback = useCallback((contentName?: string, contentCategory?: string) => {
    trackMetaContact(contentName, contentCategory)
  }, [])

  const trackScheduleCallback = useCallback(
    (currency?: string, value?: number, contentName?: string, contentCategory?: string) => {
      trackMetaSchedule(currency, value, contentName, contentCategory)
    },
    [],
  )

  // Tour convenience functions
  const trackTourView = useCallback((tour: Tour) => {
    const price = tour.pickups?.[0]?.adult_price || 0
    const contentId = `tour_${tour.id}`
    trackMetaViewContent('USD', price, [contentId], tour.name, 'Tours', 'product')
  }, [])

  const trackTourAddToCart = useCallback(
    (
      tour: Tour,
      booking: Partial<TourBookingType>,
      pricing: { totalAmount: number; currency: string },
    ) => {
      const contentId = `tour_${tour.id}`
      const item = convertTourBookingToMetaItem(tour, booking, pricing)
      trackMetaAddToCart(pricing.currency, pricing.totalAmount, [contentId], tour.name, 'Tours', [
        item,
      ])
    },
    [],
  )

  const trackTourInitiateCheckout = useCallback(
    (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => {
      const contentId = `tour_${tour.id}`
      const item = convertTourBookingToMetaItem(tour, booking, pricing)
      trackMetaInitiateCheckout(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        tour.name,
        'Tours',
        [item],
        1,
      )
    },
    [],
  )

  const trackTourAddPaymentInfo = useCallback(
    (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => {
      const contentId = `tour_${tour.id}`
      trackMetaAddPaymentInfo(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        tour.name,
        'Tours',
      )
    },
    [],
  )

  const trackTourPurchase = useCallback(
    (orderId: string, tour: Tour, booking: Partial<TourBookingType>, pricing: any) => {
      const contentId = `tour_${tour.id}`
      const item = convertTourBookingToMetaItem(tour, booking, pricing)
      trackMetaPurchase(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        orderId,
        tour.name,
        'Tours',
        [item],
        1,
      )
    },
    [],
  )

  // Event convenience functions
  const trackEventView = useCallback((event: Event) => {
    const price = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
    const contentId = `event_${event.id}`
    trackMetaViewContent('USD', price, [contentId], event.name, 'Events', 'product')
  }, [])

  const trackEventAddToCart = useCallback(
    (
      event: Event,
      booking: Partial<EventBookingType>,
      pricing: { totalAmount: number; currency: string },
    ) => {
      const contentId = `event_${event.id}`
      const item = convertEventBookingToMetaItem(event, booking, pricing)
      trackMetaAddToCart(pricing.currency, pricing.totalAmount, [contentId], event.name, 'Events', [
        item,
      ])
    },
    [],
  )

  const trackEventInitiateCheckout = useCallback(
    (event: Event, booking: Partial<EventBookingType>, pricing: any) => {
      const contentId = `event_${event.id}`
      const item = convertEventBookingToMetaItem(event, booking, pricing)
      trackMetaInitiateCheckout(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        event.name,
        'Events',
        [item],
        1,
      )
    },
    [],
  )

  const trackEventAddPaymentInfo = useCallback(
    (event: Event, booking: Partial<EventBookingType>, pricing: any) => {
      const contentId = `event_${event.id}`
      trackMetaAddPaymentInfo(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        event.name,
        'Events',
      )
    },
    [],
  )

  const trackEventPurchase = useCallback(
    (orderId: string, event: Event, booking: Partial<EventBookingType>, pricing: any) => {
      const contentId = `event_${event.id}`
      const item = convertEventBookingToMetaItem(event, booking, pricing)
      trackMetaPurchase(
        pricing.currency,
        pricing.totalAmount,
        [contentId],
        orderId,
        event.name,
        'Events',
        [item],
        1,
      )
    },
    [],
  )

  return {
    trackViewContent: trackViewContentCallback,
    trackAddToCart: trackAddToCartCallback,
    trackInitiateCheckout: trackInitiateCheckoutCallback,
    trackAddPaymentInfo: trackAddPaymentInfoCallback,
    trackPurchase: trackPurchaseCallback,
    trackLead: trackLeadCallback,
    trackContact: trackContactCallback,
    trackSchedule: trackScheduleCallback,
    trackTourView,
    trackTourAddToCart,
    trackTourInitiateCheckout,
    trackTourAddPaymentInfo,
    trackTourPurchase,
    trackEventView,
    trackEventAddToCart,
    trackEventInitiateCheckout,
    trackEventAddPaymentInfo,
    trackEventPurchase,
  }
}
