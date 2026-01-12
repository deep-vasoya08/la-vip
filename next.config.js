import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.NEXT_PUBLIC_SERVER_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      {
        hostname: 'lh3.googleusercontent.com',
        protocol: 'https',
      },
      {
        protocol: 'https',
        hostname: 'test.laviptours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'laviptours.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: `${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`,
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.CLOUDFRONT_URL
          ? new URL(process.env.CLOUDFRONT_URL).hostname
          : 'd2iwh33y2u19tw.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.tripadvisor.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.tacdn.com',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  // Fix for CSS files error
  webpack: (config) => {
    return config
  },
  experimental: {
    // Disable certain experimental features that might be causing issues
  },
  serverExternalPackages: ['@payloadcms/payload', '@payloadcms/db-postgres'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
