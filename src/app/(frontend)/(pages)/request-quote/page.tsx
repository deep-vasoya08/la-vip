import type { Metadata } from 'next'
// import RequestQuoteClient from './RequestQuoteClient'
import { generateMerchantProductSchema } from '@/utilities/merchantStructuredData'
import RequestQuoteClient from '@/blocks/RequestQuote/Component.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Request a Quote | LA VIP Tours',
    description:
      'LA VIP Tours & Charter offers luxury bus rental services with vehicles including Mercedez Benz Sprinter Vans, Minibus, Mini-coach or Motorcoach',
    keywords: [
      'LA VIP Tours quote',
      'Los Angeles tour pricing',
      'VIP tour packages',
      'custom LA tours',
      'private tour quotes',
      'luxury tour pricing',
      'celebrity tour packages',
      'Hollywood tour quotes',
      'Beverly Hills tour pricing',
      'exclusive LA experiences',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Request a Quote | LA VIP Tours',
      description:
        'LA VIP Tours & Charter offers luxury bus rental services with vehicles including Mercedez Benz Sprinter Vans, Minibus, Mini-coach or Motorcoach',
      type: 'website',
      url: '/request-quote',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/favicon.svg',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Request Quote',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Request a Quote | LA VIP Tours',
      description: 'Get a personalized quote for your exclusive Los Angeles VIP tour experience.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Request Quote',
        },
      ],
    },
    alternates: {
      canonical: '/request-quote',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'script:ld+json': JSON.stringify([
        // Merchant Product Schema (for Google Merchant listings)
        generateMerchantProductSchema({
          name: 'LA VIP Tours Quote Request Service',
          description:
            'Request a personalized quote for exclusive Los Angeles VIP tour experiences',
          price: 0, // Free quote request
          currency: 'USD',
          url: 'https://laviptours.com/request-quote',
          availability: 'https://schema.org/InStock',
          category: 'Tourism Services',
          brand: 'LA VIP Tours',
          sku: 'QUOTE-REQUEST',
          condition: 'https://schema.org/NewCondition',
          validFrom: new Date().toISOString(),
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        // Service Schema (for service-specific information)
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'LA VIP Tours Quote Request',
          description:
            'Request a personalized quote for exclusive Los Angeles VIP tour experiences',
          provider: {
            '@type': 'TourOperator',
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
          areaServed: {
            '@type': 'City',
            name: 'Los Angeles',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Los Angeles',
              addressRegion: 'California',
              addressCountry: 'United States',
            },
          },
          serviceType: 'VIP Tour Services',
          category: 'Tourism',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://laviptours.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Request Quote',
              item: 'https://laviptours.com/request-quote',
            },
          ],
        },
      ]),
    },
  }
}

export default function RequestQuote() {
  return <RequestQuoteClient requireAuthentication={false} />
}
