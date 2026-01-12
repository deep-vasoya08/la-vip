import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

// Revalidate events sitemap when an event changes
export const revalidateEventsSitemap: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  try {
    // Check if status changed or if it's a new event
    const statusChanged = previousDoc?.status !== doc.status
    const isNewEvent = !previousDoc

    // Revalidate if:
    // 1. New event created
    // 2. Status changed (active/inactive/cancelled)
    // 3. Event name changed (affects URL slug)
    // 4. Event was updated and is active
    if (isNewEvent || statusChanged || previousDoc?.name !== doc.name || doc.status === 'active') {
      console.log(`🔄 Revalidating events sitemap due to event change: ${doc.name} (${doc.status})`)
      revalidateTag('events-sitemap')
    }
  } catch (error) {
    console.error('❌ Error revalidating events sitemap:', error)
  }
}

// Revalidate events sitemap when an event is deleted
export const revalidateEventsSitemapOnDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  try {
    console.log(`🔄 Revalidating events sitemap due to event deletion: ${doc.name}`)
    revalidateTag('events-sitemap')
  } catch (error) {
    console.error('❌ Error revalidating events sitemap on delete:', error)
  }
}
