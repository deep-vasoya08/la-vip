/**
 * Utility functions to ensure real-time data by disabling caching
 */

// Use this for fetch operations to disable cache
export const fetchNoCacheOptions = {
  cache: 'no-store',
  next: {
    revalidate: 0,
    tags: ['dynamic-content'],
  },
} as const

// Use this for dynamic routes to disable caching
export const dynamicRouteConfig = {
  fetchCache: 'force-no-store',
  revalidate: 0,
  dynamicParams: true,
} as const

// Use this for API endpoints to set proper no-cache headers
export const setNoCacheHeaders = (headers: Headers): void => {
  headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
}
