import type { Metadata } from 'next'
import ForgotPasswordClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Forgot Password | LA VIP Tours',
    description:
      'Reset your LA VIP Tours account password. Enter your email address to receive a secure password reset link.',
    keywords: [
      'LA VIP Tours password reset',
      'forgot password',
      'reset password',
      'account recovery',
      'password help',
      'login help',
      'account access',
      'password assistance',
      'secure reset',
      'email reset',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Forgot Password | LA VIP Tours',
      description:
        'Reset your password to regain access to your LA VIP Tours account and exclusive experiences.',
      type: 'website',
      url: '/auth/forgot-password',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Password Reset',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Forgot Password | LA VIP Tours',
      description: 'Reset your password for LA VIP Tours account access.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Password Reset',
        },
      ],
    },
    alternates: {
      canonical: '/auth/forgot-password',
    },
    robots: {
      index: false, // Password reset pages shouldn't be indexed
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
