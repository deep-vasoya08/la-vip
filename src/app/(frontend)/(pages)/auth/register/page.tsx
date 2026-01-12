import type { Metadata } from 'next'
import RegisterClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Register | LA VIP Tours',
    description:
      'Create your LA VIP Tours account to access exclusive VIP experiences, manage bookings, and enjoy premium Los Angeles tour services.',
    keywords: [
      'LA VIP Tours register',
      'sign up',
      'create account',
      'new user registration',
      'VIP tours account',
      'Los Angeles tours signup',
      'member registration',
      'account creation',
      'join LA VIP',
      'exclusive access',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Register | LA VIP Tours',
      description:
        'Join LA VIP Tours to access exclusive experiences and manage your premium Los Angeles tour bookings.',
      type: 'website',
      url: '/auth/register',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Register',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Register | LA VIP Tours',
      description: 'Create your account for exclusive VIP Los Angeles tour experiences.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Register',
        },
      ],
    },
    alternates: {
      canonical: '/auth/register',
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
  }
}

export default function RegisterPage() {
  return <RegisterClient />
}
