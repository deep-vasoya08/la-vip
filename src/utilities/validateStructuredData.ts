/**
 * Structured Data Validation Utilities
 * Helps validate and test structured data implementation
 */

import { generateTourMerchantSchema, generateEventMerchantSchema } from './merchantStructuredData'

/**
 * Validate that required merchant fields are present
 */
export function validateMerchantSchema(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if it's a Product schema
  if (schema['@type'] !== 'Product') {
    errors.push('Schema must be of type "Product" for merchant listings')
  }

  // Check required Product fields
  if (!schema.name) {
    errors.push('Missing required field: name')
  }

  if (!schema.description) {
    errors.push('Missing required field: description')
  }

  if (!schema.offers) {
    errors.push('Missing required field: offers')
  } else {
    // Check required Offer fields
    const offers = schema.offers
    if (!offers.price) {
      errors.push('Missing required field: offers.price')
    }
    if (!offers.priceCurrency) {
      errors.push('Missing required field: offers.priceCurrency')
    }
    if (!offers.availability) {
      errors.push('Missing required field: offers.availability')
    }
    if (!offers.hasMerchantReturnPolicy) {
      errors.push('Missing required field: offers.hasMerchantReturnPolicy')
    }
    if (!offers.shippingDetails) {
      errors.push('Missing required field: offers.shippingDetails')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate test data for validation
 */
export function generateTestTourData() {
  return {
    id: 1,
    name: 'Hollywood VIP Tour',
    shortDescription: 'Experience the glamour of Hollywood with our exclusive VIP tour',
    tourAvatarImage: {
      url: 'https://example.com/tour-image.jpg',
      alt: 'Hollywood VIP Tour',
    },
    schedules: [
      {
        pickups: [
          {
            adult_price: 299,
            children_price: 199,
          },
        ],
      },
    ],
  }
}

export function generateTestEventData() {
  return {
    id: 1,
    name: 'Celebrity Awards Night',
    description: 'Join us for an exclusive celebrity awards night experience',
    eventAvatarImage: {
      url: 'https://example.com/event-image.jpg',
      alt: 'Celebrity Awards Night',
    },
    schedules: [
      {
        event_date_time: '2024-12-31T20:00:00Z',
        pickups: [
          {
            adult_price: 499,
            children_price: 299,
          },
        ],
      },
    ],
  }
}

/**
 * Test the merchant schema generation
 */
export function testMerchantSchemas() {
  console.log('Testing Merchant Schema Generation...\n')

  // Test Tour Schema
  const testTour = generateTestTourData()
  const tourSchema = generateTourMerchantSchema(testTour, '1-hollywood-vip-tour')
  const tourValidation = validateMerchantSchema(tourSchema)

  console.log('Tour Schema Validation:')
  console.log('Valid:', tourValidation.isValid)
  if (!tourValidation.isValid) {
    console.log('Errors:', tourValidation.errors)
  }
  console.log('')

  // Test Event Schema
  const testEvent = generateTestEventData()
  const eventSchema = generateEventMerchantSchema(testEvent, '1-celebrity-awards-night')
  const eventValidation = validateMerchantSchema(eventSchema)

  console.log('Event Schema Validation:')
  console.log('Valid:', eventValidation.isValid)
  if (!eventValidation.isValid) {
    console.log('Errors:', eventValidation.errors)
  }
  console.log('')

  return {
    tour: { schema: tourSchema, validation: tourValidation },
    event: { schema: eventSchema, validation: eventValidation },
  }
}

/**
 * Generate structured data for testing in Google's Rich Results Test
 */
export function generateTestStructuredData() {
  const testTour = generateTestTourData()
  const testEvent = generateTestEventData()

  return {
    tour: generateTourMerchantSchema(testTour, '1-hollywood-vip-tour'),
    event: generateEventMerchantSchema(testEvent, '1-celebrity-awards-night'),
  }
}
