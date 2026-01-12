import type { GlobalAfterChangeHook, CollectionAfterChangeHook } from 'payload'
import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * A comprehensive revalidation hook that can be used to revalidate all relevant cache entries
 * when content is updated by an admin.
 */
export const revalidateAllContent: CollectionAfterChangeHook | GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}: {
  doc: Record<string, any>
  req: {
    payload: any
    context: {
      disableRevalidate?: boolean
      [key: string]: any
    }
  }
}) => {
  // Skip revalidation if explicitly disabled

  console.log('context.disableRevalidate revalidateAllContent', context.disableRevalidate)
  if (context.disableRevalidate) {
    return doc
  }

  // Log the revalidation event
  payload.logger.info(`Force revalidating all content cache`)

  // Revalidate common tags used in your application
  revalidateTag('global_header')
  revalidateTag('global_footer')
  revalidateTag('pages-sitemap')
  revalidateTag('posts-sitemap')
  revalidateTag('pages-content') // Revalidate dynamic page content

  // Revalidate other potential global tags
  revalidateTag('global_meta_information')
  revalidateTag('global_navigation')
  revalidateTag('global_settings')
  revalidateTag('home_page') // Add specific tag for home page
  revalidateTag('dashboard') // Add specific tag for dashboard

  // Revalidate common paths with multiple strategies
  revalidatePath('/', 'layout') // Clear complete layout cache
  revalidatePath('/', 'page') // Force revalidate page-level cache

  // Specifically revalidate the dashboard page
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')

  // Return the document
  return doc
}

/**
 * Use this function in your Payload config to force cache purging.
 * This can be attached to admin actions or directly called from your API routes.
 */
export const forceCacheRevalidation = async () => {
  console.log('Force revalidating all cache')

  // Revalidate common tags
  revalidateTag('global_header')
  revalidateTag('global_footer')
  revalidateTag('pages-sitemap')
  revalidateTag('posts-sitemap')
  revalidateTag('pages-content') // Revalidate dynamic page content
  revalidateTag('global_meta_information')
  revalidateTag('global_navigation')
  revalidateTag('global_settings')
  revalidateTag('home_page') // Add specific tag for home page
  revalidateTag('dashboard') // Add specific tag for dashboard

  // Apply more aggressive cache invalidation strategies
  revalidatePath('/', 'layout') // Clear complete layout cache
  revalidatePath('/', 'page') // Force revalidate page-level cache

  // Specifically revalidate the dashboard page
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard', 'page')
}
