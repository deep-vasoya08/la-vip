/**
 * Shared SEO utilities for LA VIP Tours
 */

export interface SEOConfig {
  siteName: string
  siteUrl: string
  defaultImage: string
  socialMedia: {
    twitter: string
    facebook: string
    instagram: string
  }
  organization: {
    name: string
    phone: string
    email: string
    address: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }
}

export const seoConfig: SEOConfig = {
  siteName: 'LA VIP Tours',
  siteUrl: 'https://laviptours.com',
  defaultImage: 'https://laviptours.com/logo.png',
  socialMedia: {
    twitter: '@LAVIPTours',
    facebook: 'https://www.facebook.com/LAVIPTours',
    instagram: 'https://www.instagram.com/LAVIPTours',
  },
  organization: {
    name: 'LA VIP Tours',
    phone: '+1-XXX-XXX-XXXX',
    email: 'info@laviptours.com',
    address: {
      street: '123 Hollywood Blvd',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      postalCode: '90210',
    },
  },
}

/**
 * Truncate text to specified length for SEO descriptions
 */
export function truncateText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3).trim() + '...'
}

/**
 * Clean and prepare description text for SEO
 */
export function cleanDescription(description: any): string {
  if (!description) return ''

  if (typeof description === 'string') {
    return description
  }

  // Handle rich text content - extract plain text
  if (typeof description === 'object' && description.root) {
    try {
      // Simple extraction of text from Lexical editor format
      const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || ''
        if (node.children) {
          return node.children.map(extractText).join(' ')
        }
        return ''
      }
      return extractText(description.root)
    } catch {
      return String(description)
    }
  }

  return String(description)
}

/**
 * Generate duration text for SEO
 */
export function formatDuration(hours: number): string {
  if (hours === 1) return '1 hour'
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  return `${hours} hours`
}

/**
 * Generate formatted price display
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
