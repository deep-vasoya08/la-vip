/**
 * React hooks for GA4 eCommerce tracking - Standard Implementation
 * Based on Google's official GA4 eCommerce specification
 */

import { useCallback } from 'react'
import {
  trackAddPaymentInfo,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackRefund,
  trackRemoveFromCart,
  trackSelectItem,
  trackViewItem,
  trackViewItemList,
  trackFormSubmit,
  convertTourBookingToGA4Item,
  convertEventBookingToGA4Item,
  GA4Item,
} from '@/lib/ga4-ecommerce'
import {
  Tour,
  Event,
  TourBooking as TourBookingType,
  EventBooking as EventBookingType,
} from '@/payload-types'

export interface UseGA4TrackingReturn {
  // Standard GA4 eCommerce events
  trackViewItem: (currency: string, value: number, items: GA4Item[]) => void
  trackViewItemList: (itemListId: string, itemListName: string, items: GA4Item[]) => void
  trackSelectItem: (itemListId: string, itemListName: string, items: GA4Item[]) => void
  trackAddToCart: (currency: string, value: number, items: GA4Item[]) => void
  trackRemoveFromCart: (currency: string, value: number, items: GA4Item[]) => void
  trackBeginCheckout: (currency: string, value: number, items: GA4Item[], coupon?: string) => void
  trackAddPaymentInfo: (
    currency: string,
    value: number,
    items: GA4Item[],
    paymentType?: string,
    coupon?: string,
  ) => void
  trackPurchase: (
    transactionId: string,
    currency: string,
    value: number,
    items: GA4Item[],
    affiliation?: string,
    coupon?: string,
    shipping?: number,
    tax?: number,
  ) => void
  trackRefund: (
    transactionId: string,
    currency: string,
    value: number,
    items?: GA4Item[],
    affiliation?: string,
  ) => void
  trackFormSubmit: (formId: string | number) => void

