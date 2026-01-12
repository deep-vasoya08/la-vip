import type { Metadata } from 'next'
import ResetPasswordClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Reset Password | LA VIP Tours',
    description:
      'Complete your password reset for LA VIP Tours. Enter your new password to regain access to your account and exclusive experiences.',
    keywords: [
      'LA VIP Tours password reset',
      'new password',
      'password change',
      'account recovery',
      'secure reset',
      'password update',
      'account restoration',
      'login recovery',
      'reset completion',
      'password confirmation',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Reset Password | LA VIP Tours',
      description: 'Complete your password reset to regain access to your LA VIP Tours account.',
      type: 'website',
      url: '/auth/reset-password',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Reset Password',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Reset Password | LA VIP Tours',
      description: 'Complete your password reset for LA VIP Tours account access.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Reset Password',
        },
      ],
    },
    alternates: {
      canonical: '/auth/reset-password',
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

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
