/**
 * Merchant Structured Data utilities for LA VIP Tours
 * Handles Product schema with required fields for Google Merchant listings
 */

export interface MerchantProductData {
  name: string
  description: string
  image?: string
  price: number
  currency: string
  url: string
  availability:
    | 'https://schema.org/InStock'
    | 'https://schema.org/OutOfStock'
    | 'https://schema.org/PreOrder'
  category: string
  brand: string
  sku?: string
  gtin?: string
  mpn?: string
  condition:
    | 'https://schema.org/NewCondition'
    | 'https://schema.org/UsedCondition'
    | 'https://schema.org/RefurbishedCondition'
  validFrom: string
  priceValidUntil: string
}

export interface MerchantReturnPolicy {
  '@type': 'MerchantReturnPolicy'
  returnPolicyCategory:
    | 'https://schema.org/MerchantReturnFiniteReturnWindow'
    | 'https://schema.org/MerchantReturnNotPermitted'
  merchantReturnDays?: number
  returnMethod?:
    | 'https://schema.org/ReturnByMail'
    | 'https://schema.org/ReturnInStore'
    | 'https://schema.org/ReturnAtKiosk'
  returnFees?: 'https://schema.org/FreeReturn' | 'https://schema.org/ReturnShippingFees'
  returnLabelSource?:
    | 'https://schema.org/ReturnLabelDownloadAndPrint'
    | 'https://schema.org/ReturnLabelInBox'
  returnInstructions?: string
}

export interface ShippingDetails {
  '@type': 'OfferShippingDetails'
  shippingRate: {
    '@type': 'MonetaryAmount'
    value: number
    currency: string
  }
  deliveryTime: {
    '@type': 'ShippingDeliveryTime'
    handlingTime: {
      '@type': 'QuantitativeValue'
      minValue: number
      maxValue: number
      unitCode: 'DAY'
    }
    transitTime: {
      '@type': 'QuantitativeValue'
      minValue: number
      maxValue: number
      unitCode: 'DAY'
    }
  }
  shippingDestination: {
    '@type': 'DefinedRegion'
    addressCountry: string
    addressRegion?: string
    addressLocality?: string
    postalCode?: string
  }
  doesNotShip?: boolean
}

/**
 * Generate merchant return policy for tours and events
 */
export function generateMerchantReturnPolicy(): MerchantReturnPolicy {
  return {
    '@type': 'MerchantReturnPolicy',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7, // 7-day return policy for tours/events
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
    returnLabelSource: 'https://schema.org/ReturnLabelDownloadAndPrint',
    returnInstructions:
      'Contact customer service for return authorization. Full refund available up to 7 days before tour/event date.',
  }
}

/**
 * Generate shipping details for tours and events (mostly digital/experience products)
 */
export function generateShippingDetails(currency: string = 'USD'): ShippingDetails {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: 0,
      currency: currency,
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 0,
        unitCode: 'DAY',
      },
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'US',
      addressRegion: 'CA',
      addressLocality: 'Los Angeles',
    },
    doesNotShip: true, // Tours and events are experiences, not physical products
  }
}

/**
 * Generate complete Product schema for merchant listings
 */
export function generateMerchantProductSchema(productData: MerchantProductData) {
  const returnPolicy = generateMerchantReturnPolicy()
  const shippingDetails = generateShippingDetails(productData.currency)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    description: productData.description,
    image: productData.image,
    sku: productData.sku,
    gtin: productData.gtin,
    mpn: productData.mpn,
    brand: {
      '@type': 'Brand',
      name: productData.brand,
    },
    category: productData.category,
    condition: productData.condition,
    offers: {
      '@type': 'Offer',
      name: productData.name,
      description: productData.description,
      price: productData.price.toString(),
      priceCurrency: productData.currency,
      availability: productData.availability,
      url: productData.url,
      validFrom: productData.validFrom,
      priceValidUntil: productData.priceValidUntil,
      hasMerchantReturnPolicy: returnPolicy,
      shippingDetails: shippingDetails,
      seller: {
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
    },
  }
}

/**
 * Generate merchant product schema for tours
 */
export function generateTourMerchantSchema(tour: any, tourString: string) {
  const title = tour.name || 'Exclusive LA Tour'
  const shortDescription = tour.shortDescription || `Experience ${title} with LA VIP Tours`
  const startingPrice = tour.pickups?.[0]?.adult_price || 0
  const currency = 'USD'

  // Generate image URL if available
  let imageUrl = ''
  if (
    tour?.tourAvatarImage &&
    typeof tour.tourAvatarImage === 'object' &&
    tour.tourAvatarImage.url
  ) {
    imageUrl = tour.tourAvatarImage.url
  }

  const productData: MerchantProductData = {
    name: title,
    description: shortDescription,
    image: imageUrl,
    price: startingPrice,
    currency: currency,
    url: `https://laviptours.com/tours/${tourString}`,
    availability:
      startingPrice > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    category: 'Tourism',
    brand: 'LA VIP Tours',
    sku: `TOUR-${tour.id}`,
    condition: 'https://schema.org/NewCondition',
    validFrom: new Date().toISOString(),
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
  }

  return generateMerchantProductSchema(productData)
}

/**
 * Generate merchant product schema for events
 */
export function generateEventMerchantSchema(event: any, eventString: string) {
  const title = event.name || 'Exclusive LA Event'
  const description = event.description || `Experience ${title} with LA VIP Tours`
  const startingPrice = event.schedules?.[0]?.pickups?.[0]?.adult_price || 0
  const currency = 'USD'

  // Generate image URL if available
  let imageUrl = ''
  if (
    event?.eventAvatarImage &&
    typeof event.eventAvatarImage === 'object' &&
    event.eventAvatarImage.url
  ) {
    imageUrl = event.eventAvatarImage.url
  }

  const productData: MerchantProductData = {
    name: title,
    description: description,
    image: imageUrl,
    price: startingPrice,
    currency: currency,
    url: `https://laviptours.com/events/${eventString}`,
    availability:
      startingPrice > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    category: 'Entertainment',
    brand: 'LA VIP Tours',
    sku: `EVENT-${event.id}`,
    condition: 'https://schema.org/NewCondition',
    validFrom: new Date().toISOString(),
    priceValidUntil:
      event.schedules?.[0]?.event_date_time ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return generateMerchantProductSchema(productData)
}
