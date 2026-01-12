const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://example.com'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: [
    /* '/posts-sitemap.xml', */ '/pages-sitemap.xml',
    '/events-sitemap.xml',
    '/tours-sitemap.xml',
    '/*' /* '/posts/*' */,
  ], // Post routes commented out
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/pages-sitemap.xml`,
      `${SITE_URL}/events-sitemap.xml`,
      `${SITE_URL}/tours-sitemap.xml`,
      /* `${SITE_URL}/posts-sitemap.xml` */
    ], // Added events and tours sitemaps
  },
}
