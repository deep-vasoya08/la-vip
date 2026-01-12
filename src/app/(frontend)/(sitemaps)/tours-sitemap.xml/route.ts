import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getToursSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL

    const results = await payload.find({
      collection: 'tours',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    const sitemap = results.docs
      ? results.docs
          .filter((tour) => Boolean(tour?.id && tour?.name))
          .map((tour) => {
            // Generate the tour string in the same format as the dynamic route
            // Format: {id}-{name-slugified}
            const tourName = tour.name || 'tour'
            const tourSlug = tourName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single
              .trim()

            const tourString = `${tour.id}-${tourSlug}`

            return {
              loc: `${SITE_URL}/tours/${tourString}`,
              lastmod: tour.updatedAt || dateFallback,
            }
          })
      : []

    return sitemap
  },
  ['tours-sitemap'],
  {
    tags: ['tours-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getToursSitemap()

  return getServerSideSitemap(sitemap)
}
