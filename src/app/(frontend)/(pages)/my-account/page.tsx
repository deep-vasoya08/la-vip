import type { Metadata } from 'next'
import ProfilePage from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'My Account | LA VIP Tours',
    description:
      'Manage your LA VIP Tours account, view your bookings, track event and tour reservations, and access your exclusive VIP experiences.',
    keywords: [
      'LA VIP Tours account',
      'my bookings',
      'tour reservations',
      'event bookings',
      'VIP account dashboard',
      'Los Angeles tours account',
      'booking management',
      'VIP experiences',
      'account profile',
      'booking history',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'My Account | LA VIP Tours',
      description:
        'Manage your LA VIP Tours account, view your bookings, and access your exclusive VIP experiences.',
      type: 'website',
      url: '/my-account',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - My Account',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'My Account | LA VIP Tours',
      description: 'Manage your VIP tour bookings and exclusive Los Angeles experiences.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - My Account',
        },
      ],
    },
    alternates: {
      canonical: '/my-account',
    },
    robots: {
      index: false, // Private account pages shouldn't be indexed
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}

export default function MyAccountPage() {
  return <ProfilePage />
}
