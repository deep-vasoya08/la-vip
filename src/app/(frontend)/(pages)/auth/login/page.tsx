import type { Metadata } from 'next'
import LoginClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Login | LA VIP Tours',
    description:
      'Login to your LA VIP Tours account to access your bookings, manage reservations, and enjoy exclusive VIP experiences in Los Angeles.',
    keywords: [
      'LA VIP Tours login',
      'sign in',
      'account access',
      'user login',
      'VIP tours account',
      'Los Angeles tours login',
      'booking access',
      'member login',
      'secure login',
      'account sign in',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Login | LA VIP Tours',
      description:
        'Access your LA VIP Tours account to manage bookings and exclusive VIP experiences.',
      type: 'website',
      url: '/auth/login',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Login',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Login | LA VIP Tours',
      description: 'Sign in to access your VIP Los Angeles tour experiences.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Login',
        },
      ],
    },
    alternates: {
      canonical: '/auth/login',
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

export default function LoginPage() {
  return <LoginClient />
}
