import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL

    const results = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        enableMetadata: true,
      },
    })

    const dateFallback = new Date().toISOString()

    const defaultSitemap = [
      {
        loc: `${SITE_URL}/search`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/posts`,
        lastmod: dateFallback,
      },
      // Custom pages
      {
        loc: `${SITE_URL}/my-account`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/auth/login`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/auth/register`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/request-quote`,
        lastmod: dateFallback,
      },
      // Note: Password reset, change password, and unauthorized pages are excluded from sitemap
      // as they are private/functional pages that shouldn't be indexed
    ]

    const sitemap = results.docs
      ? results.docs
          .filter((page) => Boolean(page?.slug) && page?.enableMetadata !== false)
          .map((page) => {
            return {
              loc: page?.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page?.slug}`,
              lastmod: page.updatedAt || dateFallback,
            }
          })
      : []

    return [...defaultSitemap, ...sitemap]
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()

  return getServerSideSitemap(sitemap)
}
