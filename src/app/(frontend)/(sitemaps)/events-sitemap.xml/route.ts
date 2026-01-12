import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getEventsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL

    const results = await payload.find({
      collection: 'events',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        status: {
          equals: 'active',
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    const sitemap = results.docs
      ? results.docs
          .filter((event) => Boolean(event?.id && event?.name && event?.status === 'active'))
          .map((event) => {
            // Generate the event string in the same format as the dynamic route
            // Format: {id}-{name-slugified}
            const eventName = event.name || 'event'
            const eventSlug = eventName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single
              .trim()

            const eventString = `${event.id}-${eventSlug}`

            return {
              loc: `${SITE_URL}/events/${eventString}`,
              lastmod: event.updatedAt || dateFallback,
            }
          })
      : []

    return sitemap
  },
  ['events-sitemap'],
  {
    tags: ['events-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getEventsSitemap()

  return getServerSideSitemap(sitemap)
}
