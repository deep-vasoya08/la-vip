import { revalidateTag } from 'next/cache'

/**
 * Utility function to revalidate the pages sitemap cache
 * Can be called from anywhere in the application
 */
export const revalidatePagesSitemapCache = async () => {
  try {
    revalidateTag('pages-sitemap')
    console.log('🔄 Pages sitemap cache revalidated')
    return { success: true }
  } catch (error) {
    console.error('❌ Error revalidating pages sitemap cache:', error)
    return { success: false, error }
  }
}

/**
 * Utility function to trigger sitemap revalidation via API
 * Useful for external systems or manual triggers
 */
export const triggerPagesSitemapRevalidation = async (baseUrl?: string) => {
  try {
    const url = baseUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const response = await fetch(`${url}/api/revalidate-pages-sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.REVALIDATION_TOKEN && {
          Authorization: `Bearer ${process.env.REVALIDATION_TOKEN}`,
        }),
      },
    })

    const result = await response.json()

    if (response.ok) {
      console.log('🔄 Pages sitemap revalidated via API:', result)
      return { success: true, result }
    } else {
      console.error('❌ API revalidation failed:', result)
      return { success: false, error: result }
    }
  } catch (error) {
    console.error('❌ Error triggering sitemap revalidation:', error)
    return { success: false, error }
  }
}
