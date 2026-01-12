import type { Metadata } from 'next'

import type { Media, Page, Config } from '../payload-types'
// Post type import removed

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> /* | Partial<Post> */ | null
}): Promise<Metadata> => {
  const { doc } = args

  // Check if metadata is enabled for this page
  if (!doc?.enableMetadata) {
    // Return minimal metadata with noindex when disabled
    return {
      title: 'LA VIP Tours',
      description: undefined,
      openGraph: undefined,
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title ? doc?.meta?.title : 'LA VIP Tours'

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