  // Convenience methods for tours
  trackTourView: (tour: Tour) => void
  trackTourListView: (tours: Tour[], listName: string) => void
  trackTourSelect: (tour: Tour, listName: string) => void
  trackTourAddToCart: (
    tour: Tour,
    booking: Partial<TourBookingType>,
    pricing: { totalAmount: number; currency: string },
  ) => void
  trackTourBeginCheckout: (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => void
  trackTourAddPaymentInfo: (
    tour: Tour,
    booking: Partial<TourBookingType>,
    pricing: any,
    paymentType?: string,
  ) => void
  trackTourPurchase: (
    transactionId: string,
    tour: Tour,
    booking: Partial<TourBookingType>,
    pricing: any,
  ) => void

  // Convenience methods for events
  trackEventView: (event: Event) => void
  trackEventListView: (events: Event[], listName: string) => void
  trackEventSelect: (event: Event, listName: string) => void
  trackEventAddToCart: (
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: { totalAmount: number; currency: string },
  ) => void
  trackEventBeginCheckout: (event: Event, booking: Partial<EventBookingType>, pricing: any) => void
  trackEventAddPaymentInfo: (
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: any,
    paymentType?: string,
  ) => void
  trackEventPurchase: (
    transactionId: string,
    event: Event,
    booking: Partial<EventBookingType>,
    pricing: any,
  ) => void
}

/**
 * Hook for GA4 eCommerce tracking - Standard Implementation
 */
export const useGA4Tracking = (): UseGA4TrackingReturn => {
  // Standard GA4 eCommerce event functions
  const trackViewItemCallback = useCallback((currency: string, value: number, items: GA4Item[]) => {
    trackViewItem(currency, value, items)
  }, [])

  const trackViewItemListCallback = useCallback(
    (itemListId: string, itemListName: string, items: GA4Item[]) => {
      trackViewItemList(itemListId, itemListName, items)
    },
    [],
  )

  const trackSelectItemCallback = useCallback(
    (itemListId: string, itemListName: string, items: GA4Item[]) => {
      trackSelectItem(itemListId, itemListName, items)
    },
    [],
  )

  const trackAddToCartCallback = useCallback(
    (currency: string, value: number, items: GA4Item[]) => {
      trackAddToCart(currency, value, items)
    },
    [],
  )

  const trackRemoveFromCartCallback = useCallback(
    (currency: string, value: number, items: GA4Item[]) => {
      trackRemoveFromCart(currency, value, items)
    },
    [],
  )

  const trackBeginCheckoutCallback = useCallback(
    (currency: string, value: number, items: GA4Item[], coupon?: string) => {
      trackBeginCheckout(currency, value, items, coupon)
    },
    [],
  )

  const trackAddPaymentInfoCallback = useCallback(
    (currency: string, value: number, items: GA4Item[], paymentType?: string, coupon?: string) => {
      trackAddPaymentInfo(currency, value, items, paymentType, coupon)
    },
    [],
  )

  const trackPurchaseCallback = useCallback(
    (
      transactionId: string,
      currency: string,
      value: number,
      items: GA4Item[],
      affiliation?: string,
      coupon?: string,
      shipping?: number,
      tax?: number,
    ) => {
      trackPurchase(transactionId, currency, value, items, affiliation, coupon, shipping, tax)
    },
    [],
  )

  const trackRefundCallback = useCallback(
    (
      transactionId: string,
      currency: string,
      value: number,
      items?: GA4Item[],
      affiliation?: string,
    ) => {
      trackRefund(transactionId, currency, value, items, affiliation)
    },
    [],
  )

  const trackFormSubmitCallback = useCallback((formId: string | number) => {
    trackFormSubmit(formId)
  }, [])

  // Tour convenience functions
  const trackTourView = useCallback((tour: Tour) => {
    const price = tour.pickups?.[0]?.adult_price || 0
    const item = convertTourBookingToGA4Item(tour, {}, { totalAmount: price, currency: 'USD' })
    trackViewItem('USD', price, [item])
  }, [])

  const trackTourListView = useCallback((tours: Tour[], listName: string) => {
    const items: GA4Item[] = tours.map((tour, index) => {
      const price = tour.pickups?.[0]?.adult_price || 0
      return {
        ...convertTourBookingToGA4Item(tour, {}, { totalAmount: price, currency: 'USD' }),
        index,
      }
    })
    trackViewItemList(`tour_list_${listName.toLowerCase().replace(/\s+/g, '_')}`, listName, items)
  }, [])

  const trackTourSelect = useCallback((tour: Tour, listName: string) => {
    const price = tour.pickups?.[0]?.adult_price || 0
    const item = convertTourBookingToGA4Item(tour, {}, { totalAmount: price, currency: 'USD' })
    trackSelectItem(`tour_list_${listName.toLowerCase().replace(/\s+/g, '_')}`, listName, [item])
  }, [])

  const trackTourAddToCart = useCallback(
    (
      tour: Tour,
      booking: Partial<TourBookingType>,
      pricing: { totalAmount: number; currency: string },
    ) => {
      const item = convertTourBookingToGA4Item(tour, booking, pricing)
      trackAddToCart(pricing.currency, pricing.totalAmount, [item])
    },
    [],
  )

  const trackTourBeginCheckout = useCallback(
    (tour: Tour, booking: Partial<TourBookingType>, pricing: any) => {
      const item = convertTourBookingToGA4Item(tour, booking, pricing)
      trackBeginCheckout(pricing.currency, pricing.totalAmount, [item])
    },
    [],
  )

  const trackTourAddPaymentInfo = useCallback(
    (tour: Tour, booking: Partial<TourBookingType>, pricing: any, paymentType: string = 'card') => {
      const item = convertTourBookingToGA4Item(tour, booking, pricing)
      trackAddPaymentInfo(pricing.currency, pricing.totalAmount, [item], paymentType)
    },
    [],
  )

  const trackTourPurchase = useCallback(
    (transactionId: string, tour: Tour, booking: Partial<TourBookingType>, pricing: any) => {
      const item = convertTourBookingToGA4Item(tour, booking, pricing)
      trackPurchase(transactionId, pricing.currency, pricing.totalAmount, [item], 'LA VIP Tours')
    },
    [],
  )

  // Event convenience functions
  const trackEventView = useCallback((event: Event) => {
    const price = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
    const item = convertEventBookingToGA4Item(event, {}, { totalAmount: price, currency: 'USD' })
    trackViewItem('USD', price, [item])
  }, [])

  const trackEventListView = useCallback((events: Event[], listName: string) => {
    const items: GA4Item[] = events.map((event, index) => {
      const price = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
      return {
        ...convertEventBookingToGA4Item(event, {}, { totalAmount: price, currency: 'USD' }),
        index,
      }
    })
    trackViewItemList(`event_list_${listName.toLowerCase().replace(/\s+/g, '_')}`, listName, items)
  }, [])

  const trackEventSelect = useCallback((event: Event, listName: string) => {
    const price = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
    const item = convertEventBookingToGA4Item(event, {}, { totalAmount: price, currency: 'USD' })
    trackSelectItem(`event_list_${listName.toLowerCase().replace(/\s+/g, '_')}`, listName, [item])
  }, [])

  const trackEventAddToCart = useCallback(
    (
      event: Event,
      booking: Partial<EventBookingType>,
      pricing: { totalAmount: number; currency: string },
    ) => {
      const item = convertEventBookingToGA4Item(event, booking, pricing)
      trackAddToCart(pricing.currency, pricing.totalAmount, [item])
    },
    [],
  )

  const trackEventBeginCheckout = useCallback(
    (event: Event, booking: Partial<EventBookingType>, pricing: any) => {
      const item = convertEventBookingToGA4Item(event, booking, pricing)
      trackBeginCheckout(pricing.currency, pricing.totalAmount, [item])
    },
    [],
  )

  const trackEventAddPaymentInfo = useCallback(
    (
      event: Event,
      booking: Partial<EventBookingType>,
      pricing: any,
      paymentType: string = 'card',
    ) => {
      const item = convertEventBookingToGA4Item(event, booking, pricing)
      trackAddPaymentInfo(pricing.currency, pricing.totalAmount, [item], paymentType)
    },
    [],
  )

  const trackEventPurchase = useCallback(
    (transactionId: string, event: Event, booking: Partial<EventBookingType>, pricing: any) => {
      const item = convertEventBookingToGA4Item(event, booking, pricing)
      trackPurchase(transactionId, pricing.currency, pricing.totalAmount, [item], 'LA VIP Tours')
    },
    [],
  )

  return {
    trackViewItem: trackViewItemCallback,
    trackViewItemList: trackViewItemListCallback,
    trackSelectItem: trackSelectItemCallback,
    trackAddToCart: trackAddToCartCallback,
    trackRemoveFromCart: trackRemoveFromCartCallback,
    trackBeginCheckout: trackBeginCheckoutCallback,
    trackAddPaymentInfo: trackAddPaymentInfoCallback,
    trackPurchase: trackPurchaseCallback,
    trackRefund: trackRefundCallback,
    trackFormSubmit: trackFormSubmitCallback,
    trackTourView,
    trackTourListView,
    trackTourSelect,
    trackTourAddToCart,
    trackTourBeginCheckout,
    trackTourAddPaymentInfo,
    trackTourPurchase,
    trackEventView,
    trackEventListView,
    trackEventSelect,
    trackEventAddToCart,
    trackEventBeginCheckout,
    trackEventAddPaymentInfo,
    trackEventPurchase,
  }
}
