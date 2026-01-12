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
 * Generate optimized image object for metadata
 */
export function generateImageMetadata(imageUrl: string, alt: string) {
  return {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: alt,
    type: 'image/jpeg',
  }
}

/**
 * Generate common organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TourOperator',
    name: seoConfig.organization.name,
    url: seoConfig.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: seoConfig.defaultImage,
    },
    description:
      'Premier VIP tour and event operator in Los Angeles offering exclusive, luxury experiences.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: seoConfig.organization.address.street,
      addressLocality: seoConfig.organization.address.city,
      addressRegion: seoConfig.organization.address.state,
      addressCountry: seoConfig.organization.address.country,
      postalCode: seoConfig.organization.address.postalCode,
    },
    telephone: seoConfig.organization.phone,
    email: seoConfig.organization.email,
    sameAs: [
      seoConfig.socialMedia.facebook,
      seoConfig.socialMedia.instagram,
      `https://www.twitter.com/${seoConfig.socialMedia.twitter.replace('@', '')}`,
    ],
  }
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate common robots configuration
 */
export function generateRobotsConfig() {
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1 as const,
      'max-image-preview': 'large' as const,
      'max-snippet': -1 as const,
    },
  }
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

/**
 * Generate duration text for SEO
 */
export function formatDuration(hours: number): string {
  if (hours === 1) return '1 hour'
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  return `${hours} hours`
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
 * Generate SEO-friendly keywords array
 */
export function generateKeywords(
  baseKeywords: string[],
  title: string,
  location?: string,
): string[] {
  const keywords = [...baseKeywords]

  // Add title variations
  keywords.push(title.toLowerCase())
  keywords.push(`${title} experience`)
  keywords.push(`${title} booking`)

  // Add location-based keywords
  if (location) {
    keywords.push(`${location} tours`)
    keywords.push(`${location} events`)
  }

  return [...new Set(keywords)] // Remove duplicates
}
