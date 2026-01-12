import type { Metadata } from 'next'
import UnauthorizedClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Access Denied | LA VIP Tours',
    description:
      'Access denied. You do not have permission to view this page. Please contact LA VIP Tours for assistance or return to the homepage.',
    keywords: [
      'access denied',
      'unauthorized access',
      'permission required',
      'restricted area',
      'LA VIP Tours access',
      'login required',
      'authentication needed',
      'privileged access',
      'secure area',
      'access control',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Access Denied | LA VIP Tours',
      description: 'Access denied. You do not have permission to view this page.',
      type: 'website',
      url: '/unauthorized',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Access Denied',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Access Denied | LA VIP Tours',
      description: 'Access denied. You do not have permission to view this page.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Access Denied',
        },
      ],
    },
    alternates: {
      canonical: '/unauthorized',
    },
    robots: {
      index: false, // Error pages shouldn't be indexed
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}

export default function UnauthorizedPage() {
  return <UnauthorizedClient />
}
