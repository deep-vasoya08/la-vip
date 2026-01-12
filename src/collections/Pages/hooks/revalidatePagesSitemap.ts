import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Revalidate pages sitemap when a page changes
export const revalidatePagesSitemap: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  try {
    // Check if this is a new page
    const isNewPage = !previousDoc

    // Check if enableMetadata changed
    const metadataChanged = previousDoc?.enableMetadata !== doc.enableMetadata

    // Check if slug changed (affects URL)
    const slugChanged = previousDoc?.slug !== doc.slug

    // Check if title changed (might affect SEO)
    const titleChanged = previousDoc?.title !== doc.title

    // Check if publish status changed
    const statusChanged = previousDoc?._status !== doc._status

    // Revalidate if:
    // 1. New page created
    // 2. enableMetadata changed (affects sitemap inclusion)
    // 3. Slug changed (affects URL in sitemap)
    // 4. Title changed (might affect SEO)
    // 5. Publish status changed
    // 6. Page is published and has metadata enabled
    if (
      isNewPage ||
      metadataChanged ||
      slugChanged ||
      titleChanged ||
      statusChanged ||
      (doc._status === 'published' && doc.enableMetadata !== false)
    ) {
      const reason = isNewPage
        ? 'new page'
        : metadataChanged
          ? 'metadata setting changed'
          : slugChanged
            ? 'slug changed'
            : titleChanged
              ? 'title changed'
              : statusChanged
                ? 'status changed'
                : 'page updated'

      console.log(
        `🔄 Revalidating pages sitemap due to: ${reason} - Page: ${doc.title} (enableMetadata: ${doc.enableMetadata})`,
      )
      revalidateTag('pages-sitemap')
    }
  } catch (error) {
    console.error('❌ Error revalidating pages sitemap:', error)
  }
}

// Revalidate pages sitemap when a page is deleted
export const revalidatePagesSitemapOnDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  try {
    console.log(`🔄 Revalidating pages sitemap due to page deletion: ${doc.title}`)
    revalidateTag('pages-sitemap')
  } catch (error) {
    console.error('❌ Error revalidating pages sitemap on delete:', error)
  }
}
