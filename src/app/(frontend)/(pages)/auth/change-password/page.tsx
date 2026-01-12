import type { Metadata } from 'next'
import ChangePasswordClient from './page.client'

export const generateMetadata = (): Metadata => {
  return {
    title: 'Change Password | LA VIP Tours',
    description:
      'Update your LA VIP Tours account password. Secure your account with a new password to protect your exclusive VIP experiences.',
    keywords: [
      'LA VIP Tours change password',
      'update password',
      'password security',
      'account security',
      'new password',
      'password update',
      'secure account',
      'password management',
      'account protection',
      'login security',
    ].join(', '),
    authors: [{ name: 'LA VIP Tours' }],
    creator: 'LA VIP Tours',
    publisher: 'LA VIP Tours',
    openGraph: {
      title: 'Change Password | LA VIP Tours',
      description: 'Update your password to keep your LA VIP Tours account secure and protected.',
      type: 'website',
      url: '/auth/change-password',
      siteName: 'LA VIP Tours',
      locale: 'en_US',
      images: [
        {
          url: '/website-template-OG.webp',
          width: 1200,
          height: 630,
          alt: 'LA VIP Tours - Change Password',
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@LAVIPTours',
      creator: '@LAVIPTours',
      title: 'Change Password | LA VIP Tours',
      description: 'Update your password for enhanced LA VIP Tours account security.',
      images: [
        {
          url: '/website-template-OG.webp',
          alt: 'LA VIP Tours - Change Password',
        },
      ],
    },
    alternates: {
      canonical: '/auth/change-password',
    },
    robots: {
      index: false, // Password change pages shouldn't be indexed
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}

export default function ChangePasswordPage() {
  return <ChangePasswordClient />
}
