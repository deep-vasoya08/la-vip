/**
 * Meta Pixel (Facebook Pixel) Conversion Tracking
 * Based on Meta's official Conversions API and browser events
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

export interface MetaPixelItem {
  id: string
  quantity: number
  item_price?: number
}

export interface MetaPixelEventData {
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  contents?: MetaPixelItem[]
  currency?: string
  value?: number
  num_items?: number
  predicted_ltv?: number
  search_string?: string
  status?: boolean
  order_id?: string
  delivery_category?: string
  [key: string]: any
}

type FbqFunction = {
  (
    action: string,
    eventName: string,
    data?: MetaPixelEventData,
    options?: Record<string, any>,
  ): void
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[]
  push?: unknown
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: unknown
  }
}

/**
 * Initialize Meta Pixel
 */
export const initializeMetaPixel = (pixelId: string): void => {
  if (typeof window === 'undefined') return

  try {
    if (!window.fbq) {
      // Load Meta Pixel script
      ;(function (f: any, b: any, e: any, v: any) {
        if (f.fbq) return
        const n: any = function (...args: any[]) {
          if (n.callMethod) {
            return n.callMethod(...args)
          }
          n.queue.push(args)
        }
        f.fbq = n
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = true
        n.version = '2.0'
        n.queue = []
        const t = b.createElement(e)
        t.async = true
        t.src = v
        const s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

      // Initialize pixel once script is loaded
      if (window.fbq) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window.fbq as any)('init', pixelId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window.fbq as any)('track', 'PageView')
      }
    }
  } catch (error) {
    console.error('Error initializing Meta Pixel:', error)
  }
}

/**
 * Track a Meta Pixel event
 */
export const trackMetaPixelEvent = (
  eventName: string,
  data?: MetaPixelEventData,
  options?: Record<string, any>,
): void => {
  if (typeof window === 'undefined' || !window.fbq) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.fbq as any)('track', eventName, data, options)
  } catch (error) {
    console.error(`Error tracking Meta Pixel event ${eventName}:`, error)
  }
}

/**
 * Track a custom Meta Pixel event
 */
export const trackMetaPixelCustomEvent = (eventName: string, data?: MetaPixelEventData): void => {
  if (typeof window === 'undefined' || !window.fbq) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.fbq as any)('trackCustom', eventName, data)
  } catch (error) {
    console.error(`Error tracking Meta Pixel custom event ${eventName}:`, error)
  }
}

// ===== STANDARD META PIXEL CONVERSION EVENTS =====

/**
 * Track AddPaymentInfo event
 * Fires when payment information is added in the checkout flow
 */
export const trackMetaAddPaymentInfo = (
  currency: string,
  value: number,
  contentIds: string[],
  contentName?: string,
  contentCategory?: string,
): void => {
  trackMetaPixelEvent('AddPaymentInfo', {
    currency,
    value,
    content_ids: contentIds,
    content_name: contentName,
    content_category: contentCategory,
    content_type: 'product',
  })
}

/**
 * Track AddToCart event
 * Fires when a product is added to the shopping cart
 */
export const trackMetaAddToCart = (
  currency: string,
  value: number,
  contentIds: string[],
  contentName?: string,
  contentCategory?: string,
  contents?: MetaPixelItem[],
): void => {
  trackMetaPixelEvent('AddToCart', {
    currency,
    value,
    content_ids: contentIds,
    content_name: contentName,
    content_category: contentCategory,
    content_type: 'product',
    contents,
  })
}

/**
 * Track InitiateCheckout event
 * Fires when the checkout process is initiated
 */
export const trackMetaInitiateCheckout = (
  currency: string,
  value: number,
  contentIds: string[],
  contentName?: string,
  contentCategory?: string,
  contents?: MetaPixelItem[],
  numItems?: number,
): void => {
  trackMetaPixelEvent('InitiateCheckout', {
    currency,
    value,
    content_ids: contentIds,
    content_name: contentName,
    content_category: contentCategory,
    content_type: 'product',
    contents,
    num_items: numItems,
  })
}

/**
 * Track Purchase event
 * Fires when a purchase is completed
 */
export const trackMetaPurchase = (
  currency: string,
  value: number,
  contentIds: string[],
  orderId: string,
  contentName?: string,
  contentCategory?: string,
  contents?: MetaPixelItem[],
  numItems?: number,
): void => {
  trackMetaPixelEvent('Purchase', {
    currency,
    value,
    content_ids: contentIds,
    content_name: contentName,
    content_category: contentCategory,
    content_type: 'product',
    contents,
    num_items: numItems,
    order_id: orderId,
  })
}

/**
 * Track ViewContent event
 * Fires when a product or service page is viewed
 */
export const trackMetaViewContent = (
  currency: string,
  value: number,
  contentIds: string[],
  contentName?: string,
  contentCategory?: string,
  contentType: string = 'product',
): void => {
  trackMetaPixelEvent('ViewContent', {
    currency,
    value,
    content_ids: contentIds,
    content_name: contentName,
    content_category: contentCategory,
    content_type: contentType,
  })
}

/**
 * Track Search event
 * Fires when a search is performed
 */
export const trackMetaSearch = (searchString: string, contentCategory?: string): void => {
  trackMetaPixelEvent('Search', {
    search_string: searchString,
    content_category: contentCategory,
  })
}

/**
 * Track Lead event
 * Fires when a sign up or lead is completed (e.g., form submission)
 */
export const trackMetaLead = (
  currency?: string,
  value?: number,
  contentName?: string,
  contentCategory?: string,
): void => {
  trackMetaPixelEvent('Lead', {
    currency,
    value,
    content_name: contentName,
    content_category: contentCategory,
  })
}

/**
 * Track CompleteRegistration event
 * Fires when a registration form is completed
 */
export const trackMetaCompleteRegistration = (
  currency?: string,
  value?: number,
  contentName?: string,
  status?: boolean,
): void => {
  trackMetaPixelEvent('CompleteRegistration', {
    currency,
    value,
    content_name: contentName,
    status,
  })
}

/**
 * Track Contact event
 * Fires when contact form is submitted
 */
export const trackMetaContact = (contentName?: string, contentCategory?: string): void => {
  trackMetaPixelEvent('Contact', {
    content_name: contentName,
    content_category: contentCategory,
  })
}

/**
 * Track Schedule event
 * Fires when an appointment or booking is scheduled
 */
export const trackMetaSchedule = (
  currency?: string,
  value?: number,
  contentName?: string,
  contentCategory?: string,
): void => {
  trackMetaPixelEvent('Schedule', {
    currency,
    value,
    content_name: contentName,
    content_category: contentCategory,
  })
}

// ===== CONVERSION HELPERS FOR TOUR/EVENT BOOKINGS =====

/**
 * Convert tour booking to Meta Pixel item format
 */
export const convertTourBookingToMetaItem = (
  tour: any,
  booking: any,
  pricing: any,
): MetaPixelItem => {
  return {
    id: `tour_${tour?.id || 'unknown'}`,
    quantity: 1,
    item_price: Number(pricing?.totalAmount || 0),
  }
}

/**
 * Convert event booking to Meta Pixel item format
 */
export const convertEventBookingToMetaItem = (
  event: any,
  booking: any,
  pricing: any,
): MetaPixelItem => {
  return {
    id: `event_${event?.id || 'unknown'}`,
    quantity: 1,
    item_price: Number(pricing?.totalAmount || 0),
  }
}
