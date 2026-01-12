/**
 * GA4 eCommerce Events - Standard Implementation
 * Based on Google's official GA4 eCommerce specification
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */

export interface GA4Item {
  item_id: string
  item_name: string
  affiliation?: string
  coupon?: string
  currency?: string
  discount?: number
  index?: number
  item_brand?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  item_category4?: string
  item_category5?: string
  item_list_id?: string
  item_list_name?: string
  item_variant?: string
  location_id?: string
  price: number
  promotion_id?: string
  promotion_name?: string
  quantity: number
}

export interface GA4EcommerceEvent {
  event?: string
  // cspell:disable-next-line
  ecommerce?: {
    currency?: string
    value?: number
    transaction_id?: string
    affiliation?: string
    coupon?: string
    shipping?: number
    tax?: number
    payment_type?: string
    shipping_tier?: string
    item_list_id?: string
    item_list_name?: string
    creative_name?: string
    creative_slot?: string
    promotion_id?: string
    promotion_name?: string
    items?: GA4Item[]
  } | null
  [key: string]: any
}

/**
 * Initialize data layer
 */
export const initializeDataLayer = (): void => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
  }
}

/**
 * Push an event to the data layer
 */
export const pushToDataLayer = (event: GA4EcommerceEvent): void => {
  if (typeof window === 'undefined') return

  try {
    initializeDataLayer()

    window.dataLayer.push(event)
  } catch (_error) {}
}

/**
 * Convert tour booking data to GA4 item format
 */
export const convertTourBookingToGA4Item = (tour: any, booking: any, pricing: any): GA4Item => {
  try {
    return {
      item_id: `tour_${tour?.id || 'unknown'}`,
      item_name: tour?.name || 'Tour Booking',
      affiliation: 'LA VIP Tours',
      item_brand: 'LA VIP Tours',
      item_category: 'Tours',
      item_category2: tour?.tourType || 'Sightseeing',
      item_variant: `${booking?.adultCount || 1}_adults_${booking?.childCount || 0}_children`,
      price: Number(pricing?.totalAmount || 0),
      quantity: 1,
      currency: pricing?.currency || 'USD',
    }
  } catch (_error) {
    return {
      item_id: 'tour_fallback',
      item_name: 'Tour Booking',
      affiliation: 'LA VIP Tours',
      item_brand: 'LA VIP Tours',
      item_category: 'Tours',
      item_category2: 'Sightseeing',
      item_variant: '1_adults_0_children',
      price: 0,
      quantity: 1,
      currency: 'USD',
    }
  }
}

/**
 * Convert event booking data to GA4 item format
 */
export const convertEventBookingToGA4Item = (event: any, booking: any, pricing: any): GA4Item => {
  try {
    return {
      item_id: `event_${event?.id || 'unknown'}`,
      item_name: event?.name || 'Event Booking',
      affiliation: 'LA VIP Tours',
      item_brand: 'LA VIP Tours',
      item_category: 'Events',
      item_category2: event?.venue?.name || 'Entertainment',
      item_variant: `${booking?.adultCount || 1}_adults_${booking?.childCount || 0}_children`,
      price: Number(pricing?.totalAmount || 0),
      quantity: 1,
      currency: pricing?.currency || 'USD',
    }
  } catch (_error) {
    return {
      item_id: 'event_fallback',
      item_name: 'Event Booking',
      affiliation: 'LA VIP Tours',
      item_brand: 'LA VIP Tours',
      item_category: 'Events',
      item_category2: 'Entertainment',
      item_variant: '1_adults_0_children',
      price: 0,
      quantity: 1,
      currency: 'USD',
    }
  }
}

// ===== STANDARD GA4 ECOMMERCE EVENTS =====

/**
 * Track add_payment_info event
 * Triggered when a user submits their payment information
 */
export const trackAddPaymentInfo = (
  currency: string,
  value: number,
  items: GA4Item[],
  paymentType?: string,
  coupon?: string,
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'add_payment_info',
    ecommerce: {
      currency,
      value,
      payment_type: paymentType,
      coupon,
      items,
    },
  })
}

/**
 * Track add_shipping_info event
 * Triggered when a user submits their shipping information
 */
export const trackAddShippingInfo = (
  currency: string,
  value: number,
  items: GA4Item[],
  shippingTier?: string,
  coupon?: string,
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'add_shipping_info',
    ecommerce: {
      currency,
      value,
      shipping_tier: shippingTier,
      coupon,
      items,
    },
  })
}

/**
 * Track add_to_cart event
 * Triggered when a user adds items to cart
 */
export const trackAddToCart = (currency: string, value: number, items: GA4Item[]): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency,
      value,
      items,
    },
  })
}

/**
 * Track add_to_wishlist event
 * Triggered when a user adds items to a wishlist
 */
export const trackAddToWishlist = (currency: string, value: number, items: GA4Item[]): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'add_to_wishlist',
    ecommerce: {
      currency,
      value,
      items,
    },
  })
}

/**
 * Track begin_checkout event
 * Triggered when a user begins checkout
 */
export const trackBeginCheckout = (
  currency: string,
  value: number,
  items: GA4Item[],
  coupon?: string,
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency,
      value,
      coupon,
      items,
    },
  })
}

/**
 * Track purchase event
 * Triggered when a user completes a purchase
 */
export const trackPurchase = (
  transactionId: string,
  currency: string,
  value: number,
  items: GA4Item[],
  affiliation?: string,
  coupon?: string,
  shipping?: number,
  tax?: number,
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      affiliation,
      value,
      tax,
      shipping,
      currency,
      coupon,
      items,
    },
  })
}

/**
 * Track refund event
 * Triggered when a refund is issued
 */
export const trackRefund = (
  transactionId: string,
  currency: string,
  value: number,
  items?: GA4Item[],
  affiliation?: string,
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'refund',
    ecommerce: {
      transaction_id: transactionId,
      affiliation,
      currency,
      value,
      items,
    },
  })
}

/**
 * Track remove_from_cart event
 * Triggered when a user removes items from cart
 */
export const trackRemoveFromCart = (currency: string, value: number, items: GA4Item[]): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'remove_from_cart',
    ecommerce: {
      currency,
      value,
      items,
    },
  })
}

/**
 * Track select_item event
 * Triggered when a user selects an item from a list
 */
export const trackSelectItem = (
  itemListId: string,
  itemListName: string,
  items: GA4Item[],
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'select_item',
    ecommerce: {
      item_list_id: itemListId,
      item_list_name: itemListName,
      items,
    },
  })
}

/**
 * Track select_promotion event
 * Triggered when a user selects a promotion
 */
export const trackSelectPromotion = (
  creativeName?: string,
  creativeSlot?: string,
  promotionId?: string,
  promotionName?: string,
  items?: GA4Item[],
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'select_promotion',
    ecommerce: {
      creative_name: creativeName,
      creative_slot: creativeSlot,
      promotion_id: promotionId,
      promotion_name: promotionName,
      items,
    },
  })
}

/**
 * Track view_cart event
 * Triggered when a user views their cart
 */
export const trackViewCart = (currency: string, value: number, items: GA4Item[]): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'view_cart',
    ecommerce: {
      currency,
      value,
      items,
    },
  })
}

/**
 * Track view_item event
 * Triggered when a user views an item
 */
export const trackViewItem = (currency: string, value: number, items: GA4Item[]): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency,
      value,
      items,
    },
  })
}

/**
 * Track view_item_list event
 * Triggered when a user views a list of items
 */
export const trackViewItemList = (
  itemListId: string,
  itemListName: string,
  items: GA4Item[],
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'view_item_list',
    ecommerce: {
      item_list_id: itemListId,
      item_list_name: itemListName,
      items,
    },
  })
}

/**
 * Track view_promotion event
 * Triggered when a user views a promotion
 */
export const trackViewPromotion = (
  creativeName?: string,
  creativeSlot?: string,
  promotionId?: string,
  promotionName?: string,
  items?: GA4Item[],
): void => {
  pushToDataLayer({ ecommerce: null })

  pushToDataLayer({
    event: 'view_promotion',
    ecommerce: {
      creative_name: creativeName,
      creative_slot: creativeSlot,
      promotion_id: promotionId,
      promotion_name: promotionName,
      items,
    },
  })
}

/**
 * Track form_submit event
 * Custom event triggered when a contact form is submitted
 */
export const trackFormSubmit = (formId: string | number): void => {
  pushToDataLayer({
    event: 'form_submit',
    form_id: formId,
  })
}
